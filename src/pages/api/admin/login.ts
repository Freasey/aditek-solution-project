import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import { readForm } from '../../../lib/admin';
import { audit } from '../../../lib/audit';
import { loginLock, recordLogin } from '../../../lib/login-guard';
import { checkLogin, createSession, sessionCookie } from '../../../lib/session';
import { turnstileEnabled, verifyTurnstile } from '../../../lib/turnstile';
import { isProductionSite } from '../../../lib/util';

const FAIL_DELAY_MS = 1000;

const toLogin = (next: string, error: string) =>
  new Response(null, {
    status: 303,
    headers: { Location: `/admin/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error)}` },
  });

export const POST: APIRoute = async (ctx) => {
  const form = await readForm(ctx);
  const rawNext = String(form?.get('next') ?? '/admin');
  const next = rawNext.startsWith('/admin') && !rawNext.startsWith('/admin/login') ? rawNext : '/admin';
  const ip = ctx.request.headers.get('cf-connecting-ip') ?? 'unknown';
  const db = getDb(env);

  // 1. Rate limit cepat (5 per menit per IP)
  const { success: allowed } = await env.LOGIN_LIMITER.limit({ key: ip });
  if (!allowed) return toLogin(next, 'Terlalu banyak percobaan. Tunggu satu menit.');

  // 2. Kunci per IP dan per akun dari catatan login gagal
  const lock = await loginLock(db, ip).catch((err) => {
    console.warn('login guard unavailable', err instanceof Error ? err.message : err);
    return { locked: false, minutes: 0 };
  });
  if (lock.locked) return toLogin(next, `Terlalu banyak percobaan gagal. Coba lagi dalam ${lock.minutes} menit.`);

  // 3. Turnstile, bila sudah dikonfigurasi
  if (turnstileEnabled()) {
    const human = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, String(form?.get('cf-turnstile-response') ?? ''), ip, {
      production: isProductionSite(env.SITE_URL),
    });
    if (!human) return toLogin(next, 'Verifikasi anti-bot gagal. Coba lagi.');
  }

  // 4. Cek email dan password
  const email = String(form?.get('email') ?? '');
  const password = String(form?.get('password') ?? '');
  const ok = await checkLogin(env, email, password);
  await recordLogin(db, ip, ok).catch((err) => console.warn('login record failed', err instanceof Error ? err.message : err));

  if (!ok) {
    await new Promise((r) => setTimeout(r, FAIL_DELAY_MS)); // memperlambat tebakan beruntun
    return toLogin(next, 'Email atau password salah.');
  }

  const token = await createSession(env);
  await audit(db, email.trim().toLowerCase(), 'admin.login', null);
  return new Response(null, { status: 303, headers: { Location: next, 'Set-Cookie': sessionCookie(env, token) } });
};
