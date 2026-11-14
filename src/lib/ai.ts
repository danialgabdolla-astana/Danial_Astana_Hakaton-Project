import Anthropic from "@anthropic-ai/sdk";
import { CATEGORIES, type AnalysisRequest, type AnalysisResult, type Category, type Leak, type LeakType } from "./types";
import { categorize, rulesAnalysis } from "./rules";
import { round } from "./detect";

const LEAK_TYPES: LeakType[] = ["unused_or_forgotten", "duplicate_service", "price_hike", "cheaper_plan", "bnpl_stack", "habit"];

function buildPrompt(req: AnalysisRequest): string {
  const merchants = req.merchants.slice(0, 90).map((m) => ({
    key: m.merchant,
    example: m.sample,
    charges: m.count,
    total_usd: m.total,
    amounts: m.amounts.slice(-6),
  }));
  return `You are a frugal, practical US personal-finance coach. Analyze a user's bank statement summary.

Period: ${req.months} months. Total money in: $${req.income.toFixed(0)}.

MERCHANTS (money out, grouped; "key" is the merchant id you MUST use):
${JSON.stringify(merchants)}

RECURRING CHARGES DETECTED BY CODE (monthly_cost is computed, trust it):
${JSON.stringify(req.recurring.map((r) => ({ key: r.merchant, example: r.sample, monthly_cost: r.monthlyCost, first: r.firstAmount, last: r.lastAmount, price_hike: r.priceHike, bnpl: r.bnpl })))}

Tasks:
1. Assign every merchant key exactly one category from: ${CATEGORIES.join(", ")}.
2. Find money leaks the user can realistically fix: forgotten/low-value subscriptions, duplicate services doing the same job (e.g. two music apps, several video streamers, app + gym), price hikes, cheaper plans that exist (ad tier, annual, student/duo/family), stacked BNPL plans, and costly habits (delivery, rideshare). Only use merchants present in the data. Be specific and name real cheaper options when you are confident they exist. Do not invent charges.
3. monthlySavings must be a realistic USD/month number the user saves by taking the action (never more than what they pay for those merchants).
4. Write a 2-sentence plain-English summary of where their money goes and the single biggest opportunity.

Return ONLY JSON, no markdown:
{"categories": {"<key>": "<Category>"}, "leaks": [{"type": "unused_or_forgotten|duplicate_service|price_hike|cheaper_plan|bnpl_stack|habit", "merchants": ["<key>"], "title": "<short>", "monthlySavings": <number>, "why": "<1 sentence>", "action": "<1-2 concrete steps>", "confidence": "high|medium|low"}], "summary": "<text>"}`;
}

async function callClaude(prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content.map((c) => (c.type === "text" ? c.text : "")).join("");
}

async function callGemini(prompt: string): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("No JSON in model output");
  return JSON.parse(text.slice(start, end + 1));
}

/** Validate model output against the real data so nothing is hallucinated. */
function sanitize(raw: unknown, req: AnalysisRequest, source: AnalysisResult["source"]): AnalysisResult {
  const obj = (raw ?? {}) as { categories?: Record<string, string>; leaks?: unknown[]; summary?: string };
  const known = new Map(req.merchants.map((m) => [m.merchant, m]));
  const categories: Record<string, Category> = {};
  for (const m of req.merchants) {
    const c = obj.categories?.[m.merchant];
    categories[m.merchant] = CATEGORIES.includes(c as Category) ? (c as Category) : categorize(m.merchant + " " + m.sample);
  }

  const leaks: Leak[] = [];
  for (const item of obj.leaks ?? []) {
    const l = item as Partial<Leak>;
    const merchants = (l.merchants ?? []).filter((k) => known.has(k));
    if (merchants.length === 0 || !l.title) continue;
    const paidMonthly = merchants.reduce((s, k) => s + (known.get(k)!.total / Math.max(1, req.months)), 0);
    const savings = Math.max(0, Math.min(Number(l.monthlySavings) || 0, paidMonthly));
    leaks.push({
      type: LEAK_TYPES.includes(l.type as LeakType) ? (l.type as LeakType) : "unused_or_forgotten",
      merchants,
      title: String(l.title).slice(0, 90),
      monthlySavings: round(savings),
      why: String(l.why ?? "").slice(0, 300),
      action: String(l.action ?? "").slice(0, 300),
      confidence: (["high", "medium", "low"] as const).includes(l.confidence as "high") ? (l.confidence as Leak["confidence"]) : "medium",
    });
  }

  // Avoid counting the same merchant twice across leaks.
  const used = new Set<string>();
  const deduped = leaks
    .sort((a, b) => b.monthlySavings - a.monthlySavings)
    .filter((l) => {
      if (l.merchants.some((m) => used.has(m)) && l.type !== "bnpl_stack") return false;
      l.merchants.forEach((m) => used.add(m));
      return true;
    });

  return {
    source,
    categories,
    leaks: deduped,
    summary: String(obj.summary ?? "").slice(0, 500),
  };
}

export async function analyze(req: AnalysisRequest): Promise<AnalysisResult> {
  const prompt = buildPrompt(req);
  try {
    if (process.env.ANTHROPIC_API_KEY) return sanitize(extractJson(await callClaude(prompt)), req, "claude");
    if (process.env.GEMINI_API_KEY) return sanitize(extractJson(await callGemini(prompt)), req, "gemini");
  } catch (err) {
    console.error("AI analysis failed, falling back to rules:", err);
  }
  return rulesAnalysis(req);
}
