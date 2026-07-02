import type { APIRoute } from 'astro';

// Prerendered at build time like every other page.
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
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
