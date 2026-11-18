import { isProductionSite } from './util';

/**
 * Penyimpanan foto di Vercel Blob lewat HTTP API (protokol yang sama dengan @vercel/blob 2.x;
 * SDK-nya tidak dipakai karena bergantung pada undici yang khusus Node).
 *
 * Tanpa BLOB_READ_WRITE_TOKEN di luar production, file disimpan di tabel D1 lokal `dev_blobs`
 * (seed/dev-storage.sql) dan disajikan lewat /media/<pathname>.
 */
type StorageEnv = Pick<Env, 'DB' | 'SITE_URL'> & { BLOB_READ_WRITE_TOKEN?: string };

const BLOB_API = 'https://vercel.com/api/blob';
const BLOB_API_VERSION = '13';
export const BLOB_PUBLIC_HOST_SUFFIX = '.public.blob.vercel-storage.com';

export interface StoredFile {
  url: string;
  pathname: string;
}

function token(env: StorageEnv): string | null {
  const t = env.BLOB_READ_WRITE_TOKEN?.trim();
  return t ? t : null;
}

function storeId(t: string): string {
  return t.split('_')[3] ?? '';
}

function useLocal(env: StorageEnv): boolean {
  if (token(env)) return false;
  if (isProductionSite(env.SITE_URL)) throw new Error('BLOB_READ_WRITE_TOKEN belum diisi.');
  return true;
}

async function blobRequest(t: string, path: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${BLOB_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${t}`,
      'x-api-version': BLOB_API_VERSION,
      'x-vercel-blob-store-id': storeId(t),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`Vercel Blob ${res.status}: ${body?.error?.message ?? res.statusText}`);
  }
  return res;
}

export async function putFile(
  env: StorageEnv,
  pathname: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<StoredFile> {
  if (useLocal(env)) {
    await env.DB.prepare('INSERT INTO dev_blobs (pathname, content_type, data) VALUES (?, ?, ?)')
      .bind(pathname, contentType, bytes)
      .run();
    return { pathname, url: `/media/${pathname}` };
  }
  const t = token(env)!;
  const res = await blobRequest(t, `/?${new URLSearchParams({ pathname })}`, {
    method: 'PUT',
    body: bytes as Uint8Array<ArrayBuffer>,
    headers: {
      'x-vercel-blob-access': 'public',
      'x-content-type': contentType,
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '0',
      'x-cache-control-max-age': '31536000',
      'x-content-length': String(bytes.byteLength),
    },
  });
  const data = (await res.json()) as { url?: string; pathname?: string };
  if (!data.url) throw new Error('Vercel Blob tidak mengembalikan URL.');
  return { url: data.url, pathname: data.pathname ?? pathname };
}

export async function deleteFile(env: StorageEnv, file: StoredFile): Promise<void> {
  if (file.url.startsWith('/media/')) {
    if (!isProductionSite(env.SITE_URL)) {
      await env.DB.prepare('DELETE FROM dev_blobs WHERE pathname = ?').bind(file.pathname).run();
    }
    return;
  }
  const t = token(env);
  if (!t) throw new Error('BLOB_READ_WRITE_TOKEN belum diisi.');
  await blobRequest(t, '/delete', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ urls: [file.url] }),
  });
}

/** Baca file dari penyimpanan lokal development. */
export async function readLocalFile(
  env: Pick<Env, 'DB'>,
  pathname: string,
): Promise<{ contentType: string; data: ArrayBuffer } | null> {
  const row = await env.DB.prepare('SELECT content_type, data FROM dev_blobs WHERE pathname = ?')
    .bind(pathname)
    .first<{ content_type: string; data: ArrayBuffer | number[] }>()
    .catch(() => null);
  if (!row) return null;
  const data = row.data instanceof ArrayBuffer ? row.data : new Uint8Array(row.data).buffer;
  return { contentType: row.content_type, data };
}
