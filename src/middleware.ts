import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { jsFlagHash } from './lib/inline';
import { SESSION_COOKIE, readCookie, verifySession } from './lib/session';
import { BLOB_PUBLIC_HOST_SUFFIX } from './lib/storage';
import { siteOrigin } from './lib/util';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/api/admin/login']);

function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/');
}

async function contentSecurityPolicy(): Promise<string> {
  const img = ["'self'", 'data:', 'blob:', `https://*${BLOB_PUBLIC_HOST_SUFFIX}`].join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' ${await jsFlagHash()} https://challenges.cloudflare.com https://static.cloudflareinsights.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${img}`,
    "font-src 'self'",
    "connect-src 'self' https://cloudflareinsights.com",
    'frame-src https://challenges.cloudflare.com',
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

function forbidden(message: string): Response {
  return new Response(message, { status: 403, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, url, locals } = context;
  const admin = isAdminPath(url.pathname);

  if (admin) {
    if (!PUBLIC_ADMIN_PATHS.has(url.pathname)) {
      const email = await verifySession(env, readCookie(request.headers.get('cookie'), SESSION_COOKIE));
      if (!email) {
        if (request.method === 'GET' && !url.pathname.startsWith('/api/')) {
          const next = encodeURIComponent(url.pathname + url.search);
          return new Response(null, { status: 303, headers: { Location: `/admin/login?next=${next}` } });
        }
        return new Response('Silakan login.', { status: 401, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      }
      locals.user = { email };
    }

    if (MUTATING.has(request.method)) {
      const origin = request.headers.get('origin');
      if (!origin || origin !== siteOrigin(env.SITE_URL)) return forbidden('Origin tidak diizinkan.');
    }
  }

  const res = await next();
  // Salin header supaya bisa diubah (header Response.redirect bersifat immutable).
  const headers = new Headers(res.headers);
  const type = headers.get('content-type') ?? '';

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  if (type.includes('text/html')) headers.set('Content-Security-Policy', await contentSecurityPolicy());

  if (admin || url.pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store');
    if (admin) headers.set('X-Robots-Tag', 'noindex, nofollow');
  } else if (type.includes('text/html') && !headers.has('Cache-Control')) {
    headers.set('Cache-Control', 'public, max-age=0, s-maxage=60');
  }
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
