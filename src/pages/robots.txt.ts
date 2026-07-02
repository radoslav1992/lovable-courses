import type { APIRoute } from 'astro';

// Prerendered at build time like every other page.
// The single wildcard group deliberately covers AI crawlers too (GPTBot,
// ClaudeBot, PerplexityBot, Google-Extended, ...) — being crawlable by
// answer engines is part of the marketing strategy. Only the reward and
// post-signup pages are excluded.
export const GET: APIRoute = ({ site }) => {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    'Disallow: /bonus',
    'Disallow: /blagodarya',
    '',
    `Sitemap: ${new URL('sitemap-index.xml', site)}`,
    '',
    `# LLM-friendly site summary: ${new URL('llms.txt', site)}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
