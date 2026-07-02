import type { APIRoute } from 'astro';
import { siteConfig } from '../../config';

export const prerender = false;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Parse `Name <addr@domain>` (or a bare address) into an EmailAddress. */
function parseSender(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<\s*(.+?)\s*>\s*$/);
  return m ? { name: m[1], email: m[2] } : { name: '', email: from.trim() };
}

/**
 * Welcome email with the lead magnet, sent through the Cloudflare Email
 * Sending binding (wrangler.jsonc → send_email). EMAIL_FROM must be an
 * address on a domain onboarded in Email Sending; while it's empty the
 * email is skipped silently — signups still work.
 */
async function sendWelcomeEmail(env: Env, to: string, origin: string): Promise<void> {
  if (!env.EMAIL || !env.EMAIL_FROM) return;

  const bonusUrl = `${origin}${siteConfig.leadMagnetPath}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#17150F">
      <h1 style="font-size:22px">Добре дошъл във Vibe Coding с Lovable! 🎉</h1>
      <p>Записан си за безплатния уебинар. Щом датата бъде обявена, ще получиш час и линк за включване на този имейл.</p>
      <p><strong>А ето и обещания бонус:</strong></p>
      <p style="margin:24px 0">
        <a href="${bonusUrl}" style="background:#FF4E8E;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px;display:inline-block">
          🎁 ${siteConfig.leadMagnetTitle}
        </a>
      </p>
      <p>Ако имаш въпрос — просто отговори на този имейл.</p>
      <p>До скоро,<br>Радослав</p>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
      <p style="font-size:12px;color:#888">Получаваш този имейл, защото се записа на сайта на курса. Курсът е независим и не е свързан с Lovable. Ако не искаш повече съобщения, отговори с „отпиши ме“.</p>
    </div>`;

  const result = await env.EMAIL.send({
    from: parseSender(env.EMAIL_FROM),
    to,
    subject: `Записан си! 🎁 Бонус: ${siteConfig.leadMagnetTitle}`,
    html,
    text: `Записан си за безплатния уебинар "Vibe Coding с Lovable". Бонусът те чака тук: ${bonusUrl}`,
  });
  console.log('Welcome email sent:', result.messageId);
}

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
    const result = await db
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

    // Send the welcome email only for brand-new signups, after the response
    // is returned (waitUntil keeps the Worker alive without delaying the user).
    const isNew = (result.meta.changes ?? 0) > 0;
    if (isNew) {
      const origin = new URL(request.url).origin;
      locals.runtime.ctx.waitUntil(
        sendWelcomeEmail(locals.runtime.env, email, origin).catch((err) =>
          console.error('Welcome email failed:', err)
        )
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error('D1 insert failed:', err);
    return json({ ok: false, error: 'Нещо се обърка при записа. Опитай отново след малко.' }, 500);
  }
};
