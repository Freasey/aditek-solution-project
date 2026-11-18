import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../../../db/client';
import { media } from '../../../../db/schema';
import { actor, back, jsonResponse, readForm, wantsJson } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { MEDIA_FOLDERS, MEDIA_MAX_BYTES, MEDIA_TYPES, mediaPathname, sniffImageType } from '../../../../lib/media';
import { deleteFile, putFile, type StoredFile } from '../../../../lib/storage';
import { newId, nowIso } from '../../../../lib/util';

const dim = (v: FormDataEntryValue | null): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n <= 20000 ? n : null;
};

export const POST: APIRoute = async (ctx) => {
  const json = wantsJson(ctx.request);
  const fail = (status: number, error: string) =>
    json ? jsonResponse(status, { ok: false, error }) : back('/admin/media', { error });

  const form = await readForm(ctx);
  const file = form?.get('file');
  if (!form || !(file instanceof File)) return fail(400, 'Pilih file gambar.');
  if (file.size === 0) return fail(400, 'File kosong.');
  if (file.size > MEDIA_MAX_BYTES) return fail(413, 'Ukuran maksimal 10 MB.');

  const folderRaw = String(form.get('folder') ?? 'site');
  const folder = (MEDIA_FOLDERS as readonly string[]).includes(folderRaw)
    ? (folderRaw as (typeof MEDIA_FOLDERS)[number])
    : 'site';

  const buf = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(buf.subarray(0, 32));
  if (!type || !(type in MEDIA_TYPES)) return fail(415, 'Hanya JPEG, PNG, WebP, atau AVIF.');

  const id = newId();
  const pathname = mediaPathname(folder, type, id);
  const alt = String(form.get('alt') ?? '').trim().slice(0, 200);
  const email = actor(ctx.locals);

  let stored: StoredFile;
  try {
    stored = await putFile(env, pathname, buf, type);
  } catch (err) {
    console.warn('media upload failed', err instanceof Error ? err.message : err);
    return fail(502, 'Gagal menyimpan file. Periksa BLOB_READ_WRITE_TOKEN.');
  }
  const db = getDb(env);
  try {
    await db.insert(media).values({
      id,
      pathname: stored.pathname,
      url: stored.url,
      contentType: type,
      bytes: buf.byteLength,
      width: dim(form.get('width')),
      height: dim(form.get('height')),
      alt,
      createdAt: nowIso(),
      createdBy: email,
    });
  } catch (err) {
    await deleteFile(env, stored).catch(() => {}); // jangan tinggalkan file tanpa baris di D1
    throw err;
  }
  await audit(db, email, 'media.upload', stored.pathname);

  if (json) return jsonResponse(200, { ok: true, id, pathname: stored.pathname, alt, url: stored.url });
  return back('/admin/media', { ok: 'Foto diunggah.' });
};
