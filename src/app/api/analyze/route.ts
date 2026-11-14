import { analyze } from "@/lib/ai";
import type { AnalysisRequest } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  let body: AnalysisRequest;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body?.merchants) || !Array.isArray(body?.recurring)) {
    return Response.json({ error: "Missing merchants or recurring" }, { status: 400 });
  }
  // Only aggregated merchant data reaches the server; nothing is stored.
  const result = await analyze({
    months: Number(body.months) || 1,
    income: Number(body.income) || 0,
    merchants: body.merchants.slice(0, 200),
    recurring: body.recurring.slice(0, 100),
  });
  return Response.json(result);
}
