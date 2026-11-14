import { errorBody } from "@/lib/anthropic";
import { EmailRequest, emailConfigured, sendCaseEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { appUrl } from "@/lib/stripe";

/** Lets the page know whether to offer email (it falls back to the user's own mail app if not). */
export async function GET() {
  return Response.json({ enabled: emailConfigured() });
}

/**
 * Sends one case email right away. The template is fixed (no free text from the request apart from the
 * provider's name), the link must be this site's private case link, and sending is rate-limited per IP
 * and per recipient, so the endpoint can't be used to send arbitrary mail.
 */
export async function POST(request: Request) {
  if (!emailConfigured()) return Response.json(errorBody("Email isn't set up on this server.", "emailOff"), { status: 503 });

  const parsed = EmailRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json(errorBody("Please enter a valid email address.", "badEmail"), { status: 400 });
  const r = parsed.data;

  const base = appUrl(request).replace(/\/$/, "");
  if (!r.caseUrl.startsWith(`${base}/open#`) || !/^[A-Za-z0-9_-]+$/.test(r.caseUrl.slice(base.length + 6))) {
    return Response.json(errorBody("Invalid request.", "invalidRequest"), { status: 400 });
  }

  const ip = rateLimit(`email-ip:${clientIp(request)}`, 8);
  const to = rateLimit(`email-to:${r.to.toLowerCase()}`, 5);
  if (!ip.ok || !to.ok) return Response.json(errorBody("Too many emails in the last hour. Please try again later.", "emailLimit"), { status: 429 });

  try {
    await sendCaseEmail(r);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[email] send failed", (err as { code?: string }).code ?? (err as Error).name);
    return Response.json(errorBody("We couldn't send the email. Please try again.", "emailFailed"), { status: 502 });
  }
}
