/** Upload foto ke /api/admin/media. Ukuran asli dibaca di browser lalu dikirim bersama file. */
export interface Uploaded {
  id: string;
  pathname: string;
  alt: string;
  url: string;
}

const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX = 10 * 1024 * 1024;

function dimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function uploadImage(file: File, folder: string, alt = ''): Promise<Uploaded> {
  if (!TYPES.includes(file.type)) throw new Error('Hanya JPEG, PNG, WebP, atau AVIF.');
  if (file.size > MAX) throw new Error('Ukuran maksimal 10 MB.');
  const size = await dimensions(file);
  const body = new FormData();
  body.append('file', file);
  body.append('folder', folder);
  body.append('alt', alt);
  if (size) {
    body.append('width', String(size.width));
    body.append('height', String(size.height));
  }
  const res = await fetch('/api/admin/media', { method: 'POST', body, headers: { accept: 'application/json' } });
  const data = (await res.json().catch(() => ({}))) as Partial<Uploaded> & { ok?: boolean; error?: string };
  if (!res.ok || !data.ok || !data.id) throw new Error(data.error ?? 'Upload gagal.');
  return data as Uploaded;
}
