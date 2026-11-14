import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { BillDoc, EobDoc } from "./schemas";
import { BILL_SYSTEM, BILL_TOOL, EOB_SYSTEM, EOB_TOOL } from "./prompts/extract";

export const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

/** A user-facing error: its message is safe to show in the UI. */
export class UserError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new UserError("The AI service isn't configured on this server (missing ANTHROPIC_API_KEY).", 503);
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 90_000, maxRetries: 1 });
  return client;
}

export type DocInput =
  | { kind: "file"; mediaType: string; base64: string }
  | { kind: "text"; text: string };

type ContentBlock = Anthropic.Messages.ContentBlockParam;

function toBlocks(docs: DocInput[]): ContentBlock[] {
  return docs.map((d): ContentBlock => {
    if (d.kind === "text") return { type: "text", text: `Document text (pasted by the user):\n\n${d.text}` };
    if (d.mediaType === "application/pdf") {
      return { type: "document", source: { type: "base64", media_type: "application/pdf", data: d.base64 } };
    }
    return {
      type: "image",
      source: { type: "base64", media_type: d.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: d.base64 },
    };
  });
}

/** Calls the model with a forced tool, validates with zod, and retries once with the validation errors. */
async function extractWithTool<T>(
  system: string,
  tool: typeof BILL_TOOL | typeof EOB_TOOL,
  docs: DocInput[],
  instruction: string,
  schema: z.ZodType<T>,
  label: string,
): Promise<T> {
  const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: [...toBlocks(docs), { type: "text", text: instruction }] }];

  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Anthropic.Messages.Message;
    try {
      res = await anthropic().messages.create({
        model: MODEL(),
        max_tokens: 8000,
        system,
        tools: [tool],
        tool_choice: { type: "tool", name: tool.name },
        messages,
      });
    } catch (err) {
      if (err instanceof UserError) throw err;
      const status = (err as { status?: number }).status;
      // Log the status only — never the document content.
      console.error(`[extract:${label}] model call failed`, status ?? (err as Error).name);
      if (status === 401) throw new UserError("The AI service rejected the server's API key.", 503);
      if (status === 429 || status === 529) throw new UserError("The AI service is busy right now. Please try again in a minute.", 503);
      if (status === 400 && /credit/i.test(String((err as Error).message))) throw new UserError("The AI service is out of credits on this server.", 503);
      throw new UserError("Reading the document took too long or failed. Please try again.", 502);
    }
    const call = res.content.find((c) => c.type === "tool_use");
    const input = (call?.type === "tool_use" ? call.input : {}) as Record<string, unknown>;

    if (input.readable === false) {
      throw new UserError(
        `We couldn't read your ${label}${input.problem ? ` (${String(input.problem).slice(0, 140)})` : ""}. Try a clearer photo or paste the text.`,
        422,
      );
    }

    const parsed = schema.safeParse(input);
    if (parsed.success) return parsed.data;

    if (attempt === 0 && call) {
      messages.push({ role: "assistant", content: res.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: call.id,
            is_error: true,
            content: `The data didn't pass validation. Fix these problems and call ${tool.name} again:\n${z.prettifyError(parsed.error)}`,
          },
        ],
      });
      continue;
    }
    console.error(`[extract:${label}] invalid JSON after retry`);
    throw new UserError(`We couldn't read your ${label} reliably. Try a clearer photo or paste the text.`, 422);
  }
  throw new UserError("Extraction failed.", 500);
}

const BillToolResult = BillDoc.omit({ lines: true }).extend({
  lines: z.array(BillDoc.shape.lines.element.omit({ id: true })),
});
const EobToolResult = z.object({
  eobs: z.array(
    EobDoc.omit({ lines: true }).extend({ lines: z.array(EobDoc.shape.lines.element.omit({ id: true })) }),
  ).min(1, "At least one claim is required"),
});

export async function extractBill(docs: DocInput[]): Promise<BillDoc> {
  const r = await extractWithTool(BILL_SYSTEM, BILL_TOOL, docs, "Extract this medical bill with the record_bill tool.", BillToolResult, "bill");
  return { ...r, lines: r.lines.map((l, i) => ({ ...l, id: `B${i + 1}` })) };
}

export async function extractEobs(docs: DocInput[]): Promise<EobDoc[]> {
  const r = await extractWithTool(EOB_SYSTEM, EOB_TOOL, docs, "Extract this Explanation of Benefits with the record_eobs tool.", EobToolResult, "EOB");
  return r.eobs.map((e) => ({ ...e, lines: e.lines.map((l, i) => ({ ...l, id: `E${i + 1}` })) }));
}
