import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, escapeHtml, json, originIsAllowed } from "../_shared/http.ts";
import { emailFrame, emailFrom, replyTo, sendEmail } from "../_shared/resend.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT") || "mundaneapps-signup";
const manageUrl = `${supabaseUrl}/functions/v1/manage-signup`;
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

function validEmail(email: string) {
  return email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function fingerprint(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  const bytes = new TextEncoder().encode(`${rateLimitSalt}:${ip}:${agent.slice(0, 160)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { ok: false, error: "method_not_allowed" }, 405);
  if (!originIsAllowed(request)) return json(request, { ok: false, error: "origin_not_allowed" }, 403);

  let input: Record<string, unknown>;
  try { input = await request.json(); }
  catch { return json(request, { ok: false, error: "invalid_request" }, 400); }

  if (String(input.company || "").trim()) return json(request, { ok: true });

  const email = String(input.email || "").trim();
  const normalized = email.toLowerCase();
  const signup = input.signup === "beta" ? "beta" : input.signup === "community" ? "community" : "";
  const platform = ["android", "ios", "either"].includes(String(input.platform)) ? String(input.platform) : "either";
  const source = String(input.source || "website").trim().slice(0, 80) || "website";
  if (!validEmail(normalized)) return json(request, { ok: false, error: "invalid_email" }, 400);
  if (!signup) return json(request, { ok: false, error: "invalid_signup" }, 400);

  const hash = await fingerprint(request);
  const { data: allowed, error: rateError } = await supabase.rpc("consume_site_signup_rate_limit", {
    p_fingerprint_hash: hash,
    p_limit: 8,
  });
  if (rateError) return json(request, { ok: false, error: "temporary_failure" }, 503);
  if (!allowed) return json(request, { ok: false, error: "rate_limited" }, 429);

  const table = signup === "beta" ? "headsup_beta_signups" : "community_invitations";
  const audience = signup === "beta" ? "headsup-beta" : "community";
  const { data: existing, error: findError } = await supabase
    .from(table).select("*").eq("email_normalized", normalized).maybeSingle();
  if (findError) return json(request, { ok: false, error: "temporary_failure" }, 503);

  let subscriber = existing;
  let firstSignup = false;
  let resubscribed = false;
  if (!subscriber) {
    const record: Record<string, unknown> = { email, source };
    if (signup === "beta") record.platform = platform;
    const { data, error } = await supabase.from(table).insert(record).select("*").single();
    if (error) {
      const { data: raced } = await supabase.from(table).select("*").eq("email_normalized", normalized).maybeSingle();
      if (!raced) return json(request, { ok: false, error: "temporary_failure" }, 503);
      subscriber = raced;
    } else {
      subscriber = data;
      firstSignup = true;
    }
  } else {
    const updates: Record<string, unknown> = { email, source, last_seen_at: new Date().toISOString() };
    if (signup === "beta") updates.platform = platform;
    if (subscriber.status === "unsubscribed") {
      updates.status = "waiting";
      updates.email_updates = true;
      resubscribed = true;
    }
    await supabase.from(table).update(updates).eq("id", subscriber.id);
  }

  let emailPending = false;
  if (!subscriber.confirmation_email_sent_at || resubscribed) {
    const unsubscribeUrl = `${manageUrl}?action=unsubscribe&audience=${audience}&token=${subscriber.unsubscribe_token}`;
    const isBeta = signup === "beta";
    const title = isBeta ? "You're on the HeadsUp beta list" : "Welcome to the Mundane Circle";
    const body = isBeta
      ? `<p style="font-size:17px;line-height:1.65">We saved your request for <strong>${escapeHtml(platform)}</strong> beta access. We will email you when a suitable testing place opens and when there is a meaningful HeadsUp update.</p>`
      : '<p style="font-size:17px;line-height:1.65">Your community invitation request is saved. We will email you about invitations, product discussions, and meaningful roadmap decisions, not generic marketing.</p>';
    try {
      const sent = await sendEmail({
        from: emailFrom,
        to: [email],
        reply_to: replyTo,
        subject: title,
        html: emailFrame(title, body, unsubscribeUrl),
        text: `${title}\n\n${isBeta ? `We saved your request for ${platform} beta access.` : "Your Mundane Circle invitation request is saved."}\n\nStop updates: ${unsubscribeUrl}`,
        tags: [{ name: "audience", value: audience }, { name: "kind", value: "confirmation" }],
      }, resubscribed ? `signup-resubscribe-${audience}-${crypto.randomUUID()}` : `signup-confirmation-${audience}-${subscriber.id}`);
      const sentAt = new Date().toISOString();
      await supabase.from(table).update({ confirmation_email_sent_at: sentAt, last_email_sent_at: sentAt }).eq("id", subscriber.id);
      await supabase.from("signup_email_log").insert({ audience, subscriber_id: subscriber.id, recipient_email: email, email_kind: "confirmation", resend_email_id: sent.id });
    } catch (error) {
      emailPending = true;
      await supabase.from("signup_email_log").insert({ audience, subscriber_id: subscriber.id, recipient_email: email, email_kind: "confirmation", delivery_status: "failed", error_message: String(error).slice(0, 500) });
    }
  }

  return json(request, { ok: true, audience, firstSignup, emailPending });
});
