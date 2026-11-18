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

type MediaEnv = Pick<Env, 'IMAGE_TRANSFORMS'>;

function transformable(env: MediaEnv, url: string): boolean {
  return env.IMAGE_TRANSFORMS === 'on' && url.startsWith('https://');
}

/** URL lewat Cloudflare Image Transformations, fallback ke URL asli bila belum aktif. */
export function imageUrl(env: MediaEnv, m: Pick<Media, 'url'>, width: number): string {
  if (!transformable(env, m.url)) return m.url;
  return `/cdn-cgi/image/width=${width},quality=80,format=auto/${m.url}`;
}

export function imageSrcset(env: MediaEnv, m: Pick<Media, 'url' | 'width'>): string | undefined {
  if (!transformable(env, m.url)) return undefined;
  const widths = SRCSET_WIDTHS.filter((w) => !m.width || w <= m.width);
  const list = widths.length ? widths : [SRCSET_WIDTHS[0]];
  return list.map((w) => `${imageUrl(env, m, w)} ${w}w`).join(', ');
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

export function mediaPathname(folder: (typeof MEDIA_FOLDERS)[number], type: MediaType, id: string): string {
  const year = new Date().getUTCFullYear();
  return `${folder}/${year}/${id}.${MEDIA_TYPES[type]}`;
}
