/**
 * Renders the fictional demo documents into public/samples/ as real PDFs:
 *   - riverside-bill.pdf  (itemized hospital statement)
 *   - summit-eob.pdf      (insurer's Explanation of Benefits)
 *   - lakeshore-anesthesia-bill.pdf + summit-eob-anesthesia.pdf (second case: out-of-network anesthesia)
 * Run: npm run samples
 *
 * The numbers come from src/lib/sample-data.ts so the PDFs, the unit tests and the live demo agree.
 * Everything here is fictional and watermarked "SAMPLE — FICTIONAL DATA".
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, degrees, rgb } from "pdf-lib";
import { sampleBill, sampleEob, surpriseBill, surpriseEob } from "../src/lib/sample-data";

const INK = rgb(0.12, 0.13, 0.15);
const MUTED = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.82, 0.84, 0.87);
const BAND = rgb(0.95, 0.96, 0.97);

const money = (n: number) => {
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n < 0 ? `(${s})` : s;
};
const us = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
};

type Ctx = { page: PDFPage; font: PDFFont; bold: PDFFont };

function text(c: Ctx, s: string, x: number, y: number, size = 9, opts: { bold?: boolean; color?: ReturnType<typeof rgb>; right?: boolean } = {}) {
  const f = opts.bold ? c.bold : c.font;
  const w = f.widthOfTextAtSize(s, size);
  c.page.drawText(s, { x: opts.right ? x - w : x, y, size, font: f, color: opts.color ?? INK });
}

function hr(c: Ctx, y: number, x1 = 40, x2 = 572) {
  c.page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness: 0.7, color: LINE });
}

function watermark(c: Ctx) {
  c.page.drawText("SAMPLE — FICTIONAL DATA", {
    x: 95, y: 250, size: 46, font: c.bold, color: rgb(0.85, 0.2, 0.2), opacity: 0.12, rotate: degrees(35),
  });
  text(c, "SAMPLE — FICTIONAL DATA · Created for the BillCheck demo. Not a real bill, patient or insurer.", 40, 24, 7.5, { color: MUTED });
}

async function makeBill() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Riverside General Hospital — Patient Statement (SAMPLE)");
  const page = pdf.addPage([612, 792]);
  const c: Ctx = { page, font: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) };
  const b = sampleBill;

  text(c, "Riverside General Hospital", 40, 740, 18, { bold: true });
  text(c, "1200 Riverside Parkway, Columbus, OH 43215  ·  Billing office (614) 555-0142", 40, 724, 8.5, { color: MUTED });
  text(c, "PATIENT STATEMENT", 572, 742, 12, { bold: true, right: true });

  const box = (label: string, value: string, x: number, y: number) => {
    text(c, label, x, y, 7.5, { color: MUTED });
    text(c, value, x, y - 12, 10, { bold: true });
  };
  box("Guarantor", "Jessica Miller", 40, 690);
  box("Patient", "Ethan Miller (dependent)", 160, 690);
  box("Account number", "000-58-4471", 320, 690);
  box("Statement date", us(b.statementDate!), 430, 690);
  box("Due date", us(b.dueDate!), 510, 690);
  text(c, "Mailing address: 48 Maple Grove Ln, Westerville, OH 43081", 40, 656, 8, { color: MUTED });
  text(c, "Insurance on file: Summit Health Plan (in-network)  ·  Visit: Emergency Department, 09/14/2026", 40, 644, 8, { color: MUTED });

  // Itemized charges
  let y = 612;
  text(c, "ITEMIZED CHARGES", 40, y, 9, { bold: true });
  y -= 18;
  page.drawRectangle({ x: 40, y: y - 4, width: 532, height: 16, color: BAND });
  const cols = { date: 46, code: 112, desc: 170, qty: 470, amt: 566 };
  text(c, "Service date", cols.date, y, 8, { bold: true });
  text(c, "CPT/HCPCS", cols.code, y, 8, { bold: true });
  text(c, "Description", cols.desc, y, 8, { bold: true });
  text(c, "Qty", cols.qty, y, 8, { bold: true });
  text(c, "Charges", cols.amt, y, 8, { bold: true, right: true });
  y -= 20;
  for (const l of b.lines) {
    text(c, us(l.serviceDate!), cols.date, y);
    text(c, l.code ?? "", cols.code, y);
    text(c, l.description, cols.desc, y);
    text(c, String(l.quantity ?? 1), cols.qty, y);
    text(c, money(l.billedAmount), cols.amt, y, 9, { right: true });
    y -= 6;
    hr(c, y);
    y -= 14;
  }
  text(c, "Total charges", cols.desc, y, 9, { bold: true });
  text(c, money(b.totalCharges!), cols.amt, y, 9, { bold: true, right: true });

  // Payments & adjustments (no codes on purpose: these are not services)
  y -= 34;
  text(c, "PAYMENTS AND ADJUSTMENTS", 40, y, 9, { bold: true });
  y -= 18;
  const adj: [string, string, number][] = [
    ["10/20/2026", "Summit Health Plan - insurance payment", 0],
    ["10/20/2026", "Summit Health Plan - in-network contractual adjustment (ER visit)", -830],
    ["10/20/2026", "Summit Health Plan - in-network contractual adjustment (CT head)", -1620],
    ["10/20/2026", "Summit Health Plan - in-network contractual adjustment (CT head)", -1620],
    ["10/20/2026", "Summit Health Plan - in-network contractual adjustment (wound repair)", -285],
  ];
  for (const [d, desc, amt] of adj) {
    text(c, d, cols.date, y);
    text(c, desc, cols.code, y);
    text(c, money(amt), cols.amt, y, 9, { right: true });
    y -= 16;
  }
  hr(c, y + 8);
  text(c, "Total insurance payments", cols.desc, y - 4, 9);
  text(c, money(b.insurancePaid!), cols.amt, y - 4, 9, { right: true });
  text(c, "Total adjustments", cols.desc, y - 18, 9);
  text(c, money(b.adjustments!), cols.amt, y - 18, 9, { right: true });

  // Amount due
  y -= 60;
  page.drawRectangle({ x: 352, y: y - 14, width: 220, height: 40, color: rgb(0.93, 0.97, 0.95), borderColor: LINE, borderWidth: 0.7 });
  text(c, "PATIENT BALANCE DUE", 362, y + 10, 8, { bold: true, color: MUTED });
  text(c, `$${money(b.patientBalance)}`, 562, y - 4, 16, { bold: true, right: true });
  text(c, "Your insurance has processed this claim. The balance shown is your responsibility.", 40, y + 4, 8, { color: MUTED });
  text(c, "Questions about this bill? Call (614) 555-0142, Mon-Fri 8am-5pm ET.", 40, y - 8, 8, { color: MUTED });

  watermark(c);
  return pdf.save();
}

async function makeEob() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Summit Health Plan — Explanation of Benefits (SAMPLE)");
  const page = pdf.addPage([792, 612]); // landscape, like most EOBs
  const c: Ctx = { page, font: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) };
  const e = sampleEob;

  text(c, "Summit Health Plan", 40, 562, 18, { bold: true });
  text(c, "Explanation of Benefits", 40, 545, 11);
  page.drawRectangle({ x: 560, y: 540, width: 192, height: 30, color: rgb(1, 0.95, 0.85) });
  text(c, "THIS IS NOT A BILL", 742, 551, 12, { bold: true, right: true });
  const info: [string, string][] = [
    ["Member", "Jessica Miller"],
    ["Member ID", "XQH 88124093"],
    ["Patient", "Ethan Miller"],
    ["Group", "Acme Marketing LLC - HDHP Family"],
    ["Claim number", "2026-0914-2093"],
    ["Provider", "Riverside General Hospital (In-network)"],
    ["Processed", "10/18/2026"],
  ];
  let y = 515;
  info.forEach(([k, v], i) => {
    const x = i < 4 ? 40 : 400;
    const yy = y - (i % 4) * 15;
    text(c, `${k}:`, x, yy, 8.5, { color: MUTED });
    text(c, v, x + 80, yy, 8.5, { bold: true });
  });

  y = 435;
  page.drawRectangle({ x: 40, y: y - 6, width: 712, height: 28, color: BAND });
  const cols = [
    { x: 46, h: ["Date of", "service"] },
    { x: 104, h: ["Service", "code"] },
    { x: 152, h: ["Description", ""] },
    { x: 390, h: ["Amount", "billed"], r: true },
    { x: 455, h: ["Allowed", "amount"], r: true },
    { x: 520, h: ["Plan", "paid"], r: true },
    { x: 585, h: ["Applied to", "deductible"], r: true },
    { x: 640, h: ["Coins./", "copay"], r: true },
    { x: 700, h: ["Your", "responsibility"], r: true },
    { x: 748, h: ["Remark", ""], r: true },
  ];
  for (const col of cols) {
    text(c, col.h[0], col.r ? col.x + 0 : col.x, y + 8, 7.5, { bold: true, right: col.r });
    if (col.h[1]) text(c, col.h[1], col.x, y - 2, 7.5, { bold: true, right: col.r });
  }
  y -= 24;
  for (const l of e.lines) {
    const vals = [
      us(l.serviceDate!), l.code ?? "", l.description, money(l.billedAmount!), money(l.allowedAmount!), money(l.planPaid!),
      money(l.deductible!), money((l.coinsurance ?? 0) + (l.copay ?? 0)), money(l.patientResponsibility), l.remarkCodes.join(","),
    ];
    vals.forEach((v, i) => text(c, v, cols[i].x, y, 9, { right: cols[i].r }));
    y -= 6;
    hr(c, y, 40, 752);
    y -= 14;
  }
  const tot = (k: "billedAmount" | "allowedAmount" | "planPaid" | "deductible") => e.lines.reduce((s, l) => s + (l[k] ?? 0), 0);
  text(c, "Claim totals", cols[2].x, y, 9, { bold: true });
  [money(tot("billedAmount")), money(tot("allowedAmount")), money(tot("planPaid")), money(tot("deductible")), "0.00", money(e.totalPatientResponsibility)].forEach(
    (v, i) => text(c, v, cols[i + 3].x, y, 9, { bold: true, right: true }),
  );

  y -= 40;
  page.drawRectangle({ x: 470, y: y - 16, width: 282, height: 40, color: rgb(0.93, 0.97, 0.95), borderColor: LINE, borderWidth: 0.7 });
  text(c, "WHAT YOU OWE THE PROVIDER", 480, y + 10, 8, { bold: true, color: MUTED });
  text(c, `$${money(e.totalPatientResponsibility)}`, 742, y - 6, 16, { bold: true, right: true });
  text(c, "Remark PR1: Amount applied to your deductible. Patient responsibility.", 40, y + 6, 8.5);
  text(c, "Network savings: Riverside General is in-network. You are not responsible", 40, y - 8, 8.5);
  text(c, "for amounts above the allowed amount.", 40, y - 20, 8.5);

  y -= 54;
  text(c, "YOUR PLAN YEAR TO DATE (family, HDHP)", 40, y, 9, { bold: true });
  text(c, "Deductible: $6,000.00   Met: $1,195.00   Remaining: $4,805.00   Out-of-pocket max: $10,000.00", 40, y - 14, 8.5);
  text(c, "If you disagree with how this claim was processed, you can appeal within 180 days of receiving this notice.", 40, y - 32, 8.5, { color: MUTED });
  text(c, "Summit Health Plan · Member Services (800) 555-0199 · P.O. Box 4410, Dayton, OH 45401", 40, y - 46, 8.5, { color: MUTED });

  watermark(c);
  return pdf.save();
}

async function makeSurpriseBill() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Lakeshore Anesthesia Associates — Statement (SAMPLE)");
  const page = pdf.addPage([612, 792]);
  const c: Ctx = { page, font: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) };
  const b = surpriseBill;
  const l = b.lines[0];

  text(c, "Lakeshore Anesthesia Associates, P.C.", 40, 740, 17, { bold: true });
  text(c, "PO Box 22871, Columbus, OH 43222  ·  Billing (614) 555-0177  ·  Tax ID 31-0000000", 40, 724, 8.5, { color: MUTED });
  text(c, "STATEMENT", 572, 742, 12, { bold: true, right: true });

  const box = (label: string, value: string, x: number, y: number) => {
    text(c, label, x, y, 7.5, { color: MUTED });
    text(c, value, x, y - 12, 10, { bold: true });
  };
  box("Responsible party", "Marcus Reed", 40, 690);
  box("Patient", "Marcus Reed", 170, 690);
  box("Account number", "LAA-2208830", 290, 690);
  box("Statement date", us(b.statementDate!), 410, 690);
  box("Due date", us(b.dueDate!), 500, 690);
  text(c, "Mailing address: 915 Birchwood Ct, Dublin, OH 43017", 40, 656, 8, { color: MUTED });
  text(c, "Place of service: Riverside General Hospital, Main OR  ·  Surgeon: Dr. A. Patel  ·  Insurance: Summit Health Plan", 40, 644, 8, { color: MUTED });

  let y = 612;
  text(c, "SERVICES", 40, y, 9, { bold: true });
  y -= 18;
  page.drawRectangle({ x: 40, y: y - 4, width: 532, height: 16, color: BAND });
  const cols = { date: 46, code: 112, desc: 170, amt: 566 };
  text(c, "Date of service", cols.date, y, 8, { bold: true });
  text(c, "CPT", cols.code, y, 8, { bold: true });
  text(c, "Description", cols.desc, y, 8, { bold: true });
  text(c, "Charges", cols.amt, y, 8, { bold: true, right: true });
  y -= 20;
  text(c, us(l.serviceDate!), cols.date, y);
  text(c, l.code!, cols.code, y);
  text(c, "Anesthesia, intraperitoneal procedure, lower abdomen", cols.desc, y);
  text(c, money(l.billedAmount), cols.amt, y, 9, { right: true });
  y -= 12;
  text(c, "(laparoscopic appendectomy) · 98 min · 6 base + 7 time units", cols.desc, y, 8, { color: MUTED });
  y -= 8;
  hr(c, y);

  y -= 30;
  const rows: [string, string][] = [
    ["Total charges", money(b.totalCharges!)],
    ["Summit Health Plan payment (10/02/2026)", money(-b.insurancePaid!)],
    ["Adjustments", money(b.adjustments!)],
  ];
  for (const [k, v] of rows) {
    text(c, k, cols.desc, y, 9);
    text(c, v, cols.amt, y, 9, { right: true });
    y -= 16;
  }

  y -= 34;
  page.drawRectangle({ x: 352, y: y - 14, width: 220, height: 40, color: rgb(0.99, 0.94, 0.92), borderColor: LINE, borderWidth: 0.7 });
  text(c, "AMOUNT DUE", 362, y + 10, 8, { bold: true, color: MUTED });
  text(c, `$${money(b.patientBalance)}`, 562, y - 4, 16, { bold: true, right: true });
  text(c, "Lakeshore Anesthesia Associates does not participate in your plan's network.", 40, y + 4, 8, { color: MUTED });
  text(c, "The balance after your insurer's payment is your responsibility. Pay online or call us.", 40, y - 8, 8, { color: MUTED });

  watermark(c);
  return pdf.save();
}

async function makeSurpriseEob() {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Summit Health Plan — Explanation of Benefits, anesthesia (SAMPLE)");
  const page = pdf.addPage([792, 612]);
  const c: Ctx = { page, font: await pdf.embedFont(StandardFonts.Helvetica), bold: await pdf.embedFont(StandardFonts.HelveticaBold) };
  const e = surpriseEob;
  const l = e.lines[0];

  text(c, "Summit Health Plan", 40, 562, 18, { bold: true });
  text(c, "Explanation of Benefits", 40, 545, 11);
  page.drawRectangle({ x: 560, y: 540, width: 192, height: 30, color: rgb(1, 0.95, 0.85) });
  text(c, "THIS IS NOT A BILL", 742, 551, 12, { bold: true, right: true });
  const info: [string, string][] = [
    ["Member", "Marcus Reed"],
    ["Member ID", "XQH 77310455"],
    ["Patient", "Marcus Reed"],
    ["Group", "Brightline Logistics - PPO 2000"],
    ["Claim number", "2026-0822-5517"],
    ["Provider", "Lakeshore Anesthesia Associates (OUT-OF-NETWORK)"],
    ["Processed", "09/30/2026"],
  ];
  info.forEach(([k, v], i) => {
    const x = i < 4 ? 40 : 400;
    const yy = 515 - (i % 4) * 15;
    text(c, `${k}:`, x, yy, 8.5, { color: MUTED });
    text(c, v, x + 80, yy, 8.5, { bold: true });
  });

  let y = 435;
  page.drawRectangle({ x: 40, y: y - 6, width: 712, height: 28, color: BAND });
  const cols = [
    { x: 46, h: ["Date of", "service"] },
    { x: 104, h: ["Service", "code"] },
    { x: 152, h: ["Description", ""] },
    { x: 390, h: ["Amount", "billed"], r: true },
    { x: 455, h: ["Allowed", "amount"], r: true },
    { x: 520, h: ["Plan", "paid"], r: true },
    { x: 585, h: ["Applied to", "deductible"], r: true },
    { x: 640, h: ["Coins.", "(40%)"], r: true },
    { x: 700, h: ["Your", "responsibility"], r: true },
    { x: 748, h: ["Remark", ""], r: true },
  ];
  for (const col of cols) {
    text(c, col.h[0], col.x, y + 8, 7.5, { bold: true, right: col.r });
    if (col.h[1]) text(c, col.h[1], col.x, y - 2, 7.5, { bold: true, right: col.r });
  }
  y -= 24;
  const vals = [
    us(l.serviceDate!), l.code!, "Anesthesia, lower abdomen (out-of-network)", money(l.billedAmount!), money(l.allowedAmount!),
    money(l.planPaid!), money(l.deductible!), money(l.coinsurance!), money(l.patientResponsibility), l.remarkCodes.join(","),
  ];
  vals.forEach((v, i) => text(c, v, cols[i].x, y, 9, { right: cols[i].r }));
  y -= 6;
  hr(c, y, 40, 752);

  y -= 40;
  page.drawRectangle({ x: 470, y: y - 16, width: 282, height: 40, color: rgb(0.93, 0.97, 0.95), borderColor: LINE, borderWidth: 0.7 });
  text(c, "WHAT YOU OWE THE PROVIDER", 480, y + 10, 8, { bold: true, color: MUTED });
  text(c, `$${money(e.totalPatientResponsibility)}`, 742, y - 6, 16, { bold: true, right: true });
  text(c, "Remark OON2: Provider is not in your network. Out-of-network coinsurance (40%) applied.", 40, y + 6, 8.5);
  text(c, "An out-of-network provider may bill you for charges above the allowed amount,", 40, y - 8, 8.5);
  text(c, "except where federal or state law protects you from balance billing.", 40, y - 20, 8.5);

  y -= 54;
  text(c, "YOUR PLAN (PPO 2000)", 40, y, 9, { bold: true });
  text(c, "In-network coinsurance: 20%   Out-of-network coinsurance: 40%   Deductible met for 2026: Yes", 40, y - 14, 8.5);
  text(c, "If you disagree with how this claim was processed, you can appeal within 180 days of receiving this notice.", 40, y - 32, 8.5, { color: MUTED });
  text(c, "Summit Health Plan · Member Services (800) 555-0199 · P.O. Box 4410, Dayton, OH 45401", 40, y - 46, 8.5, { color: MUTED });

  watermark(c);
  return pdf.save();
}

async function main() {
  mkdirSync("public/samples", { recursive: true });
  writeFileSync("public/samples/riverside-bill.pdf", await makeBill());
  writeFileSync("public/samples/summit-eob.pdf", await makeEob());
  writeFileSync("public/samples/lakeshore-anesthesia-bill.pdf", await makeSurpriseBill());
  writeFileSync("public/samples/summit-eob-anesthesia.pdf", await makeSurpriseEob());
  console.log("Wrote 4 sample PDFs to public/samples/");
}

main();
