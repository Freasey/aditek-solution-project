import type { Media } from '../db/schema';

export const MEDIA_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const;
export type MediaType = keyof typeof MEDIA_TYPES;
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
export const MEDIA_FOLDERS = ['projects', 'systems', 'site'] as const;
export const SRCSET_WIDTHS = [480, 800, 1200, 1600] as const;

type MediaEnv = Pick<Env, 'MEDIA_BASE_URL' | 'IMAGE_TRANSFORMS'>;

/** URL asli object R2, lewat custom domain media.worksell.id (atau /media di lokal). */
export function mediaUrl(env: MediaEnv, key: string): string {
  const base = env.MEDIA_BASE_URL.replace(/\/+$/, '');
  return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export function transformsEnabled(env: MediaEnv): boolean {
  return env.IMAGE_TRANSFORMS === 'on' && /^https:\/\//.test(env.MEDIA_BASE_URL);
}

/** URL lewat Cloudflare Image Transformations, fallback ke URL asli bila belum aktif. */
export function imageUrl(env: MediaEnv, key: string, width: number): string {
  const src = mediaUrl(env, key);
  if (!transformsEnabled(env)) return src;
  return `/cdn-cgi/image/width=${width},quality=80,format=auto/${src}`;
}

export function imageSrcset(env: MediaEnv, m: Pick<Media, 'r2Key' | 'width'>): string | undefined {
  if (!transformsEnabled(env)) return undefined;
  const widths = SRCSET_WIDTHS.filter((w) => !m.width || w <= m.width);
  const list = widths.length ? widths : [SRCSET_WIDTHS[0]];
  return list.map((w) => `${imageUrl(env, m.r2Key, w)} ${w}w`).join(', ');
}

/** Deteksi tipe gambar dari magic bytes. */
export function sniffImageType(bytes: Uint8Array): MediaType | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  )
    return 'image/png';
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (b.length >= 12 && ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return null;
}

export function mediaKey(folder: (typeof MEDIA_FOLDERS)[number], type: MediaType, id: string): string {
  const year = new Date().getUTCFullYear();
  return `${folder}/${year}/${id}.${MEDIA_TYPES[type]}`;
}
