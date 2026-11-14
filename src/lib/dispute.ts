import { z } from "zod";
import { anthropic, jsonFromText, MODEL, UserError } from "./anthropic";
import { LETTER_SYSTEM, LETTER_TOOL } from "./prompts/letter";
import { DisputePack, type BillDoc, type Deadline, type EobDoc, type Flag, type Summary } from "./schemas";

export { DisputePack, type Deadline } from "./schemas";

/** Deadlines are rule-based, not generated, so they are never invented. */
export function deadlinesFor(flags: Flag[], bill: BillDoc): Deadline[] {
  const d: Deadline[] = [
    { key: "callBilling", title: "Call the billing office", detail: "Ask them to put the account on hold while the review is open, so it doesn't go to collections.", daysFromNow: 0 },
    { key: "sendLetter", title: "Mail or upload the dispute letter", detail: "Keep a copy and note the date you sent it.", daysFromNow: 1 },
    { key: "followUp", title: "Follow up if you haven't heard back", detail: "Call again and reference your first call and your letter.", daysFromNow: 30 },
  ];
  if (bill.dueDate)
    d.push({
      key: "dueDate",
      vars: { date: bill.dueDate },
      title: `Bill due date on the statement: ${bill.dueDate}`,
      detail: "Ask for the due date to be extended while the bill is under review.",
      daysFromNow: null,
    });
  if (flags.some((f) => ["LINE_NOT_ON_EOB", "NO_INSURANCE_APPLIED", "POSSIBLE_SURPRISE_BILL"].includes(f.ruleId))) {
    d.push({
      key: "appeal",
      title: "Insurer appeal window",
      detail: "For most job-based plans you can file an internal appeal with your insurer within 180 days of the EOB/denial notice.",
      daysFromNow: null,
    });
  }
  if (flags.some((f) => f.ruleId === "POSSIBLE_SURPRISE_BILL")) {
    d.push({ key: "nsa", title: "No Surprises Act help", detail: "Questions or complaints: cms.gov/nosurprises or 1-800-985-3059.", daysFromNow: null });
  }
  return d;
}

export async function writeDisputePack(bill: BillDoc, eobs: EobDoc[], flags: Flag[], summary: Summary): Promise<DisputePack> {
  const facts = {
    provider: bill.providerName,
    statementDate: bill.statementDate,
    dueDate: bill.dueDate,
    billBalance: summary.billBalance,
    eobPatientResponsibility: summary.eobPatientResponsibility,
    disputableTotal: summary.disputableTotal,
    bill: { lines: bill.lines, insurancePaid: bill.insurancePaid, adjustments: bill.adjustments },
    eobs: eobs.map((e) => ({ insurer: e.insurerName, total: e.totalPatientResponsibility, lines: e.lines })),
    flags: flags.map((f) => ({ ...f, billLineIds: f.billLineIds, eobLineIds: f.eobLineIds })),
  };
  const messages: Parameters<ReturnType<typeof anthropic>["messages"]["create"]>[0]["messages"] = [
    { role: "user", content: `Write the dispute pack for this case. Data:\n${JSON.stringify(facts, null, 1)}` },
  ];

  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await anthropic().messages.create({
        model: MODEL(),
        max_tokens: 6000,
        system: LETTER_SYSTEM,
        tools: [LETTER_TOOL],
        tool_choice: { type: "auto" },
        messages,
      });
    } catch (err) {
      if (err instanceof UserError) throw err;
      console.error("[letter] model call failed", (err as { status?: number }).status ?? (err as Error).name);
      throw new UserError("Writing your letter took too long. Please try again.", 502, "letterFailed");
    }
    const call = res.content.find((c) => c.type === "tool_use");
    const parsed = DisputePack.safeParse(call?.type === "tool_use" ? call.input : jsonFromText(res.content));
    if (parsed.success) return { ...parsed.data, deadlines: deadlinesFor(flags, bill) };
    if (attempt === 0 && call?.type !== "tool_use") {
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: `Please call the ${LETTER_TOOL.name} tool now.` });
    } else if (attempt === 0 && call?.type === "tool_use") {
      messages.push({ role: "assistant", content: res.content });
      messages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: call.id, is_error: true, content: `Invalid output, fix and retry:\n${z.prettifyError(parsed.error)}` }],
      });
    }
  }
  throw new UserError("We couldn't write the letter this time. Please try again.", 502, "letterFailed");
}
