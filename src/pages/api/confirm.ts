import type { APIRoute } from 'astro';
import { siteConfig } from '../../config';

export const prerender = false;

/**
 * Double opt-in confirmation link target. Marks the signup as confirmed
 * and forwards straight to the bonus page (the promised reward).
 */
export const GET: APIRoute = async ({ url, locals, redirect }) => {
  const token = url.searchParams.get('t') ?? '';
  const db = locals.runtime?.env?.DB;

  if (token && db) {
    try {
      const result = await db
        .prepare(
          'UPDATE signups SET confirmed = 1 WHERE token = ?1 AND unsubscribed_at IS NULL'
        )
        .bind(token)
        .run();
      if ((result.meta.changes ?? 0) > 0) {
        return redirect(`${siteConfig.leadMagnetPath}?potvurdeno=1`, 302);
      }
      // Idempotent: an already-confirmed token still leads to the bonus.
      const existing = await db
        .prepare('SELECT confirmed FROM signups WHERE token = ?1')
        .bind(token)
        .first<{ confirmed: number }>();
      if (existing?.confirmed) {
        return redirect(siteConfig.leadMagnetPath, 302);
      }
    } catch (err) {
      console.error('Confirm failed:', err);
    }
  }

  return new Response(
    `<!doctype html><html lang="bg"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
     <title>Невалиден линк</title>
     <body style="font-family:system-ui,sans-serif;background:#FCFBF8;color:#17150F;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
       <div><h1>Линкът е невалиден или изтекъл</h1>
       <p>Запиши се отново от сайта и ще получиш нов имейл за потвърждение.</p>
       <p><a href="/" style="color:#4B73FF;font-weight:600">← Обратно към сайта</a></p></div>
     </body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
};
