import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';

/**
 * Menyajikan object R2 lewat Worker. Di production foto disajikan dari media.worksell.id
 * (custom domain bucket); route ini dipakai di lokal dan sebagai cadangan.
 */
export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key;
  if (!key || key.includes('..')) return new Response('Not found', { status: 404 });

  const obj = await env.MEDIA.get(key, { onlyIf: request.headers });
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('etag', obj.httpEtag);
  if (!headers.has('cache-control')) headers.set('cache-control', 'public, max-age=31536000, immutable');
  if (!('body' in obj)) return new Response(null, { status: 304, headers });
  return new Response(obj.body, { headers });
};
