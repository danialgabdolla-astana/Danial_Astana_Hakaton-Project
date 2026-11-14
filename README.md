# FinanceBro — your down payment is hiding in your bank statement

BUSINESS CUP 2.0 · Track: **Money** · B2C web app for working adults in the US (25–45).

**Who it's for:** renters aged 28–40 earning $50–100k who want to buy a first home but can't seem to save.
**What it does:** upload a bank statement (CSV) → AI finds money leaks (forgotten subscriptions, duplicate services, price hikes, stacked buy-now-pay-later plans, costly habits) → the money you free up flows into a dated down-payment plan and a mortgage estimate.

No bank login. No sign-up. Try it with the built-in sample statement.

## How it works

```
CSV (in browser) ──► parse + normalize merchants ──► detect recurring charges (deterministic)
                                                        │
                       merchant totals only ────────────▼
                                              /api/analyze  ──► Claude (or Gemini) ──► JSON
                                                        │
                       validate against real data ◄─────┘  (unknown merchants dropped,
                                                            savings capped at what you pay)
                                                        ▼
          leaks you tick ──► extra $/month ──► months to down payment ──► mortgage payment
```

- **Privacy:** the raw file never leaves the browser. Only aggregated merchant totals are sent to the server for AI analysis. Nothing is stored.
- **No hallucinated savings:** every AI suggestion must reference merchants actually present in the statement, and its savings are capped at what the user pays for them.
- **Works without AI:** if no API key is configured, a built-in rules engine (duplicates, price hikes, BNPL stacks, delivery habit) produces conservative results.
- **Mortgage defaults** use the Freddie Mac PMMS 30-year average (7.18%, Nov 5, 2026); all inputs are editable.

## Pricing

$5/month, first month free; invite a friend and both get another free month. Checkout via Stripe (test mode in the demo).

## Code map

| Path | What |
|---|---|
| `src/lib/parse.ts` | CSV parser that auto-detects Date/Description/Amount or Debit/Credit columns |
| `src/lib/detect.ts` | Merchant normalization, recurring-charge and price-hike detection |
| `src/lib/ai.ts` | Prompt, Claude/Gemini calls, validation of model output |
| `src/lib/rules.ts` | Rules fallback and keyword categorizer |
| `src/lib/finance.ts` | Mortgage payment, PMI, months-to-goal |
| `src/lib/ics.ts` | Calendar file with renewal reminders |
| `src/app/api/analyze` | Analysis endpoint |
| `src/app/api/checkout` | Stripe Checkout session ($5/mo, 30- or 60-day trial) |
| `scripts/gen-sample.mjs` | Generates the demo statement (persona: Sarah, 31, Austin TX) |

## Run locally

```bash
npm install
cp .env.example .env.local   # add a key (optional)
npm run dev
```

## Environment variables

| Name | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | one of the AI keys | Claude analysis |
| `ANTHROPIC_MODEL` | no | defaults to `claude-haiku-5-5` |
| `GEMINI_API_KEY` | alternative | Gemini analysis (free tier) |
| `GEMINI_MODEL` | no | defaults to `gemini-2.5-flash` |
| `STRIPE_SECRET_KEY` | no | `sk_test_...` for checkout; without it the button shows demo mode |

## Team

_Add names and roles here._

FinanceBro is a budgeting coach, not a licensed financial advisor.
