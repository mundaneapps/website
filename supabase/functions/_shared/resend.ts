import { escapeHtml } from "./http.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
export const emailFrom = Deno.env.get("RESEND_FROM") || "MundaneApps <updates@mundaneapps.com>";
export const replyTo = Deno.env.get("RESEND_REPLY_TO") || "info@mundaneapps.com";

export async function sendEmail(payload: Record<string, unknown>, idempotencyKey: string) {
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || "Resend rejected the email");
  return result as { id: string };
}

export async function sendBatch(payload: Record<string, unknown>[], idempotencyKey: string) {
  if (!resendApiKey) throw new Error("RESEND_API_KEY is not configured");
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result?.message || "Resend rejected the email batch");
  return result as { data: Array<{ id: string }> };
}

export function emailFrame(title: string, body: string, unsubscribeUrl: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f5f2;color:#1e2430;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><div style="max-width:600px;margin:auto;padding:44px 24px"><p style="color:#35617a;font-weight:700">MundaneApps</p><h1 style="font-size:30px;line-height:1.15">${escapeHtml(title)}</h1>${body}<p style="margin-top:36px;color:#5f687a;font-size:13px">You received this because you registered on mundaneapps.com. <a style="color:#35617a" href="${escapeHtml(unsubscribeUrl)}">Stop these updates</a>.</p></div></body></html>`;
}
