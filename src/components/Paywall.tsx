"use client";

import { useEffect, useState } from "react";

export function Paywall({ referral }: { referral: string | null }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [myLink, setMyLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let code = "";
    try {
      code = localStorage.getItem("fb_ref") ?? "";
      if (!code) {
        code = Math.random().toString(36).slice(2, 8);
        localStorage.setItem("fb_ref", code);
      }
    } catch {
      code = Math.random().toString(36).slice(2, 8);
    }
    setMyLink(`${window.location.origin}/?ref=${code}`);
  }, []);

  async function checkout() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referral }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setMsg(data.error ?? "Checkout is not available right now.");
    } catch {
      setMsg("Checkout is not available right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="pricing" className="rounded-2xl bg-stone-900 p-6 text-white sm:p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <div className="text-sm uppercase tracking-wider text-emerald-400">FinanceBro Pro</div>
          <h2 className="mt-2 text-2xl font-semibold">Stay on track until you get the keys</h2>
          <ul className="mt-4 space-y-2 text-stone-300">
            <li>✓ Monthly re-check: new leaks and price hikes, spotted for you</li>
            <li>✓ Renewal reminders before every charge</li>
            <li>✓ Step-by-step cancel and negotiate scripts</li>
            <li>✓ Down-payment tracker and mortgage readiness check</li>
          </ul>
        </div>
        <div className="rounded-xl bg-white/5 p-5">
          <div className="text-4xl font-semibold">
            $5<span className="text-lg font-normal text-stone-400">/month</span>
          </div>
          <div className="text-sm text-emerald-400">
            First month free{referral ? " + 1 bonus month from your friend" : ""}. Cancel anytime in one click.
          </div>
          <button
            onClick={checkout}
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-emerald-500 py-3 font-medium text-stone-900 hover:bg-emerald-400 disabled:opacity-60"
          >
            {loading ? "Opening checkout…" : "Start free month"}
          </button>
          {msg && <p className="mt-2 text-sm text-amber-300">{msg}</p>}
          <div className="mt-5 border-t border-white/10 pt-4 text-sm text-stone-300">
            Invite a friend — you both get a month free.
            <div className="mt-2 flex gap-2">
              <input readOnly value={myLink} className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs" />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(myLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="rounded-lg bg-white/10 px-3 text-xs hover:bg-white/20"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
