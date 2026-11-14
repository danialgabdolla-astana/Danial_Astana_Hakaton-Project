import nodemailer from "nodemailer";
import { z } from "zod";
import { formatDate } from "./dates";
import { buildIcs } from "./ics";
import { formatUsd } from "./money";

/**
 * Case emails, sent the moment something happens (case saved, letter sent, status changed). There is no
 * database and no scheduler: the browser asks for an email and the server sends it straight away. The
 * address is kept only in the user's browser.
 *
 * Any SMTP account works (Gmail with an app password, Brevo, Mailgun…): set SMTP_USER and SMTP_PASS,
 * and optionally SMTP_HOST (default smtp.gmail.com), SMTP_PORT (default 465) and EMAIL_FROM.
 */
export function emailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export const EmailRequest = z.object({
  to: z.string().trim().max(254).email(),
  kind: z.enum(["case", "letterSent", "status"]),
  locale: z.enum(["en", "es", "fr"]).default("en"),
  provider: z.string().trim().max(80),
  billBalance: z.number().nonnegative().max(10_000_000),
  disputable: z.number().nonnegative().max(10_000_000),
  status: z.enum(["Not started", "Letter sent", "Called", "Waiting", "Resolved"]).optional(),
  followUpDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  /** The private case link: must be this site's /open#… link (checked by the route). */
  caseUrl: z.string().max(60_000),
});
export type EmailRequest = z.infer<typeof EmailRequest>;

type Copy = {
  subject: (r: EmailRequest) => string;
  intro: Record<EmailRequest["kind"], (r: EmailRequest) => string>;
  status: (s: string) => string;
  statuses: Record<NonNullable<EmailRequest["status"]>, string>;
  followUp: (d: string) => string;
  linkIntro: string;
  linkCta: string;
  linkPrivate: string;
  footer: string;
};

const COPY: Record<EmailRequest["locale"], Copy> = {
  en: {
    subject: (r) =>
      r.kind === "case"
        ? `Your BillCheck case: ${r.provider} — ${formatUsd(r.disputable)} to dispute`
        : r.kind === "letterSent"
          ? `Letter sent ✓ ${r.provider} — your next steps`
          : `${r.provider} dispute: ${COPY.en.statuses[r.status ?? "Waiting"]}`,
    intro: {
      case: (r) => `Here is your BillCheck case for ${r.provider}. The bill asks for ${formatUsd(r.billBalance)}; you may be able to dispute ${formatUsd(r.disputable)}.`,
      letterSent: (r) => `You sent your dispute letter to ${r.provider}. Nice work. Billing disputes usually take a few calls over several weeks, so we'll keep your case one click away.`,
      status: (r) => `Your dispute with ${r.provider} was updated.`,
    },
    status: (s) => `Status: ${s}`,
    statuses: { "Not started": "Not started", "Letter sent": "Letter sent", Called: "Called", Waiting: "Waiting", Resolved: "Resolved" },
    followUp: (d) => `Next follow-up: ${d}. A calendar reminder is attached.`,
    linkIntro: "Open your case (results, letter, phone script and tracker) on any device:",
    linkCta: "Open my case",
    linkPrivate: "Keep this link private: anyone with it can see this case. BillCheck doesn’t store your case on its servers.",
    footer: "BillCheck is not a law firm or medical provider. Not legal or medical advice. You got this email because you asked for it on BillCheck.",
  },
  es: {
    subject: (r) =>
      r.kind === "case"
        ? `Tu caso de BillCheck: ${r.provider} — ${formatUsd(r.disputable)} para disputar`
        : r.kind === "letterSent"
          ? `Carta enviada ✓ ${r.provider}: tus próximos pasos`
          : `Disputa con ${r.provider}: ${COPY.es.statuses[r.status ?? "Waiting"]}`,
    intro: {
      case: (r) => `Este es tu caso de BillCheck para ${r.provider}. La factura pide ${formatUsd(r.billBalance)}; podrías disputar ${formatUsd(r.disputable)}.`,
      letterSent: (r) => `Enviaste tu carta de disputa a ${r.provider}. ¡Bien hecho! Las disputas suelen tomar varias llamadas durante semanas, así que tu caso queda a un clic.`,
      status: (r) => `Se actualizó tu disputa con ${r.provider}.`,
    },
    status: (s) => `Estado: ${s}`,
    statuses: { "Not started": "Sin empezar", "Letter sent": "Carta enviada", Called: "Llamé", Waiting: "En espera", Resolved: "Resuelta" },
    followUp: (d) => `Próximo seguimiento: ${d}. Adjuntamos un recordatorio para tu calendario.`,
    linkIntro: "Abre tu caso (resultados, carta, guion y seguimiento) en cualquier dispositivo:",
    linkCta: "Abrir mi caso",
    linkPrivate: "Mantén este enlace en privado: cualquiera que lo tenga puede ver este caso. BillCheck no guarda tu caso en sus servidores.",
    footer: "BillCheck no es un bufete de abogados ni un proveedor médico. No es asesoría legal ni médica. Recibiste este correo porque lo pediste en BillCheck.",
  },
  fr: {
    subject: (r) =>
      r.kind === "case"
        ? `Votre dossier BillCheck : ${r.provider} — ${formatUsd(r.disputable)} à contester`
        : r.kind === "letterSent"
          ? `Lettre envoyée ✓ ${r.provider} : prochaines étapes`
          : `Contestation ${r.provider} : ${COPY.fr.statuses[r.status ?? "Waiting"]}`,
    intro: {
      case: (r) => `Voici votre dossier BillCheck pour ${r.provider}. La facture demande ${formatUsd(r.billBalance)} ; vous pourriez contester ${formatUsd(r.disputable)}.`,
      letterSent: (r) => `Vous avez envoyé votre lettre de contestation à ${r.provider}. Bravo ! Une contestation demande souvent plusieurs appels sur quelques semaines : votre dossier reste à un clic.`,
      status: (r) => `Votre contestation avec ${r.provider} a été mise à jour.`,
    },
    status: (s) => `Statut : ${s}`,
    statuses: { "Not started": "Pas commencée", "Letter sent": "Lettre envoyée", Called: "Appel passé", Waiting: "En attente", Resolved: "Résolue" },
    followUp: (d) => `Prochaine relance : ${d}. Un rappel d’agenda est joint.`,
    linkIntro: "Ouvrez votre dossier (résultats, lettre, script et suivi) sur n’importe quel appareil :",
    linkCta: "Ouvrir mon dossier",
    linkPrivate: "Gardez ce lien privé : toute personne qui l’a peut voir ce dossier. BillCheck ne conserve pas votre dossier sur ses serveurs.",
    footer: "BillCheck n’est ni un cabinet d’avocats ni un prestataire de soins. Ce n’est pas un conseil juridique ou médical. Vous recevez cet e-mail parce que vous l’avez demandé sur BillCheck.",
  },
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Builds the email (subject, text, HTML, optional .ics). Pure, so it is unit-tested. */
export function composeEmail(r: EmailRequest) {
  const c = COPY[r.locale];
  const provider = r.provider.replace(/[\r\n]+/g, " ");
  const req = { ...r, provider };
  const lines = [c.intro[r.kind](req)];
  if (r.status) lines.push(c.status(c.statuses[r.status]));
  if (r.followUpDate && r.status !== "Resolved") lines.push(c.followUp(formatDate(r.followUpDate, r.locale)));

  const text = [...lines, "", c.linkIntro, r.caseUrl, "", c.linkPrivate, "", "— BillCheck", c.footer].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f7faf9;font-family:Arial,Helvetica,sans-serif;color:#1c1917">
<div style="max-width:560px;margin:0 auto;padding:24px">
<p style="font-size:20px;font-weight:bold;margin:0 0 16px"><span style="display:inline-block;background:#0f766e;color:#fff;border-radius:8px;padding:2px 8px;margin-right:6px">✓</span>BillCheck</p>
${lines.map((l) => `<p style="font-size:16px;line-height:1.5;margin:0 0 12px">${esc(l)}</p>`).join("\n")}
<p style="font-size:15px;margin:20px 0 12px">${esc(c.linkIntro)}</p>
<p style="margin:0 0 20px"><a href="${esc(r.caseUrl)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:10px">${esc(c.linkCta)}</a></p>
<p style="font-size:13px;color:#57534e;line-height:1.5">${esc(c.linkPrivate)}</p>
<p style="font-size:12px;color:#78716c;line-height:1.5;margin-top:24px">${esc(c.footer)}</p>
</div></body></html>`;

  const ics =
    r.followUpDate && r.status !== "Resolved"
      ? buildIcs({
          title: `BillCheck: follow up with ${provider}`,
          date: new Date(r.followUpDate + "T09:00:00"),
          description: `${c.intro.status(req)} ${r.caseUrl.length < 1800 ? r.caseUrl : ""}`.trim(),
          uid: `billcheck-${r.followUpDate}-${provider.replace(/\W+/g, "-")}`,
        })
      : null;
  return { subject: c.subject(req), text, html, ics };
}

let transport: nodemailer.Transporter | null = null;

export async function sendCaseEmail(r: EmailRequest) {
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const mail = composeEmail(r);
  await transport.sendMail({
    from: process.env.EMAIL_FROM || `BillCheck <${process.env.SMTP_USER}>`,
    to: r.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    attachments: mail.ics ? [{ filename: "billcheck-follow-up.ics", content: mail.ics, contentType: "text/calendar" }] : [],
  });
}
