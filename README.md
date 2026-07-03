# Vibe Coding с Lovable — Landing Page

Landing page for the free "Vibe Coding с Lovable" webinar, built with [Astro](https://astro.build) and deployed as a [Cloudflare Worker](https://developers.cloudflare.com/workers/). Email signups are stored in a [Cloudflare D1](https://developers.cloudflare.com/d1/) database.

## Stack

- **Astro 5** — all pages are prerendered to static HTML; only `/api/subscribe` runs server-side in the Worker
- **@astrojs/cloudflare** adapter (Workers + static assets)
- **D1** — SQLite database for collecting emails
- Zero client-side framework — a small vanilla script handles the signup forms

## Local development

```sh
npm install
npm run dev          # Astro dev server (D1 available via platform proxy)
```

To test the real Worker runtime locally:

```sh
npm run db:migrate:local   # create the signups table in the local D1
npm run build
npm run preview            # wrangler dev against ./dist
```

## Deploying to Cloudflare

1. **Create the D1 database** (one time):

   ```sh
   npm run db:create
   ```

   Copy the `database_id` from the output into `wrangler.jsonc`.

2. **Apply the migration** (creates the `signups` table):

   ```sh
   npm run db:migrate
   ```

3. **Deploy:** the repo is connected to [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/), which builds and deploys every push to `main` automatically. Manual deploys also work:

   ```sh
   npm run deploy
   ```

   > `public/.assetsignore` (containing `_worker.js`) is required — it stops wrangler from uploading the compiled server bundle inside `dist/` as a public static asset.

4. Set the production domain in `astro.config.mjs` (`site`) so canonical/OG URLs are correct, then redeploy.

5. **Web analytics** (optional, free, cookie-free): Cloudflare Dashboard → Analytics & Logs → Web Analytics → Add a site → copy the beacon token into `cfBeaconToken` in `src/config.ts` and redeploy. Nothing is injected while the token is empty.

6. **Confirmation email (double opt-in)**: uses [Cloudflare Email Sending](https://developers.cloudflare.com/email-service/) (beta) natively — no API keys. In the dashboard (Email Service → Email Sending), onboard the domain you want to send from (you already have `siteintelica.com` / `whisperstt.com` configured), then set `EMAIL_FROM` in `wrangler.jsonc`, e.g. `"Радослав <kurs@siteintelica.com>"`, and redeploy. New signups get a confirmation email; the confirm link marks them `confirmed=1` and lands on the bonus page. Unconfirmed re-signups re-send the email; confirmed or unsubscribed ones don't. While `EMAIL_FROM` is empty, signups still work — the email step is just skipped.

   Every email carries a tokenized unsubscribe link plus `List-Unsubscribe` / `List-Unsubscribe-Post` headers (RFC 8058 one-click, required by Gmail/Yahoo bulk-sender rules).

   In local dev the binding is simulated (emails are logged to the console, not delivered); set `"remote": true` on the `send_email` binding in `wrangler.jsonc` to send real emails from `wrangler dev`. Beta quota: 1,000 emails/day.

7. **Ad tracking (Facebook + Google Ads)**: set `fbPixelId`, `googleTagId`, and optionally `googleAdsConversionLabel` in `src/config.ts`. A consent banner appears automatically once either ID is set; pixels load **only after the visitor accepts** (hard GDPR gating), and the signup conversion (FB `Lead`, Google `generate_lead` + Ads conversion) fires on the `/blagodarya` thank-you page. The footer gets a "Настройки за бисквитки" button so visitors can change their choice.

8. **Bot protection (Turnstile)**: create a widget in Dashboard → Turnstile, put the site key in `turnstileSiteKey` (`src/config.ts`) and set the secret:

   ```sh
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

   The widget is invisible unless a challenge is needed; the API verifies tokens server-side. Both sides are skipped while unconfigured.

9. **CI/CD**: Cloudflare Workers Builds deploys `main`; `.github/workflows/deploy.yml` runs a build check on every PR so broken builds are caught before merge.

## Placeholders to replace before launch

- `src/pages/index.astro` — the `testimonials` array is **mock social proof**; replace with real quotes (with permission) before going live.
- `src/pages/bonus.astro` — placeholder prompts for the lead magnet «10 готови промпта за Lovable»; replace with your real prompts. The page is `noindex` and only reachable via the welcome email link.
- `src/config.ts` — analytics token, FB Pixel / Google tag IDs, Turnstile site key, next session date, lead magnet title.
- `wrangler.jsonc` — D1 `database_id`, `EMAIL_FROM` (address on an Email Sending onboarded domain).

## Reading collected emails

```sh
npx wrangler d1 execute vibe-coding-signups --remote \
  --command "SELECT email, source, utm_source, utm_campaign, referrer, created_at FROM signups ORDER BY created_at DESC"
```

Or export as CSV:

```sh
npx wrangler d1 execute vibe-coding-signups --remote --json \
  --command "SELECT email, source, created_at FROM signups" > signups.json
```

## Project structure

```
src/
  config.ts                 # launch-day knobs: tracking IDs, Turnstile, copy
  layouts/Base.astro        # <head>, meta, self-hosted fonts, global styles
  layouts/Legal.astro       # shared layout for legal/utility pages
  components/Header.astro
  components/Footer.astro
  components/SignupForm.astro   # both signup forms + client logic + Turnstile
  components/ConsentBanner.astro # cookie consent + gated pixel loading
  components/StickyCta.astro
  components/LogoMark.astro
  pages/index.astro         # the landing page
  pages/blagodarya.astro    # thank-you page (fires ad conversions)
  pages/bonus.astro         # lead magnet (linked from the email)
  pages/404.astro
  pages/usloviya.astro      # Общи условия
  pages/poveritelnost.astro # Политика за поверителност
  pages/biskvitki.astro     # Политика за бисквитки
  pages/robots.txt.ts
  pages/api/subscribe.ts    # POST → D1 + confirmation email
  pages/api/confirm.ts      # double opt-in link target
  pages/api/unsubscribe.ts  # tokenized + RFC 8058 one-click
migrations/
  0001_create_signups.sql
  0002_add_attribution.sql
  0003_add_confirmation.sql
scripts/
  generate-og.mjs           # regenerates public/og.jpg
```

## Signup flow

1. Visitor submits an email (client-validated, honeypot + optional Turnstile) → row lands in D1 with UTM/referrer attribution and `confirmed=0` → browser redirects to `/blagodarya`, where ad conversion events fire (if consented).
2. The confirmation email arrives (Cloudflare Email Sending) with a tokenized confirm button and one-click unsubscribe.
3. Clicking confirm sets `confirmed=1` and lands on `/bonus` — the promised lead magnet.

Count only `confirmed=1` rows as your real list. Duplicates re-signing up: unconfirmed → confirmation re-sent; confirmed/unsubscribed → nothing sent, visitor still sees success.
