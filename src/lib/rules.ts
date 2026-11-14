import type { AnalysisRequest, AnalysisResult, Category, Leak } from "./types";
import { round } from "./detect";

const RULES: [Category, RegExp][] = [
  ["BNPL & Debt", /KLARNA|AFFIRM|AFTERPAY|SEZZLE|\bZIP\b|PAY IN|LOAN|CARD PAYMENT|NAVIENT|NELNET|MOHELA|SALLIE/],
  ["Housing", /RENT|APARTMENT|PROPERTY|MORTGAGE|LEASING|REALTY|HOA/],
  ["Subscriptions", /NETFLIX|SPOTIFY|HULU|DISNEY|MAX\b|HBO|APPLE|ICLOUD|YOUTUBE|PARAMOUNT|PEACOCK|AUDIBLE|ADOBE|CHATGPT|OPENAI|DROPBOX|DUOLINGO|PRIME|DASHPASS|PATREON|SIRIUS|NYTIMES|MICROSOFT|GOOGLE ONE|CANVA/],
  ["Groceries", /WHOLE FOODS|TRADER|KROGER|SAFEWAY|ALDI|COSTCO|WALMART|H E B|HEB|PUBLIX|WEGMANS|TARGET|INSTACART|GROCERY|MARKET/],
  ["Dining & Delivery", /DOORDASH|UBER EATS|GRUBHUB|STARBUCKS|CHIPOTLE|MCDONALD|SWEETGREEN|CAFE|COFFEE|RESTAURANT|PIZZA|TACO|BAR\b|GRILL|KITCHEN|DUNKIN|CHICK/],
  ["Transport", /UBER|LYFT|SHELL|CHEVRON|EXXON|GAS|PARKING|METRO|TRANSIT|TESLA|TOLL/],
  ["Utilities & Phone", /COMCAST|XFINITY|VERIZON|AT&T|T MOBILE|SPECTRUM|ELECTRIC|ENERGY|WATER|UTILIT|INTERNET|AUSTIN ENERGY/],
  ["Insurance", /GEICO|PROGRESSIVE|STATE FARM|ALLSTATE|LEMONADE|INSURANCE/],
  ["Health & Fitness", /PELOTON|PLANET FITNESS|EQUINOX|GYM|CVS|WALGREENS|PHARMACY|CLASSPASS|FITNESS/],
  ["Shopping", /AMAZON|AMZN|SHEIN|ETSY|BEST BUY|NIKE|ZARA|SEPHORA|ULTA|IKEA|HOME DEPOT/],
  ["Entertainment", /TICKETMASTER|STEAM|PLAYSTATION|XBOX|NINTENDO|AMC|CINEMA|SEATGEEK/],
  ["Travel", /AIRLINE|DELTA|UNITED|SOUTHWEST|AIRBNB|HOTEL|MARRIOTT|HILTON|EXPEDIA/],
];

export function categorize(merchant: string): Category {
  const m = merchant.toUpperCase();
  for (const [cat, re] of RULES) if (re.test(m)) return cat;
  return "Other";
}

const DUP_GROUPS: { label: string; re: RegExp }[] = [
  { label: "music streaming", re: /SPOTIFY|APPLE MUSIC|YOUTUBE MUSIC|PANDORA|TIDAL|AMAZON MUSIC/ },
  { label: "video streaming", re: /NETFLIX|HULU|DISNEY|\bMAX\b|HBO|PARAMOUNT|PEACOCK|APPLE TV/ },
  { label: "fitness", re: /PELOTON|PLANET FITNESS|EQUINOX|CLASSPASS|GYM/ },
];

export function rulesAnalysis(req: AnalysisRequest): AnalysisResult {
  const categories: Record<string, Category> = {};
  for (const m of req.merchants) categories[m.merchant] = categorize(m.merchant + " " + m.sample);

  const leaks: Leak[] = [];
  const recurring = req.recurring;

  for (const g of DUP_GROUPS) {
    const hits = recurring.filter((r) => g.re.test(r.merchant + " " + r.sample.toUpperCase()));
    if (g.label === "video streaming" && hits.length >= 3) {
      const sorted = [...hits].sort((a, b) => a.monthlyCost - b.monthlyCost);
      const keep = sorted.slice(-1);
      const drop = sorted.slice(0, -1);
      leaks.push({
        type: "duplicate_service",
        merchants: drop.map((d) => d.merchant),
        title: `${hits.length} video streaming services at once`,
        monthlySavings: round(drop.reduce((s, d) => s + d.monthlyCost, 0)),
        why: `You pay for ${hits.map((h) => h.merchant).join(", ")}. Most people actively watch one or two at a time.`,
        action: `Keep ${keep[0].merchant}, rotate the others month to month instead of stacking them.`,
        confidence: "medium",
      });
    } else if (g.label !== "video streaming" && hits.length >= 2) {
      const sorted = [...hits].sort((a, b) => a.monthlyCost - b.monthlyCost);
      leaks.push({
        type: "duplicate_service",
        merchants: sorted.slice(0, -1).map((d) => d.merchant),
        title: `Paying twice for ${g.label}`,
        monthlySavings: round(sorted.slice(0, -1).reduce((s, d) => s + d.monthlyCost, 0)),
        why: `${hits.map((h) => h.merchant).join(" and ")} do the same job.`,
        action: `Keep one and cancel ${sorted[0].merchant}.`,
        confidence: "high",
      });
    }
  }

  for (const r of recurring.filter((x) => x.priceHike && !x.bnpl)) {
    leaks.push({
      type: "price_hike",
      merchants: [r.merchant],
      title: `${r.merchant} raised your price`,
      monthlySavings: round(r.lastAmount - r.firstAmount),
      why: `It went from $${r.firstAmount.toFixed(2)} to $${r.lastAmount.toFixed(2)} without you doing anything.`,
      action: "Switch to a cheaper or ad-supported tier, or ask for a retention discount before cancelling.",
      confidence: "high",
    });
  }

  const bnpl = recurring.filter((r) => r.bnpl);
  if (bnpl.length >= 2) {
    const total = round(bnpl.reduce((s, b) => s + b.monthlyCost, 0));
    leaks.push({
      type: "bnpl_stack",
      merchants: bnpl.map((b) => b.merchant),
      title: `${bnpl.length} buy-now-pay-later plans running at once`,
      monthlySavings: 0,
      why: `About $${total.toFixed(0)}/month goes to installment plans. Overlapping due dates are the #1 cause of late fees.`,
      action: "Don't open new plans until these finish; we'll add the freed cash to your goal when they end.",
      confidence: "high",
    });
  }

  const dining = req.merchants.filter((m) => categorize(m.merchant + " " + m.sample) === "Dining & Delivery");
  const diningMonthly = dining.reduce((s, m) => s + m.total, 0) / Math.max(1, req.months);
  if (diningMonthly > 300) {
    leaks.push({
      type: "habit",
      merchants: dining.slice(0, 3).map((d) => d.merchant),
      title: "Food delivery & eating out",
      monthlySavings: round(diningMonthly * 0.3),
      why: `You spend about $${diningMonthly.toFixed(0)}/month here. Cutting 30% is realistic without changing your life.`,
      action: "Cap delivery at 2x per week; cancel delivery memberships if you drop below that.",
      confidence: "medium",
    });
  }

  leaks.sort((a, b) => b.monthlySavings - a.monthlySavings);
  return {
    source: "rules",
    categories,
    leaks,
    summary: "Analysis by built-in rules (AI is offline). Results are conservative.",
  };
}
