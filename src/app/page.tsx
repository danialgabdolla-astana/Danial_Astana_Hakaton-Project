import Link from "next/link";

const STATS = [
  { n: "43%", t: "of US adults say they've received a medical or dental bill they thought contained an error.", s: "KFF Health Care Debt Survey" },
  { n: "45%", t: "of insured working-age adults got a bill for something they thought insurance should have covered.", s: "Commonwealth Fund, 2024" },
  { n: "38%", t: "of people who disputed a billing error had the bill reduced or eliminated.", s: "Commonwealth Fund, 2024" },
];

const FAQ = [
  {
    q: "What's an EOB, and where do I find it?",
    a: "The Explanation of Benefits is the statement your insurer sends after processing a claim. It says “This is not a bill” and shows what the provider charged, what your plan allowed and paid, and what you owe. It's in your insurer's app or website, or in the mail.",
  },
  {
    q: "Why not just paste my bill into ChatGPT?",
    a: "A chatbot reads one document and guesses. BillCheck matches every bill line to your EOB, applies fixed billing rules (the same ones every time), shows the source of each finding, never invents codes, and then tracks your dispute with deadlines and follow-ups. It's a process, not a prompt.",
  },
  {
    q: "What happens to my documents?",
    a: "Files are processed in memory to read the lines and are never stored on our servers. We mask names, member IDs and account numbers. Your results and tracker are saved only in your browser. We don't claim to be HIPAA-compliant; we simply don't keep your files.",
  },
  {
    q: "Do I need to connect my insurance or bank account?",
    a: "No. Two documents are all we need — no logins, no account linking.",
  },
  {
    q: "What if BillCheck is wrong?",
    a: "Every finding shows a confidence level and the exact line or rule it came from. The letter asks the billing office to explain or correct — it doesn't accuse anyone. You stay in control of what you send.",
  },
  {
    q: "Is this legal or medical advice?",
    a: "No. BillCheck is not a law firm or medical provider. We help you read your documents and ask the right questions.",
  },
  {
    q: "I don't have insurance. Can you help?",
    a: "Not yet — without an EOB there's nothing to compare against. Help with cash prices and financial assistance is coming soon.",
  },
];

const VS_CHAT: [string, string, string][] = [
  ["Reads your bill and your EOB together", "One document at a time, usually", "Matches every bill line to an EOB line"],
  ["Where the numbers come from", "The model's best guess, can change between tries", "8 fixed, unit-tested billing rules: same bill, same answer"],
  ["Shows its work", "Rarely", "Each issue cites the exact lines and the rule"],
  ["Knows your rights", "Only if you ask the right question", "No Surprises Act, itemized bills, appeal windows built in"],
  ["After the answer", "You're on your own", "Letter, phone script, deadlines, tracker and calendar reminders"],
  ["Your documents", "Stored in your chat history", "Names masked, files never stored"],
];

const COMPARE = [
  ["Free AI chatbots", "Reads one document, can invent codes, no follow-up", "Free"],
  ["Apps that link your insurance", "Need your insurance login", "Free–$60/mo"],
  ["Bill advocates", "Take 10–25% of savings, often $5,000+ bills only", "% of savings"],
  ["Per-document review services", "Human review, slower", "~$69–$129"],
];

export default function Home() {
  return (
    <main>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pt-20">
        <p className="mb-4 inline-block rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">For insured adults with a medical bill they don&apos;t understand</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Your medical bill might be wrong. Check it against your EOB in 2 minutes.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-stone-600">
          Upload your bill and your insurer&apos;s Explanation of Benefits. BillCheck matches every line, shows what you can dispute, and gives you a
          ready-to-send letter, a phone script and deadlines.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/check" className="rounded-xl bg-teal-700 px-6 py-3.5 text-center text-lg font-semibold text-white shadow-sm hover:bg-teal-800">
            Check my bill
          </Link>
          <Link href="/check?sample=1" className="rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-center text-lg font-medium hover:bg-stone-100">
            Try a sample bill
          </Link>
        </div>
        <p className="mt-3 text-sm text-stone-600">
          Or try a{" "}
          <Link href="/check?sample=2" className="font-medium text-teal-800 underline underline-offset-2">
            surprise anesthesia bill
          </Link>{" "}
          (No Surprises Act case).
        </p>
        <p className="mt-4 text-sm text-stone-500">Free check · No sign-up · No insurance or bank login · Files never stored</p>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {STATS.map((s) => (
            <div key={s.n}>
              <div className="text-4xl font-semibold text-teal-800">{s.n}</div>
              <p className="mt-2 text-stone-700">{s.t}</p>
              <p className="mt-1 text-xs text-stone-500">{s.s}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-10 text-sm text-stone-600 sm:px-6">
          Insurance doesn&apos;t stop bills: the average deductible for job-based coverage is $1,886, and 34% of covered workers have $2,000 or more
          (KFF 2025). Until you meet it, you pay almost everything — so an inflated bill inflates your share.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ["Upload two documents", "Your itemized bill and your EOB — PDF, photo or pasted text. Names and IDs are masked."],
            ["See what doesn't match", "We pair each bill line with your EOB and run 8 billing rules: duplicates, charges insurance never saw, bills above your EOB, surprise out-of-network bills and more."],
            ["Dispute it, step by step", "Get a letter, a phone script and deadlines. Track every call until it's resolved."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-teal-700 text-sm font-semibold text-white">{i + 1}</div>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-stone-600">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 rounded-2xl bg-stone-900 p-6 text-stone-200">
          <p className="font-medium text-white">AI reads. Rules decide.</p>
          <p className="mt-1 text-sm">
            AI only transcribes your documents into data. Every issue and every dollar amount comes from fixed, tested billing rules — so the same bill
            always gets the same answer, and each finding shows exactly where it came from.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="vs-chat">
        <h2 id="vs-chat" className="text-2xl font-semibold">Why not just ask ChatGPT?</h2>
        <p className="mt-2 max-w-2xl text-stone-600">
          A chatbot can explain what a CPT code means. Getting money back takes a matched audit, a paper trail and follow-up.
        </p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="bg-stone-50 text-stone-500">
                <th className="px-4 py-3 font-medium" scope="col"></th>
                <th className="px-4 py-3 font-medium" scope="col">General AI chatbot</th>
                <th className="px-4 py-3 font-medium text-teal-900" scope="col">BillCheck</th>
              </tr>
            </thead>
            <tbody>
              {VS_CHAT.map(([what, chat, us]) => (
                <tr key={what} className="border-t border-stone-200">
                  <th scope="row" className="px-4 py-3 font-medium">{what}</th>
                  <td className="px-4 py-3 text-stone-600">{chat}</td>
                  <td className="px-4 py-3 text-teal-900">✓ {us}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white" aria-labelledby="pricing">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="pricing" className="text-2xl font-semibold">Simple pricing. No cut of your savings.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Price name="Free check" price="$0" items={["Bill vs. EOB, line by line", "Every issue with confidence + source", "How much you can dispute"]} />
            <Price
              name="Fix this bill"
              price="$19"
              note="one-time"
              highlight
              items={["Dispute letter to the billing office", "Insurer review request when needed", "Phone script with escalation phrases", "Deadlines + dispute tracker"]}
            />
            <Price name="Family plan" price="$59" note="per year" items={["Every bill for your household", "All dispute packs included", "Tracker + reminders"]} />
          </div>
          <h3 className="mt-12 font-semibold">How BillCheck compares</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-stone-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">Option</th>
                  <th className="py-2 pr-4 font-medium">Catch</th>
                  <th className="py-2 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([a, b, c]) => (
                  <tr key={a} className="border-t border-stone-200">
                    <td className="py-2 pr-4">{a}</td>
                    <td className="py-2 pr-4 text-stone-600">{b}</td>
                    <td className="py-2">{c}</td>
                  </tr>
                ))}
                <tr className="border-t border-stone-200 font-medium text-teal-900">
                  <td className="py-2 pr-4">BillCheck</td>
                  <td className="py-2 pr-4">Line-by-line EOB match, rules not guesses, tracks the dispute. Two files, no logins.</td>
                  <td className="py-2">$19 per bill</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-semibold">Questions</h2>
        <div className="mt-6 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
          {FAQ.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="mr-2 text-teal-700 group-open:hidden">+</span>
                <span className="mr-2 hidden text-teal-700 group-open:inline">−</span>
                {f.q}
              </summary>
              <p className="mt-2 text-stone-600">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/check?sample=1" className="rounded-xl bg-teal-700 px-6 py-3.5 text-lg font-semibold text-white hover:bg-teal-800">
            See it on a sample bill
          </Link>
        </div>
      </section>
    </main>
  );
}

function Price({ name, price, note, items, highlight }: { name: string; price: string; note?: string; items: string[]; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 ${highlight ? "border-teal-600 ring-2 ring-teal-600/20" : "border-stone-200"}`}>
      <div className="font-medium">{name}</div>
      <div className="mt-2 text-4xl font-semibold">
        {price}
        {note && <span className="ml-1 text-base font-normal text-stone-500">{note}</span>}
      </div>
      <ul className="mt-4 space-y-2 text-sm text-stone-700">
        {items.map((i) => (
          <li key={i}>✓ {i}</li>
        ))}
      </ul>
    </div>
  );
}
