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

3. **Deploy:**

   ```sh
   npm run deploy
   ```

4. Set the production domain in `astro.config.mjs` (`site`) so canonical/OG URLs are correct, then redeploy.

5. **Web analytics** (optional, free, cookie-free): Cloudflare Dashboard → Analytics & Logs → Web Analytics → Add a site → copy the beacon token into `cfBeaconToken` in `src/config.ts` and redeploy. Nothing is injected while the token is empty.

6. **Welcome email with the lead magnet** (optional): sign up at [resend.com](https://resend.com) (free tier: 3,000 emails/month), verify your domain, then:

   ```sh
   npx wrangler secret put RESEND_API_KEY
   ```

   and set `EMAIL_FROM` in `wrangler.jsonc` (e.g. `"Радослав <kurs@yourdomain.com>"`). New signups then automatically receive the bonus email; duplicates don't re-trigger it. While unset, signups still work — the email step is just skipped.

   > Note: Cloudflare's own email sending (Email Workers) can only deliver to verified addresses in your account, so it can't email arbitrary subscribers — that's why an email API is used here.

## Placeholders to replace before launch

- `src/pages/index.astro` — the `testimonials` array is **mock social proof**; replace with real quotes (with permission) before going live.
- `src/pages/bonus.astro` — placeholder prompts for the lead magnet «10 готови промпта за Lovable»; replace with your real prompts. The page is `noindex` and only reachable via the welcome email link.
- `src/config.ts` — analytics token, next session date, lead magnet title.
- `wrangler.jsonc` — D1 `database_id`, `EMAIL_FROM`.

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
  layouts/Base.astro        # <head>, global styles, design tokens
  layouts/Legal.astro       # shared layout for legal pages
  components/Header.astro
  components/Footer.astro
  components/SignupForm.astro  # both signup forms + client logic
  components/LogoMark.astro
  pages/index.astro         # the landing page
  pages/usloviya.astro      # Общи условия
  pages/poveritelnost.astro # Политика за поверителност
  pages/biskvitki.astro     # Политика за бисквитки
  pages/api/subscribe.ts    # POST endpoint → D1
migrations/
  0001_create_signups.sql
```

## Signup flow notes

- Client validates the email, shows a loading state, and reports real errors (no silently lost signups).
- The API lower-cases emails and ignores duplicates (`ON CONFLICT DO NOTHING`), so re-subscribing always looks successful to the visitor.
- A hidden honeypot field silently drops most bots.
- Successful signup is remembered in `localStorage`, so returning visitors see the "you're in" state instead of the form.
- UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) and the external referrer are captured on landing and stored with each signup, so you can see which channel converts (`source` column additionally tells you which form on the page: hero, final CTA — the sticky mobile bar scrolls to the hero form).
