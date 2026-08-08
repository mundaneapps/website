import { createClient } from "npm:@supabase/supabase-js@2";
import { emailFrame, emailFrom, replyTo, sendBatch } from "../_shared/resend.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", { auth: { persistSession: false } });
const adminSecret = Deno.env.get("BROADCAST_ADMIN_SECRET") || "";
const manageUrl = `${supabaseUrl}/functions/v1/manage-signup`;

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
  if (!adminSecret || request.headers.get("x-admin-secret") !== adminSecret) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let input: Record<string, unknown>;
  try { input = await request.json(); }
  catch { return Response.json({ ok: false, error: "invalid_request" }, { status: 400 }); }

  const audience = String(input.audience || "");
  const campaignId = String(input.campaignId || "").trim().slice(0, 120);
  const subject = String(input.subject || "").trim().slice(0, 200);
  const html = String(input.html || "");
  const text = String(input.text || "");
  if (!["community", "headsup-beta"].includes(audience) || !campaignId || !subject || (!html && !text)) {
    return Response.json({ ok: false, error: "invalid_campaign" }, { status: 400 });
  }

  const table = audience === "headsup-beta" ? "headsup_beta_signups" : "community_invitations";
  const { data: subscribers, error } = await supabase.from(table)
    .select("id,email,unsubscribe_token")
    .eq("email_updates", true)
    .neq("status", "unsubscribed")
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return Response.json({ ok: false, error: "audience_unavailable" }, { status: 503 });
  if (!subscribers?.length) return Response.json({ ok: true, sent: 0 });

  let sentCount = 0;
  for (let offset = 0; offset < subscribers.length; offset += 100) {
    const recipients = subscribers.slice(offset, offset + 100);
    const batch = recipients.map((subscriber) => {
      const unsubscribeUrl = `${manageUrl}?action=unsubscribe&audience=${audience}&token=${subscriber.unsubscribe_token}`;
      return {
        from: emailFrom,
        to: [subscriber.email],
        reply_to: replyTo,
        subject,
        html: emailFrame(subject, html || `<p>${text}</p>`, unsubscribeUrl),
        text: `${text || subject}\n\nStop updates: ${unsubscribeUrl}`,
        tags: [{ name: "audience", value: audience }, { name: "campaign", value: campaignId.replace(/[^a-zA-Z0-9_-]/g, "_") }],
      };
    });
    const result = await sendBatch(batch, `campaign-${campaignId}-${offset / 100}`);
    const sentAt = new Date().toISOString();
    const logs = recipients.map((subscriber, index) => ({
      audience,
      subscriber_id: subscriber.id,
      recipient_email: subscriber.email,
      email_kind: "update",
      campaign_id: campaignId,
      resend_email_id: result.data[index]?.id || null,
    }));
    await supabase.from("signup_email_log").insert(logs);
    await supabase.from(table).update({ last_email_sent_at: sentAt }).in("id", recipients.map((subscriber) => subscriber.id));
    sentCount += recipients.length;
  }

  return Response.json({ ok: true, audience, sent: sentCount, capped: subscribers.length === 500 });
});
