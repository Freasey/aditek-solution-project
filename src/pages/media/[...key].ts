import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { readLocalFile } from '../../lib/storage';
import { isProductionSite } from '../../lib/util';

/** Menyajikan foto dari penyimpanan lokal development. Di production foto ada di Vercel Blob. */
export const GET: APIRoute = async ({ params }) => {
  const key = params.key;
  if (!key || key.includes('..') || isProductionSite(env.SITE_URL)) return new Response('Not found', { status: 404 });
  const file = await readLocalFile(env, key);
  if (!file) return new Response('Not found', { status: 404 });
  return new Response(file.data, {
    headers: { 'content-type': file.contentType, 'cache-control': 'public, max-age=31536000, immutable' },
  });
};
