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
 * Double opt-in confirmation email, sent through the Cloudflare Email
 * Sending binding (wrangler.jsonc → send_email). EMAIL_FROM must be an
 * address on a domain onboarded in Email Sending; while it's empty the
 * email is skipped silently — signups still work.
 */
async function sendConfirmationEmail(
  env: Env,
  to: string,
  token: string,
  origin: string
): Promise<void> {
  if (!env.EMAIL || !env.EMAIL_FROM) return;

  const confirmUrl = `${origin}/api/confirm?t=${token}`;
  const unsubscribeUrl = `${origin}/api/unsubscribe?t=${token}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#17150F">
      <h1 style="font-size:22px">Още една стъпка! 🎉</h1>
      <p>Записа се за безплатния уебинар „Vibe Coding с Lovable“. Потвърди имейла си, за да запазим мястото ти — и веднага получаваш бонуса.</p>
      <p style="margin:24px 0">
        <a href="${confirmUrl}" style="background:#FF4E8E;color:#fff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px;display:inline-block">
          Потвърди и вземи бонуса 🎁
        </a>
      </p>
      <p style="font-size:14px;color:#555">Бонус: <strong>${siteConfig.leadMagnetTitle}</strong>. Щом датата на уебинара бъде обявена, ще получиш час и линк за включване на този имейл.</p>
      <p>Ако имаш въпрос — просто отговори на този имейл.</p>
      <p>До скоро,<br>Радослав</p>
      <hr style="border:none;border-top:1px solid #eee;margin:28px 0">
      <p style="font-size:12px;color:#888">
        Получаваш този имейл, защото се записа на сайта на курса. Курсът е независим и не е свързан с Lovable.
        Ако не си бил ти или не искаш съобщения: <a href="${unsubscribeUrl}" style="color:#888">отпиши се с един клик</a>.
      </p>
    </div>`;

  const result = await env.EMAIL.send({
    from: parseSender(env.EMAIL_FROM),
    to,
    subject: 'Потвърди имейла си и вземи бонуса 🎁',
    html,
    text: `Потвърди записването си за уебинара "Vibe Coding с Lovable" и вземи бонуса: ${confirmUrl}\n\nЗа отписване: ${unsubscribeUrl}`,
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  console.log('Confirmation email sent:', result.messageId);
}

/** Server-side Turnstile check; passes when no secret is configured, fails closed on errors. */
async function verifyTurnstile(env: Env, token: string | undefined, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  try {
    const body = new FormData();
    body.append('secret', env.TURNSTILE_SECRET_KEY);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const out = (await res.json()) as { success?: boolean };
    return Boolean(out.success);
  } catch (err) {
    console.error('Turnstile verification failed:', err);
    return false;
  }
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
    turnstileToken?: string;
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

  const env = locals.runtime?.env;
  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (!(await verifyTurnstile(env, payload.turnstileToken, ip))) {
    return json(
      { ok: false, error: 'Проверката за сигурност не мина. Презареди страницата и опитай пак.' },
      400
    );
  }

  const source = ['hero', 'final-cta'].includes(payload.source ?? '')
    ? payload.source
    : null;

  const db = env?.DB;
  if (!db) {
    console.error('D1 binding "DB" is missing — create the database and set database_id in wrangler.jsonc');
    return json({ ok: false, error: 'Записването е временно недостъпно. Опитай по-късно.' }, 503);
  }

  try {
    const token = crypto.randomUUID();
    const result = await db
      .prepare(
        // Re-signing up with the same email keeps the first record.
        `INSERT INTO signups (email, course, source, utm_source, utm_medium, utm_campaign, referrer, token)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8) ON CONFLICT(email) DO NOTHING`
      )
      .bind(
        email,
        'vibe-coding-lovable',
        source,
        attr(payload.utm_source),
        attr(payload.utm_medium),
        attr(payload.utm_campaign),
        attr(payload.referrer),
        token
      )
      .run();

    // New signup → confirmation email. Existing but unconfirmed signup →
    // resend it (the visitor probably lost the first one); confirmed or
    // unsubscribed → nothing. Sent via waitUntil so the response isn't delayed.
    const isNew = (result.meta.changes ?? 0) > 0;
    let sendToken: string | null = isNew ? token : null;
    if (!isNew) {
      const existing = await db
        .prepare(
          'SELECT token, confirmed, unsubscribed_at FROM signups WHERE email = ?1'
        )
        .bind(email)
        .first<{ token: string | null; confirmed: number; unsubscribed_at: string | null }>();
      if (existing?.token && !existing.confirmed && !existing.unsubscribed_at) {
        sendToken = existing.token;
      }
    }

    if (sendToken) {
      const origin = new URL(request.url).origin;
      locals.runtime.ctx.waitUntil(
        sendConfirmationEmail(env, email, sendToken, origin).catch((err) =>
          console.error('Confirmation email failed:', err)
        )
      );
    }

    return json({ ok: true });
  } catch (err) {
    console.error('D1 insert failed:', err);
    return json({ ok: false, error: 'Нещо се обърка при записа. Опитай отново след малко.' }, 500);
  }
};
