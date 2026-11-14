import type { BillDoc, EobDoc } from "./schemas";

/**
 * The fictional demo case, as structured data. scripts/make-samples.ts renders these into the PDFs in
 * public/samples/, and tests/rules.test.ts checks the rules engine against them. The live demo does NOT
 * use this file: it sends the PDFs through the real extraction pipeline.
 *
 * Scenario: ER visit on 2026-09-14, high-deductible plan, deductible not met, so the patient owes the
 * allowed amounts. The hospital billed the CT scan twice and added a supply line that never went to insurance.
 */
export const SAMPLE_DATE = "2026-09-14";

export const sampleBill: BillDoc = {
  providerName: "Riverside General Hospital",
  accountRef: "****4471",
  statementDate: "2026-10-27",
  dueDate: "2026-11-26",
  isItemized: true,
  lines: [
    { id: "B1", serviceDate: SAMPLE_DATE, code: "99284", codeType: "CPT", description: "Emergency dept visit, level 4", quantity: 1, billedAmount: 1450 },
    { id: "B2", serviceDate: SAMPLE_DATE, code: "70450", codeType: "CPT", description: "CT head/brain w/o contrast", quantity: 1, billedAmount: 2100 },
    { id: "B3", serviceDate: SAMPLE_DATE, code: "70450", codeType: "CPT", description: "CT head/brain w/o contrast", quantity: 1, billedAmount: 2100 },
    { id: "B4", serviceDate: SAMPLE_DATE, code: "12001", codeType: "CPT", description: "Simple repair of wound <=2.5 cm", quantity: 1, billedAmount: 380 },
    { id: "B5", serviceDate: SAMPLE_DATE, code: "99070", codeType: "CPT", description: "Supplies and materials", quantity: 1, billedAmount: 165 },
  ],
  totalCharges: 6195,
  insurancePaid: 0,
  // In-network discount posted on the ER visit, wound repair and both CT lines (830 + 1620 + 1620 + 285).
  adjustments: -4355,
  patientBalance: 1840,
};

export const sampleEob: EobDoc = {
  insurerName: "Summit Health Plan",
  claimRef: "****2093",
  providerName: "Riverside General Hospital",
  lines: [
    {
      id: "E1", serviceDate: SAMPLE_DATE, code: "99284", description: "Emergency dept visit, level 4",
      billedAmount: 1450, allowedAmount: 620, planPaid: 0, deductible: 620, copay: 0, coinsurance: 0, notCovered: 0,
      patientResponsibility: 620, remarkCodes: ["PR1"], networkStatus: "in",
    },
    {
      id: "E2", serviceDate: SAMPLE_DATE, code: "70450", description: "CT head/brain w/o contrast",
      billedAmount: 2100, allowedAmount: 480, planPaid: 0, deductible: 480, copay: 0, coinsurance: 0, notCovered: 0,
      patientResponsibility: 480, remarkCodes: ["PR1"], networkStatus: "in",
    },
    {
      id: "E3", serviceDate: SAMPLE_DATE, code: "12001", description: "Simple repair of wound <=2.5 cm",
      billedAmount: 380, allowedAmount: 95, planPaid: 0, deductible: 95, copay: 0, coinsurance: 0, notCovered: 0,
      patientResponsibility: 95, remarkCodes: ["PR1"], networkStatus: "in",
    },
  ],
  totalPatientResponsibility: 1195,
};
