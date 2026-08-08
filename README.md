# mundaneapps.com

The public marketing + legal site for **MundaneApps**: quiet, privacy-first
apps that come in handy every day. First app: **Heads-Up**.

The public site is plain HTML/CSS/JS with no build step, analytics, or trackers.
Signup forms post only when submitted to a Supabase Edge Function; Supabase
stores the two audiences separately and Resend sends confirmations and later
audience updates from the server side.

## Pages

| File | URL |
|---|---|
| `index.html` | `/` |
| `headsup.html` | `/headsup` |
| `about.html` | `/about` |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `support.html` | `/support` |
| `delete-account.html` | `/delete-account` |
| `404.html` | served for unknown paths |

`style.css` (shared stylesheet with a saved light/dark choice) and
`main.js` (dependency-free direction-aware reveals, reversible scroll-linked
product stories, mobile nav, and sticky-header behavior) are shared across all
pages. Motion is reduced to a static, readable layout when the browser requests
reduced motion.
`assets/` holds the logo, favicon, and app icon. `CNAME` binds the custom domain;
`.nojekyll` disables Jekyll processing.

## Signup backend: Supabase + Resend

The repository includes:

- `supabase/migrations/202608080001_site_signups.sql`: separate community and
  HeadsUp beta tables, email audit log, hashed rate limiting, and RLS.
- `supabase/functions/site-signup`: validates and stores a signup, then sends
  the first confirmation through Resend.
- `supabase/functions/manage-signup`: one-click unsubscribe handling.
- `supabase/functions/send-signup-update`: administrator-only future updates,
  sent in Resend batches of 100 with per-recipient unsubscribe links.

To connect a Supabase project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
cp supabase/.env.example supabase/.env.local
# Fill supabase/.env.local. It is ignored by git.
supabase secrets set --env-file supabase/.env.local
supabase functions deploy site-signup
supabase functions deploy manage-signup
supabase functions deploy send-signup-update
```

Then set the public, non-secret endpoint in `site-config.js`:

```js
window.MUNDANEAPPS_CONFIG = {
  signupEndpoint: "https://YOUR_PROJECT_REF.supabase.co/functions/v1/site-signup"
};
```

Never put a Supabase service-role key or Resend API key in `site-config.js`.
They belong only in Supabase Function Secrets.

Send a later update from a trusted machine with a unique campaign ID:

```bash
curl --request POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-signup-update' \
  --header 'content-type: application/json' \
  --header 'x-admin-secret: YOUR_BROADCAST_ADMIN_SECRET' \
  --data '{"audience":"community","campaignId":"circle-2026-08","subject":"A Mundane Circle update","html":"<p>What changed…</p>","text":"What changed…"}'
```

> **Why clean URLs work:** the app hardcodes `mundaneapps.com/privacy` and
> `/terms` (no `.html`). GitHub Pages automatically serves `privacy.html` at
> `/privacy`, so the files must stay at the repo root. Do not move them into
> subfolders.

## Before publishing: required

- [ ] **[HUMAN]** In `terms.html`, replace **`[legal name/entity, to be
      supplied]`** (§ intro) with the final registered/legal publisher name.
- [ ] **[HUMAN]** In `terms.html`, replace **`[Governing-law jurisdiction, to
      be supplied]`** (§9) with the governing-law jurisdiction (and optional
      venue/arbitration clause).
- [ ] Confirm the policy version on `privacy.html`/`terms.html` (currently
      `2026-07`) matches `kTermsVersion` in the app's
      `lib/utils/app_constants.dart`.

## When Heads-Up goes live

- [ ] Replace the disabled `store-btn` "Coming soon" placeholders in
      `headsup.html` (2×) with real, linked Google Play / App Store buttons, and
      remove the "In development" badge (the product card badge in `index.html`).

## Deploy: GitHub Pages (current setup)

1. Push this directory's contents to the repo root of
   `github.com/mundaneapps/website` on the `main` branch.
2. Repo **Settings → Pages** → **Build and deployment** → Source:
   **Deploy from a branch** → Branch: **`main`** / **`/ (root)`** → Save.
3. GitHub reads the `CNAME` file and shows `mundaneapps.com` under **Custom
   domain**. Add the DNS records GitHub lists at your registrar (GoDaddy):
   - Four apex `A` records → `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - (optional) a `CNAME` for `www` → `mundaneapps.github.io`
4. Wait for DNS to propagate, then tick **Enforce HTTPS** in Settings → Pages.
5. Verify every path loads over HTTPS from a phone browser: `/`, `/privacy`,
   `/terms`, `/support`, `/delete-account`.

> **DNS caution:** do not disturb any existing email records (SPF / DKIM /
> DMARC, e.g. Resend) when adding the Pages records. They're separate record
> types/names and shouldn't conflict, but review the full record list before
> and after.

## Local preview

No build needed. From this directory:

```bash
python3 serve.py 8000          # then open http://localhost:8000
```

Use `serve.py` for local previews so clean routes such as `/headsup`, `/about`,
and `/support` resolve the same way they do in production.
