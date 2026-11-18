import { env } from 'cloudflare:workers';
import { defineMiddleware } from 'astro:middleware';
import { verifyAccess } from './lib/access';
import { jsFlagHash } from './lib/inline';
import { isProductionSite, siteOrigin } from './lib/util';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isAdminPath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/') || path.startsWith('/api/admin/');
}

function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

async function contentSecurityPolicy(): Promise<string> {
  const media = originOf(env.MEDIA_BASE_URL);
  const img = ["'self'", 'data:', 'blob:', media].filter(Boolean).join(' ');
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
    const bypass = env.ADMIN_DEV_BYPASS === 'true' && !isProductionSite(env.SITE_URL);
    const email = bypass ? 'dev@localhost' : await verifyAccess(request, env);
    if (!email) return forbidden('Akses ditolak.');
    locals.user = { email };

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
