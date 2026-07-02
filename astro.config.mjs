// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Static pages are prerendered at build time; only src/pages/api/* opts in
// to SSR (prerender = false) and runs inside the Cloudflare Worker.
export default defineConfig({
  site: 'https://vibecoding.example.com', // TODO: set the real production domain
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'compile',
  }),
});
