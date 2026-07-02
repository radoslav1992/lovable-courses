import type { APIRoute } from 'astro';

export const prerender = false;

async function unsubscribe(db: D1Database, token: string): Promise<boolean> {
  if (!token) return false;
  const result = await db
    .prepare(
      "UPDATE signups SET unsubscribed_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE token = ?1 AND unsubscribed_at IS NULL"
    )
    .bind(token)
    .run();
  if ((result.meta.changes ?? 0) > 0) return true;
  // Already unsubscribed counts as success (idempotent).
  const existing = await db
    .prepare('SELECT unsubscribed_at FROM signups WHERE token = ?1')
    .bind(token)
    .first<{ unsubscribed_at: string | null }>();
  return Boolean(existing?.unsubscribed_at);
}

const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="bg"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
     <title>${title}</title>
     <body style="font-family:system-ui,sans-serif;background:#FCFBF8;color:#17150F;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
       <div><h1>${title}</h1><p>${text}</p>
       <p><a href="/" style="color:#4B73FF;font-weight:600">← Обратно към сайта</a></p></div>
     </body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );

/** Unsubscribe link from the email footer. */
export const GET: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime?.env?.DB;
  const token = url.searchParams.get('t') ?? '';
  try {
    if (db && (await unsubscribe(db, token))) {
      return page('Отписан си', 'Няма да получаваш повече имейли от нас. Съжаляваме, че си тръгваш!');
    }
  } catch (err) {
    console.error('Unsubscribe failed:', err);
  }
  return page('Невалиден линк', 'Линкът за отписване е невалиден. Пиши ни и ще те отпишем ръчно.', 404);
};

/** RFC 8058 one-click unsubscribe (List-Unsubscribe-Post), sent by mail providers. */
export const POST: APIRoute = async ({ url, locals }) => {
  const db = locals.runtime?.env?.DB;
  const token = url.searchParams.get('t') ?? '';
  try {
    if (db && (await unsubscribe(db, token))) {
      return new Response(null, { status: 200 });
    }
  } catch (err) {
    console.error('One-click unsubscribe failed:', err);
  }
  return new Response(null, { status: 404 });
};
