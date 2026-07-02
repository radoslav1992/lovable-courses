/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Cloudflare Email Sending binding (see wrangler.jsonc). */
  EMAIL: SendEmail;
  /**
   * Sender for the welcome email, e.g. "Радослав <kurs@yourdomain.com>".
   * Must be on a domain onboarded in Email Sending. Empty = email skipped.
   */
  EMAIL_FROM?: string;
  /**
   * Turnstile secret key (wrangler secret) — bot verification is skipped
   * when absent. Pair with turnstileSiteKey in src/config.ts.
   */
  TURNSTILE_SECRET_KEY?: string;
}

declare namespace App {
  interface Locals extends Runtime {}
}
