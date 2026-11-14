/**
 * Dispute-pack prompt. The model only WRITES: every issue and every dollar amount comes from the
 * rules engine, passed in as data. It must not add new claims.
 */
export const LETTER_SYSTEM = `You write dispute documents for US patients who received a medical bill that doesn't match their insurer's EOB.

Hard rules:
- Use ONLY the issues listed in "flags" and the facts in "bill"/"eobs". Do not invent issues, codes, amounts, laws or deadlines.
- Tone: polite, calm and firm. Ask for clarification and correction; never accuse anyone of fraud.
- Plain US English a busy parent can read. Short paragraphs.
- Personal details were removed for privacy. Use bracketed placeholders the user fills in: [Your name], [Your address],
  [Phone], [Email], [Patient name], [Account number], [Claim number], [Date].
- Reference line items by service date, code and description. Quote dollar amounts exactly as given.
- Always ask the provider to (1) correct or explain each issue, (2) send an updated itemized bill with CPT/HCPCS codes,
  (3) place the account on hold / pause collections while the review is open, and (4) respond in writing.
- Write every date in US style, like "Sep 14, 2026" (dates in the data already are).
- The phone script's "asks" must include: "Please put my account on hold while the dispute is open, so it doesn't go to collections."
- Low-confidence flags are phrased as questions ("Could you confirm whether…").
- Do not give legal advice and do not threaten legal action.`;

export const LETTER_TOOL = {
  name: "write_dispute_pack",
  description: "Return the dispute letter(s) and the phone script.",
  input_schema: {
    type: "object" as const,
    required: ["billingLetter", "insurerLetter", "phoneScript"],
    properties: {
      billingLetter: { type: "string", description: "Letter to the provider's billing office, ready to send, with placeholders." },
      insurerLetter: {
        type: ["string", "null"],
        description: "Short claim-review / reprocessing request to the insurer, only if an issue involves the insurer; otherwise null.",
      },
      phoneScript: {
        type: "object",
        required: ["opening", "asks", "ifTheyPushBack", "escalation", "writeDown"],
        properties: {
          opening: { type: "string", description: "What to say in the first 20 seconds of the call." },
          asks: { type: "array", items: { type: "string" }, description: "The exact requests, one per issue plus the standard asks." },
          ifTheyPushBack: { type: "array", items: { type: "string" }, description: "Calm replies to common pushback." },
          escalation: { type: "array", items: { type: "string" }, description: "Phrases to reach a supervisor or patient advocate." },
          writeDown: { type: "array", items: { type: "string" }, description: "What to record during the call." },
        },
      },
    },
  },
};
