import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { readForm } from '../../../lib/admin';
import { audit } from '../../../lib/audit';
import { getDb } from '../../../db/client';
import { checkLogin, createSession, sessionCookie } from '../../../lib/session';

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
  const { success } = await env.LOGIN_LIMITER.limit({ key: ip });
  if (!success) return toLogin(next, 'Terlalu banyak percobaan. Tunggu satu menit.');

  const email = String(form?.get('email') ?? '');
  const password = String(form?.get('password') ?? '');
  if (!(await checkLogin(env, email, password))) return toLogin(next, 'Email atau password salah.');

  const token = await createSession(env);
  await audit(getDb(env), email.trim().toLowerCase(), 'admin.login', null);
  return new Response(null, { status: 303, headers: { Location: next, 'Set-Cookie': sessionCookie(env, token) } });
};
