import type { APIRoute } from 'astro';

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Trim attribution values to something sane; empty → null. */
const attr = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null;

export const POST: APIRoute = async ({ request, locals }) => {
  let payload: {
    email?: string;
    source?: string;
    website?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    referrer?: string;
  };
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Невалидна заявка.' }, 400);
  }

  // Honeypot field filled in → almost certainly a bot. Pretend success.
  if (payload.website) {
    return json({ ok: true });
  }

  const email = (payload.email ?? '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return json({ ok: false, error: 'Моля, въведи валиден имейл адрес.' }, 400);
  }

  const source = ['hero', 'final-cta'].includes(payload.source ?? '')
    ? payload.source
    : null;

  const db = locals.runtime?.env?.DB;
  if (!db) {
    console.error('D1 binding "DB" is missing — create the database and set database_id in wrangler.jsonc');
    return json({ ok: false, error: 'Записването е временно недостъпно. Опитай по-късно.' }, 503);
  }

  try {
    await db
      .prepare(
        // Re-signing up with the same email is fine — keep the first record.
        `INSERT INTO signups (email, course, source, utm_source, utm_medium, utm_campaign, referrer)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ON CONFLICT(email) DO NOTHING`
      )
      .bind(
        email,
        'vibe-coding-lovable',
        source,
        attr(payload.utm_source),
        attr(payload.utm_medium),
        attr(payload.utm_campaign),
        attr(payload.referrer)
      )
      .run();
    return json({ ok: true });
  } catch (err) {
    console.error('D1 insert failed:', err);
    return json({ ok: false, error: 'Нещо се обърка при записа. Опитай отново след малко.' }, 500);
  }
};
