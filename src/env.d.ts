/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

declare namespace App {
  interface Locals extends Runtime {}
}
