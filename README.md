# mundaneapps.com

The public marketing + legal site for **MundaneApps** — quiet, privacy-first
apps that come in handy every day. First app: **Heads-Up**.

Plain static HTML/CSS/JS. **No build step, no dependencies, no analytics, no
third-party requests of any kind** (a tracker on a privacy-policy site would
ironically create consent obligations the apps themselves don't have). Just
open the files or push them to any static host.

## Pages

| File | URL |
|---|---|
| `index.html` | `/` |
| `headsup.html` | `/headsup` |
| `privacy.html` | `/privacy` |
| `terms.html` | `/terms` |
| `support.html` | `/support` |
| `delete-account.html` | `/delete-account` |
| `404.html` | served for unknown paths |

`style.css` (shared stylesheet, light/dark via `prefers-color-scheme`) and
`main.js` (tiny vanilla enhancement: scroll reveal, mobile nav, sticky-header
shadow) are shared across all pages. `assets/` holds the logo, favicon, and app
icon. `CNAME` binds the custom domain; `.nojekyll` disables Jekyll processing.

> **Why clean URLs work:** the app hardcodes `mundaneapps.com/privacy` and
> `/terms` (no `.html`). GitHub Pages automatically serves `privacy.html` at
> `/privacy`, so the files must stay at the repo root — do not move them into
> subfolders.

## Before publishing — required

- [ ] **[HUMAN]** In `terms.html`, replace **`[legal name/entity — to be
      supplied]`** (§ intro) with the final registered/legal publisher name.
- [ ] **[HUMAN]** In `terms.html`, replace **`[Governing-law jurisdiction — to
      be supplied]`** (§9) with the governing-law jurisdiction (and optional
      venue/arbitration clause).
- [ ] Confirm the policy version on `privacy.html`/`terms.html` (currently
      `2026-07`) matches `kTermsVersion` in the app's
      `lib/utils/app_constants.dart`.

## When Heads-Up goes live

- [ ] Replace the disabled `store-btn` "Coming soon" placeholders in
      `headsup.html` (2×) with real, linked Google Play / App Store buttons, and
      remove the "In development" badge (the product card badge in `index.html`).

## Deploy — GitHub Pages (current setup)

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
> DMARC, e.g. Resend) when adding the Pages records — they're separate record
> types/names and shouldn't conflict, but review the full record list before
> and after.

## Local preview

No build needed. From this directory:

```bash
python -m http.server 8000     # then open http://localhost:8000
```
