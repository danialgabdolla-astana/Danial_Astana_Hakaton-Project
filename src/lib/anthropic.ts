import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { BillDoc, EobDoc } from "./schemas";
import { BILL_SYSTEM, BILL_TOOL, EOB_SYSTEM, EOB_TOOL } from "./prompts/extract";

export const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export type ErrorVars = Record<string, string | number>;

/**
 * A user-facing error: its message (English) is safe to show in the UI. `code` + `vars` let the client show the
 * same message in the user's language; unknown codes fall back to the English message.
 */
export class UserError extends Error {
  constructor(
    message: string,
    public status = 400,
    public code = "generic",
    public vars: ErrorVars = {},
  ) {
    super(message);
  }
  toJSON() {
    return { error: this.message, code: this.code, vars: this.vars };
  }
}

/** JSON body for an error response: `{ error, code, vars }`. */
export function errorBody(message: string, code: string, vars: ErrorVars = {}) {
  return { error: message, code, vars };
}

let client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new UserError("The AI service isn't configured on this server (missing ANTHROPIC_API_KEY).", 503, "notConfigured");
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

const PHOTO_HINT = " If it’s a photo, try a clearer one, or paste the text instead.";

/**
 * Plain-language error for a document that isn't what we asked for (or can't be read). We never show the
 * model's own wording, and only suggest a clearer photo when the user actually sent an image.
 */
export function wrongDocument(label: "bill" | "EOB", docs: DocInput[]): UserError {
  const photo = docs.some((d) => d.kind === "file" && d.mediaType.startsWith("image/"));
  const message =
    label === "bill"
      ? "This doesn’t look like an itemized medical bill. Make sure it lists services, dates and charges."
      : "This doesn’t look like an EOB. It usually says “This is not a bill” at the top.";
  return new UserError(message + (photo ? PHOTO_HINT : ""), 422, label === "bill" ? "notBill" : "notEob", { photo: photo ? 1 : 0 });
}

/** Fallback: some models answer with a JSON object in text instead of calling the tool. */
export function jsonFromText(content: Anthropic.Messages.ContentBlock[]): unknown {
  const text = content.map((c) => (c.type === "text" ? c.text : "")).join("");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return {};
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return {};
  }
}

/** Calls the model with a tool, validates with zod, and retries once with the validation errors. */
async function extractWithTool<T>(
  system: string,
  tool: typeof BILL_TOOL | typeof EOB_TOOL,
  docs: DocInput[],
  instruction: string,
  schema: z.ZodType<T>,
  label: "bill" | "EOB",
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
        // Forced tool_choice isn't supported by every model, so we ask for the tool and accept JSON text as a fallback.
        tool_choice: { type: "auto" },
        messages,
      });
    } catch (err) {
      if (err instanceof UserError) throw err;
      const status = (err as { status?: number }).status;
      // Log the status only — never the document content.
      console.error(`[extract:${label}] model call failed`, status ?? (err as Error).name);
      if (status === 401) throw new UserError("The AI service rejected the server's API key.", 503, "notConfigured");
      if (status === 429 || status === 529) throw new UserError("The AI service is busy right now. Please try again in a minute.", 503, "aiBusy");
      if (status === 400 && /credit/i.test(String((err as Error).message))) throw new UserError("The AI service is out of credits on this server.", 503, "notConfigured");
      if (status === 404) throw new UserError(`The AI model "${MODEL()}" isn't available for this API key (set ANTHROPIC_MODEL).`, 503, "notConfigured");
      throw new UserError("Reading the document failed. Please try again, or paste the text instead.", 502, "readFailed");
    }
    const call = res.content.find((c) => c.type === "tool_use");
    const input = (call?.type === "tool_use" ? call.input : jsonFromText(res.content)) as Record<string, unknown>;

    if (input.readable === false) throw wrongDocument(label, docs);

    const parsed = schema.safeParse(input);
    if (parsed.success) return parsed.data;

    if (attempt === 0 && !call) {
      messages.push({ role: "assistant", content: res.content });
      messages.push({ role: "user", content: `Please call the ${tool.name} tool now with the extracted data.${parsed.success ? "" : `\nProblems to fix:\n${z.prettifyError(parsed.error)}`}` });
      continue;
    }
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
    throw wrongDocument(label, docs);
  }
  throw new UserError("Extraction failed.", 500, "readFailed");
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
  const r = await extractWithTool(BILL_SYSTEM, BILL_TOOL, docs, "Extract this medical bill. Respond only by calling the record_bill tool.", BillToolResult, "bill");
  // Nothing billed and nothing owed: whatever this was, it wasn't a medical bill.
  if (r.lines.length === 0 && !r.patientBalance && !r.totalCharges) throw wrongDocument("bill", docs);
  return { ...r, lines: r.lines.map((l, i) => ({ ...l, id: `B${i + 1}` })) };
}

export async function extractEobs(docs: DocInput[]): Promise<EobDoc[]> {
  const r = await extractWithTool(EOB_SYSTEM, EOB_TOOL, docs, "Extract this Explanation of Benefits. Respond only by calling the record_eobs tool.", EobToolResult, "EOB");
  if (r.eobs.every((e) => e.lines.length === 0 && !e.totalPatientResponsibility)) throw wrongDocument("EOB", docs);
  return r.eobs.map((e) => ({ ...e, lines: e.lines.map((l, i) => ({ ...l, id: `E${i + 1}` })) }));
}
