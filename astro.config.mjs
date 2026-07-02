// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// Static pages are prerendered at build time; only src/pages/api/* opts in
// to SSR (prerender = false) and runs inside the Cloudflare Worker.
export default defineConfig({
  site: 'https://vibecoding.example.com', // TODO: set the real production domain
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'compile',
  }),
  integrations: [
    sitemap({
      // Keep the reward and post-signup pages out of search results.
      filter: (page) => !page.includes('/bonus') && !page.includes('/blagodarya'),
    }),
  ],
  security: {
    // The default origin check rejects form-encoded POSTs without a matching
    // Origin header — which is exactly what RFC 8058 one-click unsubscribe
    // requests from mail providers look like. Our endpoints are protected
    // differently: /api/subscribe takes JSON (not covered by this check
    // anyway) and /api/unsubscribe requires the per-recipient token.
    checkOrigin: false,
  },
});
