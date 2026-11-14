/**
 * Extraction prompts. The model ONLY transcribes what is printed on the documents into JSON.
 * It never decides what is wrong with the bill — the deterministic rules engine (src/lib/rules) does that.
 */

const COMMON = `
Rules for every field:
- Transcribe only what is printed. Never guess or invent codes, amounts, dates or lines. Use null when a value isn't shown.
- Amounts are plain numbers in USD (1240.5, not "$1,240.50"). Credits/adjustments shown in parentheses or with a minus are negative.
- Dates are YYYY-MM-DD.
- Privacy: replace the patient's, guarantor's and member's names with "[PATIENT]" or "[MEMBER]" wherever they appear in text fields,
  and never copy dates of birth, street addresses, SSNs or phone numbers of the patient.
- If the document is unreadable, blank, or clearly not the requested document type (for example random text, a receipt or a letter), set "readable" to false and explain in "problem". Never invent lines or amounts to fill the form.`;

export const BILL_SYSTEM = `You extract data from US medical bills (hospital or provider patient statements) for a consumer app.
${COMMON}

Bill-specific rules:
- "lines" contains ONLY the service charges (one entry per charge row, in the order printed). Do not include payments,
  insurance adjustments, discounts or totals as lines — put those in insurancePaid / adjustments / totalCharges.
- code is the CPT/HCPCS (or revenue) code exactly as printed, including modifiers like "70450-26". codeType: CPT for 5-digit
  numeric codes, HCPCS for a letter followed by 4 digits, REV for 3-4 digit revenue codes, OTHER otherwise.
- isItemized is true only if individual services are listed with their own amounts.
- insurancePaid is the total of insurance payments (0 if the bill shows 0.00). adjustments is the total of insurance
  adjustments/discounts as a negative number. patientBalance is the amount the bill asks the patient to pay now.
- accountRef: the account/statement number as printed (it will be masked later).`;

export const EOB_SYSTEM = `You extract data from US health insurance Explanation of Benefits (EOB) documents for a consumer app.
${COMMON}

EOB-specific rules:
- Return one entry in "eobs" per claim. Each claim's "lines" are the service rows in the order printed.
- For each line: billedAmount (amount billed/charged), allowedAmount (allowed/negotiated amount), planPaid (what the plan paid),
  deductible (applied to deductible), copay, coinsurance, notCovered (amount not covered / not allowed that IS the patient's
  responsibility, if shown separately), patientResponsibility (what the member owes for that line).
- networkStatus is "in" or "out" if the EOB says the provider/service is in- or out-of-network, otherwise "unknown".
- remarkCodes: remark/reason codes printed for the line (e.g. "PR1", "CO45"), or an empty list.
- totalPatientResponsibility: the claim total the member owes ("what you owe", "your responsibility").
- claimRef: the claim number as printed (it will be masked later).`;

export const BILL_TOOL = {
  name: "record_bill",
  description: "Record the structured contents of the medical bill.",
  input_schema: {
    type: "object" as const,
    required: ["readable", "providerName", "accountRef", "isItemized", "lines", "patientBalance"],
    properties: {
      readable: { type: "boolean" },
      problem: { type: ["string", "null"] },
      providerName: { type: "string" },
      accountRef: { type: "string" },
      statementDate: { type: ["string", "null"] },
      dueDate: { type: ["string", "null"] },
      isItemized: { type: "boolean" },
      lines: {
        type: "array",
        items: {
          type: "object",
          required: ["serviceDate", "code", "codeType", "description", "quantity", "billedAmount"],
          properties: {
            serviceDate: { type: ["string", "null"] },
            code: { type: ["string", "null"] },
            codeType: { type: ["string", "null"], enum: ["CPT", "HCPCS", "REV", "OTHER", null] },
            description: { type: "string" },
            quantity: { type: ["number", "null"] },
            billedAmount: { type: "number" },
          },
        },
      },
      totalCharges: { type: ["number", "null"] },
      insurancePaid: { type: ["number", "null"] },
      adjustments: { type: ["number", "null"] },
      patientBalance: { type: "number" },
    },
  },
};

export const EOB_TOOL = {
  name: "record_eobs",
  description: "Record the structured contents of the Explanation of Benefits.",
  input_schema: {
    type: "object" as const,
    required: ["readable", "eobs"],
    properties: {
      readable: { type: "boolean" },
      problem: { type: ["string", "null"] },
      eobs: {
        type: "array",
        items: {
          type: "object",
          required: ["insurerName", "claimRef", "providerName", "lines", "totalPatientResponsibility"],
          properties: {
            insurerName: { type: "string" },
            claimRef: { type: "string" },
            providerName: { type: ["string", "null"] },
            totalPatientResponsibility: { type: "number" },
            lines: {
              type: "array",
              items: {
                type: "object",
                required: ["serviceDate", "code", "description", "patientResponsibility", "networkStatus"],
                properties: {
                  serviceDate: { type: ["string", "null"] },
                  code: { type: ["string", "null"] },
                  description: { type: "string" },
                  billedAmount: { type: ["number", "null"] },
                  allowedAmount: { type: ["number", "null"] },
                  planPaid: { type: ["number", "null"] },
                  deductible: { type: ["number", "null"] },
                  copay: { type: ["number", "null"] },
                  coinsurance: { type: ["number", "null"] },
                  notCovered: { type: ["number", "null"] },
                  patientResponsibility: { type: "number" },
                  remarkCodes: { type: "array", items: { type: "string" } },
                  networkStatus: { type: "string", enum: ["in", "out", "unknown"] },
                },
              },
            },
          },
        },
      },
    },
  },
};
