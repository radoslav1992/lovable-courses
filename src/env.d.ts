/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Resend API key (wrangler secret) — welcome email is skipped when absent. */
  RESEND_API_KEY?: string;
  /** Sender for the welcome email, e.g. "Радослав <kurs@yourdomain.com>". */
  EMAIL_FROM?: string;
}

declare namespace App {
  interface Locals extends Runtime {}
}
