export const nowIso = () => new Date().toISOString();
export const newId = () => crypto.randomUUID();

/** True bila SITE_URL menunjuk ke domain production. */
export function isProductionSite(siteUrl: string): boolean {
  try {
    const host = new URL(siteUrl).hostname;
    return host === 'worksell.id' || host.endsWith('.worksell.id');
  } catch {
    return true; // nilai rusak diperlakukan sebagai production (lebih aman)
  }
}

export function siteOrigin(siteUrl: string): string {
  return new URL(siteUrl).origin;
}

/** Normalisasi nomor WhatsApp Indonesia ke format 62xxxxxxxx. Null bila tidak valid. */
export function normalizeWhatsapp(raw: string): string | null {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  d = d.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  if (!d.startsWith('62')) return null;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(iso));
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
