import { formatDate } from "../dates";
import { formatUsd } from "../money";

/** Values a message template can receive (flag params, error vars, counts). */
export type Vars = Record<string, string | number | boolean | null | undefined>;

const usd = (n: unknown) => formatUsd(Number(n) || 0);
const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * English UI text, and the shape every other language must match (es.ts, fr.ts are typed as `Messages`).
 * The rule templates reproduce the server's English flag text exactly (tests/i18n.test.ts checks this).
 */
export const en = {
  langName: "English",
  common: {
    language: "Language",
    loading: "Loading…",
    checkABill: "Check a bill",
    myDisputes: "My disputes",
  },
  footer: {
    github: "Source code on GitHub",
    disclaimerStrong: "BillCheck is not a law firm or medical provider. Not legal or medical advice.",
    disclaimerRest: "We help you read your documents and ask the right questions.",
    knowRights: "Know your rights:",
    cmsRights: "CMS — medical bill rights",
    nsa: "No Surprises Act",
    project: "Business Cup 2.0 project. Sample documents are fictional.",
  },
  landing: {
    launchBadge: (pct: number) => `Launch price −${pct}%`,
    previewLabel: "Sample result",
    previewSub: "Bill $1,840 · EOB says you owe $1,195",
    ctaFree: "Check my bill — free",
    ctaFamily: "Start with a free check",
    vsChatShort: "Chatbot",
    badge: "For insured adults with a medical bill they don’t understand",
    h1: "Your medical bill might be wrong. Check it against your EOB in 2 minutes.",
    lede: "Upload your bill and your insurer’s Explanation of Benefits. BillCheck matches every line, shows what you can dispute, and gives you a ready-to-send letter, a phone script and deadlines.",
    ctaCheck: "Check my bill",
    ctaSample: "Try a sample bill",
    orTry: "Or try a",
    anesthesiaLink: "surprise anesthesia bill",
    anesthesiaNote: "(No Surprises Act case).",
    trust: "Free check · No sign-up · No insurance or bank login · Files never stored",
    stats: [
      { n: "43%", t: "of US adults say they’ve received a medical or dental bill they thought contained an error.", s: "KFF Health Care Debt Survey" },
      { n: "45%", t: "of insured working-age adults got a bill for something they thought insurance should have covered.", s: "Commonwealth Fund, 2024" },
      { n: "38%", t: "of people who disputed a billing error had the bill reduced or eliminated.", s: "Commonwealth Fund, 2024" },
    ],
    deductibleNote:
      "Insurance doesn’t stop bills: the average deductible for job-based coverage is $1,886, and 34% of covered workers have $2,000 or more (KFF 2025). Until you meet it, you pay almost everything — so an inflated bill inflates your share.",
    howTitle: "How it works",
    steps: [
      ["Upload two documents", "Your itemized bill and your EOB — PDF, photo or pasted text. Names and IDs are masked."],
      [
        "See what doesn’t match",
        "We pair each bill line with your EOB and run 8 billing rules: duplicates, charges insurance never saw, bills above your EOB, surprise out-of-network bills and more.",
      ],
      ["Dispute it, step by step", "Get a letter, a phone script and deadlines. Track every call until it’s resolved."],
    ],
    aiTitle: "AI reads. Rules decide.",
    aiBody:
      "AI only transcribes your documents into data. Every issue and every dollar amount comes from fixed, tested billing rules — so the same bill always gets the same answer, and each finding shows exactly where it came from.",
    vsTitle: "Why not just ask ChatGPT?",
    vsLede: "A chatbot can explain what a CPT code means. Getting money back takes a matched audit, a paper trail and follow-up.",
    vsChat: "General AI chatbot",
    vsUs: "BillCheck",
    vsRows: [
      ["Reads your bill and your EOB together", "One document at a time, usually", "Matches every bill line to an EOB line"],
      ["Where the numbers come from", "The model’s best guess, can change between tries", "8 fixed, unit-tested billing rules: same bill, same answer"],
      ["Shows its work", "Rarely", "Each issue cites the exact lines and the rule"],
      ["Knows your rights", "Only if you ask the right question", "No Surprises Act, itemized bills, appeal windows built in"],
      ["After the answer", "You’re on your own", "Letter, phone script, deadlines, tracker and calendar reminders"],
      ["Your documents", "Stored in your chat history", "Names masked, files never stored"],
    ],
    pricingTitle: "Simple pricing. No cut of your savings.",
    plans: {
      free: { name: "Free check", price: "$0", regular: "", note: "", items: ["Bill vs. EOB, line by line", "Every issue with confidence + source", "How much you can dispute"] },
      single: {
        name: "Fix this bill",
        price: "$20",
        regular: "$25",
        note: "one-time",
        items: ["Dispute letter to the billing office", "Insurer review request when needed", "Phone script with escalation phrases", "Deadlines + dispute tracker"],
      },
      family: { name: "Family plan", price: "$60", regular: "$120", note: "per year", items: ["Every bill for your household", "All dispute packs included", "Tracker + reminders"] },
    },
    compareTitle: "How BillCheck compares",
    compareCols: ["Option", "Catch", "Price"],
    compareRows: [
      ["Free AI chatbots", "Reads one document, can invent codes, no follow-up", "Free"],
      ["Apps that link your insurance", "Need your insurance login", "Free–$60/mo"],
      ["Bill advocates", "Take 10–25% of savings, often $5,000+ bills only", "% of savings"],
      ["Per-document review services", "Human review, slower", "~$69–$129"],
    ],
    compareUs: ["BillCheck", "Line-by-line EOB match, rules not guesses, tracks the dispute. Two files, no logins.", "$20 per bill"],
    faqTitle: "Questions",
    faq: [
      {
        q: "What’s an EOB, and where do I find it?",
        a: "The Explanation of Benefits is the statement your insurer sends after processing a claim. It says “This is not a bill” and shows what the provider charged, what your plan allowed and paid, and what you owe. It’s in your insurer’s app or website, or in the mail.",
      },
      {
        q: "Why not just paste my bill into ChatGPT?",
        a: "A chatbot reads one document and guesses. BillCheck matches every bill line to your EOB, applies fixed billing rules (the same ones every time), shows the source of each finding, never invents codes, and then tracks your dispute with deadlines and follow-ups. It’s a process, not a prompt.",
      },
      {
        q: "What happens to my documents?",
        a: "Files are processed in memory to read the lines and are never stored on our servers. We mask names, member IDs and account numbers. Your results and tracker are saved only in your browser. We never store your files, so there’s nothing to leak.",
      },
      { q: "Do I need to connect my insurance or bank account?", a: "No. Two documents are all we need — no logins, no account linking." },
      {
        q: "What if BillCheck is wrong?",
        a: "Every finding shows a confidence level and the exact line or rule it came from. The letter asks the billing office to explain or correct — it doesn’t accuse anyone. You stay in control of what you send.",
      },
      { q: "Is this legal or medical advice?", a: "No. BillCheck is not a law firm or medical provider. We help you read your documents and ask the right questions." },
      {
        q: "Which languages do you support?",
        a: "The site is in English, Spanish and French. Your dispute letter and phone script stay in English, because they go to a US billing office.",
      },
      {
        q: "I don’t have insurance. Can you help?",
        a: "Not yet — without an EOB there’s nothing to compare against. Help with cash prices and financial assistance is coming soon.",
      },
    ],
    ctaBottom: "See it on a sample bill",
  },
  check: {
    title: "Check your bill against your EOB",
    lede: "Add both documents. We read every line, match the bill to what your insurer processed, and show you exactly what to question — free. No sign-up.",
  },
  uploader: {
    itemizedLink: "Only have a summary? How to ask for an itemized bill",
    itemizedIntro: "Send this to the billing office (email, portal message or letter):",
    itemizedCopy: "Copy request",
    itemizedCopied: "Copied ✓",
    sampleLive: "Or run the ER sample live through the AI pipeline (~20 s).",
    steps: ["Reading your bill…", "Reading your EOB…", "Matching bill lines to your EOB…", "Checking 8 billing rules…", "Adding up what you can dispute…"],
    wait: "This usually takes 20–60 seconds. Your files are processed in memory and never stored.",
    billTitle: "1. Your itemized bill",
    billHint: "From the hospital or doctor’s office. Ask for the itemized version with codes if you only have a summary.",
    eobTitle: "2. Your EOB",
    eobHint: "The Explanation of Benefits from your insurer — usually in your insurer’s app or mailed. It says “This is not a bill”.",
    planToggle: (open: boolean) => `${open ? "− Hide" : "+ Add"} plan details (optional — makes amounts more precise)`,
    deductible: "Deductible ($)",
    met: "Met so far ($)",
    coinsurance: "Coinsurance (%)",
    inNetwork: "Provider in-network?",
    notSure: "Not sure",
    yes: "Yes",
    no: "No",
    submit: "Check my bill — free",
    sampleEr: "Try a sample: ER bill",
    sampleAnesthesia: "Sample: surprise anesthesia bill",
    samplesPre: "Samples are fictional PDFs (",
    samplesEr: "ER bill",
    samplesEob: "its EOB",
    samplesAn: "anesthesia bill",
    samplesPost: ") and go through the same AI + rules pipeline as yours.",
    privacy: "🔒 Files are processed in memory and never stored. We mask names, member IDs and account numbers. Uninsured? Cash-price help is coming soon.",
    upload: "Upload PDF / photo",
    paste: "Paste text",
    chooseFiles: "Choose files",
    dragHint: "or drag them here · PDF, JPG, PNG · up to 3 files",
    removeFile: (name: string) => `Remove ${name}`,
    pasteLabel: "Paste the document text",
    pastePlaceholder: "Copy the text from the PDF or your insurer’s website and paste it here…",
    needBill: "Add your itemized bill — a PDF, a photo, or pasted text.",
    needEob: "Add your EOB (Explanation of Benefits) from your insurer.",
  },
  results: {
    holdTip: "First step: ask the billing office to put your account on hold while the dispute is open, so it doesn’t go to collections.",
    breakdown: (parts: string[], total: string) => `${parts.join(" + ")} = ${total} you can dispute`,
    breakdownClaim: (total: string, reason: string) => `${total} you can dispute: ${reason}`,
    reasons: {
      DUPLICATE_CHARGE: "charged twice",
      BILL_EXCEEDS_EOB: "your bill is above what your EOB says you owe",
      LINE_NOT_ON_EOB: "not on your EOB",
      NO_INSURANCE_APPLIED: "insurance not applied to the bill",
      BALANCE_BILLING_IN_NETWORK: "the in-network discount billed to you",
      POSSIBLE_SURPRISE_BILL: "above in-network cost-sharing",
      NOT_ITEMIZED: "bill not itemized",
      POSSIBLE_UNBUNDLING: "possibly bundled",
    },
    notFoundTitle: "We couldn’t find that check",
    notFoundBody: "Results are stored only in the browser where you ran the check. If you saved a private case link, open it here.",
    overcharged: "You may be overcharged",
    nothingClear: "Nothing clearly overcharged — but a few things are worth asking",
    allGood: "Your bill matches your EOB 🎉",
    summary: (v: { bill: number; eob: number; issues: number; counted: number }) =>
      `The bill asks for ${usd(v.bill)}. Your insurer’s EOB says you owe ${usd(v.eob)}. We found ${v.issues} ${plural(v.issues, "issue", "issues")}` +
      (v.counted ? `; ${v.counted} count toward the disputable amount (each dollar counted once)` : "") +
      ".",
    found: "What we found",
    noIssues: "No issues found.",
    howWorksPre: "How this works: AI only reads your documents. Every issue and dollar amount above comes from fixed billing rules you can read in ",
    howWorksLink: "our open-source code",
    howWorksPost: ".",
    lineByLine: "Line by line",
    legend: (acct: string) => `Red = high confidence · Amber = medium · Blue = worth asking. Names and IDs are masked (${acct}).`,
    confirming: "Confirming your payment with Stripe…",
    canceled: "Checkout was canceled — you haven’t been charged.",
    paidFamily: "Payment confirmed — Family plan active. 🎉",
    paidSingle: "Payment confirmed — this bill is unlocked. 🎉",
  },
  flag: {
    actionStart: /^(Ask|Call|Request)\b/,
    included: "Already included above",
    notAdded: "Not added to the total",
    conf: { high: "High confidence", medium: "Medium confidence", low: "Worth asking" },
    source: (s: string) => `Source: ${s}`,
  },
  sbs: {
    chargesListed: "Charges listed on the bill",
    paidAdjustments: "Insurance paid & adjustments",
    otherBalance: "Other charges or previous balance",
    short: {
      DUPLICATE_CHARGE: "Duplicate",
      BILL_EXCEEDS_EOB: "Over EOB",
      LINE_NOT_ON_EOB: "Not on EOB",
      NO_INSURANCE_APPLIED: "No insurance",
      BALANCE_BILLING_IN_NETWORK: "Balance billing",
      POSSIBLE_SURPRISE_BILL: "Surprise bill?",
      NOT_ITEMIZED: "Not itemized",
      POSSIBLE_UNBUNDLING: "Ask about bundling",
    },
    yourBill: "Your bill",
    yourEob: "Your EOB",
    noLines: "This bill has no line items. Ask for an itemized bill.",
    noDate: "no date",
    noCode: "no code",
    noMatch: "No matching line on your EOB",
    notOnBill: "Not on your bill",
    billAsks: "Bill asks you to pay",
    eobSays: "EOB says you owe",
    yourResp: "Your responsibility",
    billed: "billed",
    allowed: "allowed",
    network: { in: "in-network", out: "out-of-network", unknown: "network unknown" },
  },
  paywall: {
    title: (amount: string | null) => `Get your dispute pack${amount ? ` and go after ${amount}` : ""}`,
    items: [
      "A ready-to-send letter to the billing office",
      "A claim review request for your insurer, when needed",
      "A phone script with the exact asks and escalation phrases",
      "Deadlines + a tracker with a 30-day follow-up reminder",
    ],
    single: "Fix this bill — $20",
    singleSub: "Launch price: $25 → $20 (−20%). One-time, no % of your savings.",
    family: "Family plan — $60/year",
    familySub: "Launch price: $120 → $60 (−50%). Every bill for your household, all year.",
    opening: "Opening checkout…",
    demoStrong: "Demo mode:",
    demoPre: "payments run in Stripe test mode. Use card",
    demoPost: ", any future date, any CVC and any ZIP. No real money is charged.",
  },
  pack: {
    sampleUnlocked: "Sample — unlocked for demo",
    sampleNote: "Real bills unlock for $20 (Stripe test mode in this demo).",
    unlocked: "✓ Unlocked",
    readyTitle: "Your dispute pack is ready to write",
    readyBody: "We’ll write a letter and a phone script using only the issues found above — no new claims.",
    writing: "Writing your letter… (about 30 seconds)",
    write: "Write my letter & phone script",
    englishNote: "",
    tabs: { letter: "Letter to billing", insurer: "Request to insurer", script: "Phone script", deadlines: "Deadlines" },
    today: "Today",
    inDays: (n: number) => `In ${n} ${plural(n, "day", "days")}`,
    detailsTitle: "Your details",
    detailsCount: (filled: number, total: number) => `— ${filled} of ${total} filled. Stays in this browser; never sent to our server.`,
    hide: "Hide",
    fillIn: "Fill in",
    hintOnBill: (last4: string | null) => (last4 ? `on your bill, ends in ${last4}` : "on your bill"),
    hintOnEob: (last4: string | null) => (last4 ? `on your EOB, ends in ${last4}` : "on your EOB"),
    fieldNames: {} as Record<string, string>,
    copy: "Copy",
    copied: "Copied ✓",
    download: "Download .txt",
    print: "Print / Save as PDF",
    footer: (allFilled: boolean) => `${allFilled ? "Send it, " : "Fill in your details above, send it, "}then track the dispute until it’s resolved.`,
    sent: "I sent the letter → track it",
    openTracker: "Open tracker",
    script: { opening: "Opening", asks: "Ask for", pushBack: "If they push back", escalation: "Escalate", writeDown: "Write down" },
    failed: "Couldn’t write the letter.",
  },
  deadlines: {
    callBilling: {
      title: "Call the billing office",
      detail: "Ask them to put the account on hold while the review is open, so it doesn't go to collections.",
    },
    sendLetter: { title: "Mail or upload the dispute letter", detail: "Keep a copy and note the date you sent it." },
    followUp: { title: "Follow up if you haven't heard back", detail: "Call again and reference your first call and your letter." },
    dueDate: { title: (date: string) => `Bill due date on the statement: ${formatDate(date)}`, detail: "Ask for the due date to be extended while the bill is under review." },
    appeal: {
      title: "Insurer appeal window",
      detail: "For most job-based plans you can file an internal appeal with your insurer within 180 days of the EOB/denial notice.",
    },
    nsa: { title: "No Surprises Act help", detail: "Questions or complaints: cms.gov/nosurprises or 1-800-985-3059." },
  },
  tracker: {
    sampleBadge: "Sample",
    loadSample: "Load a sample dispute",
    title: "My disputes",
    lede: "Billing disputes usually take a few calls over several weeks. Keep every call, reference number and follow-up date in one place.",
    saved: "You’ve saved",
    open: "Open disputes",
    inDispute: "In dispute",
    export: "Download backup",
    import: "Restore backup",
    storageNote: "Your tracker lives in this browser only. Use a private case link to open a case elsewhere, or export everything as a backup.",
    imported: (n: number) => `Imported ${n} ${plural(n, "dispute", "disputes")}.`,
    badImport: "That file isn’t a BillCheck export.",
    empty: "No disputes yet. Check a bill and unlock the dispute pack to start tracking.",
    status: { "Not started": "Not started", "Letter sent": "Letter sent", Called: "Called", Waiting: "Waiting", Resolved: "Resolved" },
    statusLabel: "Status",
    meta: (v: { bill: string; disputing: string; started: string }) => `Bill ${v.bill} · disputing ${v.disputing} · started ${v.started}`,
    openResults: "Open results",
    remove: "Remove",
    removeAria: (provider: string) => `Remove ${provider}`,
    removeConfirm: "Remove this dispute from your tracker?",
    otherDevice: "Open this case on another device:",
    followUp: "Follow-up date",
    addCalendar: "📅 Add reminder to calendar",
    amountSaved: "Amount saved ($)",
    markResolved: "Mark as Resolved to log what you saved.",
    callLog: "Call log",
    logCall: "+ Log a call",
    cancel: "Cancel",
    callDate: "Call date",
    who: "Who you spoke to",
    ref: "Reference #",
    refAria: "Reference number",
    saveCall: "Save call",
    notes: "What they said / promised",
    notesAria: "Notes",
    noCalls: "No calls logged yet. Always write down the rep’s name and a reference number.",
    unknownRep: "Unknown rep",
    refShort: "ref",
    icsTitle: (provider: string) => `Follow up: ${provider} bill dispute`,
    icsBody: (v: { provider: string; amount: string; sent: string | null }) =>
      `Call ${v.provider} billing. Disputing ${v.amount}. Reference your letter${v.sent ? ` sent ${v.sent}` : ""} and earlier calls. — BillCheck`,
  },
  caseLink: {
    title: "Save your case — no account needed",
    body: "Your case lives in this browser. A private link opens it on any device. The case data stays in the link itself, never on our server.",
    copy: "Copy private link",
    copied: "Link copied ✓",
    email: "Email it to myself",
    error: "Couldn’t make the link in this browser.",
    emailPlaceholder: "you@example.com",
    send: "Email me",
    sending: "Sending…",
    sent: (to: string) => `Sent to ${to} ✓ Check your inbox (and spam).`,
    updates: "Also email me when I mark the letter sent or change the status",
    updatesOn: (to: string) => `Case updates go to ${to}.`,
    stop: "Stop emails",
    privacy: "We use your email only to send this case. It’s kept in this browser, not on our server.",
    errors: {
      badEmail: "Please enter a valid email address.",
      emailLimit: "Too many emails in the last hour. Please try again later.",
      emailFailed: "We couldn’t send the email. Please try again.",
      emailOff: "Email isn’t available right now.",
      invalidRequest: "We couldn’t send the email. Please try again.",
    } as Record<string, string>,
    mailSubject: (provider: string) => `My BillCheck case: ${provider}`,
    mailBody: (url: string) =>
      `Open my BillCheck case (results, letter and tracker) on any device:\n\n${url}\n\nKeep this link private: anyone with it can see this case. BillCheck doesn’t store it.`,
  },
  open: {
    opening: "Opening your case…",
    failTitle: "We couldn’t open that case",
    damaged: "This link is incomplete or damaged. Try copying it again.",
    notCase: "This link isn’t a BillCheck case link.",
  },
  errors: {
    notBill: (v: Vars) =>
      "This doesn’t look like an itemized medical bill. Make sure it lists services, dates and charges." +
      (v.photo ? " If it’s a photo, try a clearer one, or paste the text instead." : ""),
    notEob: (v: Vars) =>
      "This doesn’t look like an EOB. It usually says “This is not a bill” at the top." + (v.photo ? " If it’s a photo, try a clearer one, or paste the text instead." : ""),
    notBoth: () =>
      "Neither document looks right. The bill should list services, dates and charges; the EOB usually says “This is not a bill” at the top.",
    generic: "Something went wrong. Please try again.",
    invalidRequest: "Invalid request.",
    tooManyFiles: (v: Vars) => `Please upload at most ${v.max} files for the ${v.doc === "bill" ? "bill" : "EOB"}.`,
    unsupportedFile: (v: Vars) => `“${v.name}” isn’t a supported file. Use PDF, JPG or PNG.`,
    missingBill: "Please add your itemized bill (a file or pasted text).",
    missingEob: "Please add your EOB from the insurer (a file or pasted text).",
    tooLarge: "Files are too large together (max about 4 MB). Try fewer pages or smaller photos.",
    rateLimited: (v: Vars) => `You’ve run a lot of checks in the last hour. Please try again in ${v.minutes} minutes.`,
    rateLimitedLetter: "Too many letters in the last hour. Please try again later.",
    notPaid: "This payment hasn’t been completed yet.",
    unlockFirst: "Please unlock this bill first.",
    aiBusy: "The AI service is busy right now. Please try again in a minute.",
    readFailed: "Reading the document failed. Please try again, or paste the text instead.",
    letterFailed: "We couldn’t write the letter this time. Please try again.",
    checkoutFailed: "We couldn’t start checkout. Please try again.",
    verifyFailed: "We couldn’t verify the payment. Please refresh the page.",
    notConfigured: "",
  },
  rules: {
    DUPLICATE_CHARGE: {
      title: (p: Vars) => `Charged twice: ${p.desc}`,
      explanation: (p: Vars) => {
        const basis: Record<string, string> = {
          billed: "the full billed amount (we couldn't find the insurer's numbers for it)",
          deductible: "the insurer's allowed amount, because your deductible applies",
          coinsurance: `your ${p.pct}% coinsurance`,
          eobShare: "your share on the EOB for the same service",
        };
        return (
          `This service appears ${p.onEob ? "more often on the bill than on your EOB" : "twice on the bill"}` +
          `${p.date ? ` for ${formatDate(String(p.date))}` : ""}. The insurer processed it once, so the extra line ` +
          `likely shouldn't be on your bill. Amount is based on ${basis[String(p.basis)] ?? basis.billed}.`
        );
      },
      source: (p: Vars) => (p.eobLine ? `EOB line ${p.eobLine} (processed once)` : "Rule: duplicate charge"),
    },
    BILL_EXCEEDS_EOB: {
      title: () => "Your bill is higher than what your EOB says you owe",
      explanation: (p: Vars) =>
        `The bill asks for ${usd(p.balance)}, but your insurer's EOB lists your responsibility as ${usd(p.eobTotal)}. ` +
        (p.allOut
          ? "Out-of-network providers can sometimes bill the difference, but not for emergency care or for anesthesia, radiology, labs " +
            "and assistant surgeons at an in-network facility (No Surprises Act). Ask the billing office to explain or correct the difference."
          : "For an in-network claim, you generally shouldn't pay more than the EOB amount. Ask the billing office to explain or correct the difference."),
      source: () => "EOB total vs. bill balance",
    },
    LINE_NOT_ON_EOB: {
      title: (p: Vars) => `Not on your EOB: ${p.desc}`,
      explanation: () =>
        "We couldn't find this charge on your insurer's EOB. It may never have been submitted to insurance, or it was billed separately. " +
        "Ask the provider to submit it to your insurer (or remove it) before you pay.",
      source: () => "Rule: no matching EOB line",
    },
    NO_INSURANCE_APPLIED: {
      title: () => "Insurance hasn't been applied to this bill",
      explanation: () =>
        "The bill shows $0 paid or adjusted by insurance, but your EOB shows the claim was processed. The provider may have billed you before " +
        "posting the insurer's payment and discount. Ask them to apply the EOB and send a corrected bill.",
      source: () => "Bill: insurance paid/adjusted = $0",
    },
    BALANCE_BILLING_IN_NETWORK: {
      title: () => "You're being billed for the in-network discount",
      explanation: (p: Vars) =>
        `The extra ${usd(p.gap)} matches the "amount not allowed" on your EOB. In-network providers agree to accept the allowed amount, ` +
        "so this difference usually can't be billed to you.",
      source: (p: Vars) => `EOB lines ${p.lines} (billed − allowed)`,
    },
    POSSIBLE_SURPRISE_BILL: {
      title: (p: Vars) => `Possible surprise bill: out-of-network ${p.emergency ? "emergency care" : p.kind}`,
      explanation: (p: Vars) =>
        (p.facilityKnown
          ? `Your EOB marks this as out-of-network ${p.emergency ? "emergency care" : `${p.kind} at an in-network facility`}. Under the federal No Surprises Act, you may only owe what you'd pay in-network. `
          : `Your EOB marks this ${p.kind} as out-of-network. If it was given at an in-network hospital or surgery center, the federal ` +
            "No Surprises Act says you only owe in-network cost-sharing and the provider can't bill you the rest. ") +
        "Learn more at cms.gov/nosurprises." +
        (p.estimated ? "" : " We don't know your in-network cost-sharing, so we show the full amount."),
      source: (p: Vars) => `EOB line ${p.eobLine} (out-of-network)`,
    },
    NOT_ITEMIZED: {
      title: () => "This bill isn't itemized",
      explanation: () =>
        "The bill only shows totals. You have the right to ask for an itemized bill with CPT/HCPCS codes for every service — " +
        "it's the only way to check it line by line. Ask for it before you pay.",
      source: () => "Rule: itemized bill required",
    },
    POSSIBLE_UNBUNDLING: {
      title: (p: Vars) => `Worth asking: ${p.part}`,
      explanation: (p: Vars) => {
        const notes: Record<string, string> = {
          bmp: "a basic metabolic panel is part of the comprehensive panel",
          panelTests: "single tests that are already included in the metabolic panel",
          cbc: "components of a complete blood count with differential",
          ecg: "parts of a complete ECG",
          supplies: "supplies that are usually included in the visit or facility fee",
          officeEr: "a second office visit billed on the same day as an ER visit",
        };
        return `This was billed separately next to "${p.whole}". These are often billed as one service (${notes[String(p.pair)] ?? ""}). Ask the billing office whether it should be bundled.`;
      },
      source: (p: Vars) => `Rule: commonly bundled codes ${p.partCode} + ${p.wholeCode}`,
    },
  },
};

export type Messages = typeof en;
