import type { APIContext } from 'astro';

/** Email admin dari cookie sesi (diisi middleware). */
export function actor(locals: App.Locals): string {
  return locals.user?.email ?? 'unknown';
}

/** Redirect 303 kembali ke halaman admin dengan pesan singkat. */
export function back(path: string, msg: { ok?: string; error?: string } = {}): Response {
  const url = new URL(path, 'http://x');
  if (msg.ok) url.searchParams.set('ok', msg.ok);
  if (msg.error) url.searchParams.set('error', msg.error);
  return new Response(null, { status: 303, headers: { Location: url.pathname + url.search } });
}

export function wantsJson(request: Request): boolean {
  return (request.headers.get('accept') ?? '').includes('application/json');
}

export function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** FormData ke objek biasa (field tunggal). */
export function formObject(form: FormData, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) {
    const v = form.get(k);
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

export async function readForm(ctx: Pick<APIContext, 'request'>): Promise<FormData | null> {
  try {
    return await ctx.request.formData();
  } catch {
    return null;
  }
}

/** Pesan flash dari query string untuk halaman admin. */
export function flash(url: URL): { ok: string | null; error: string | null } {
  return { ok: url.searchParams.get('ok'), error: url.searchParams.get('error') };
}

/** Escape nilai CSV dan cegah formula injection di Excel/Sheets. */
export function csvCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Tanggal "YYYY-MM-DD" (WIB) ke ISO UTC. */
export function wibDateToIso(date: string, endOfDay = false): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}+07:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}
