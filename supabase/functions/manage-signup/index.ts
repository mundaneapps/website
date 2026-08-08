import { createClient } from "npm:@supabase/supabase-js@2";
import { escapeHtml } from "../_shared/http.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  { auth: { persistSession: false } },
);

function page(title: string, message: string, status = 200) {
  return new Response(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)} · MundaneApps</title><body style="margin:0;background:#f6f5f2;color:#1e2430;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"><main style="max-width:620px;margin:12vh auto;padding:32px"><p style="color:#35617a;font-weight:700">MundaneApps</p><h1>${escapeHtml(title)}</h1><p style="font-size:18px;line-height:1.6;color:#5f687a">${escapeHtml(message)}</p><p><a style="color:#35617a" href="https://mundaneapps.com">Return to mundaneapps.com</a></p></main></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

Deno.serve(async (request) => {
  if (request.method !== "GET") return page("That action is not available", "Open the link from the email you received.", 405);
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const audience = url.searchParams.get("audience");
  const token = url.searchParams.get("token") || "";
  if (action !== "unsubscribe" || !["community", "headsup-beta"].includes(audience || "") || !/^[0-9a-f-]{36}$/i.test(token)) {
    return page("This link is not valid", "The preference link is incomplete or has expired.", 400);
  }

  const table = audience === "headsup-beta" ? "headsup_beta_signups" : "community_invitations";
  const { data, error } = await supabase.from(table).update({ status: "unsubscribed", email_updates: false }).eq("unsubscribe_token", token).select("id").maybeSingle();
  if (error || !data) return page("We could not find that signup", "Nothing was changed. You can reply to the email if you need help.", 404);
  return page("You are unsubscribed", audience === "headsup-beta" ? "We will not send further HeadsUp beta updates to this address." : "We will not send further Mundane Circle updates to this address.");
});
