import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../db/client';
import { leads } from '../../db/schema';
import { contactLink } from '../../lib/contact-link';
import { getSettings } from '../../lib/content';
import { verifyTurnstile } from '../../lib/turnstile';
import { leadSchema } from '../../lib/validation';
import { newId, nowIso } from '../../lib/util';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

const FIELD_MESSAGE: Record<string, string> = {
  name: 'Nama minimal 2 karakter.',
  company: 'Nama perusahaan minimal 2 karakter.',
  whatsapp: 'Nomor WhatsApp tidak valid.',
  email: 'Email tidak valid.',
  message: 'Pesan maksimal 1000 karakter.',
};

export const POST: APIRoute = async ({ request }) => {
  if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
    return json(415, { ok: false, error: 'Format tidak didukung.' });
  }
  const ip = request.headers.get('cf-connecting-ip');

  const { success: allowed } = await env.LEAD_LIMITER.limit({ key: ip ?? 'unknown' });
  if (!allowed) return json(429, { ok: false, error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Data tidak valid.' });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? '');
    return json(400, { ok: false, field, error: FIELD_MESSAGE[field] ?? 'Periksa lagi isian form.' });
  }
  const lead = parsed.data;

  const human = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, lead.turnstileToken, ip);
  if (!human) return json(403, { ok: false, error: 'Verifikasi anti-spam gagal.' });

  const db = getDb(env);
  const now = nowIso();
  await db.insert(leads).values({
    id: newId(),
    name: lead.name,
    company: lead.company,
    systems: JSON.stringify(lead.systems),
    buildingType: lead.buildingType,
    city: lead.city,
    contactVia: lead.contactVia,
    contactValue: lead.contactValue,
    message: lead.message,
    sourcePath: lead.sourcePath?.startsWith('/') ? lead.sourcePath : null,
    userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const s = await getSettings(db);
  const redirect = contactLink({ whatsapp: s.whatsapp_number, email: s.contact_email }, lead);
  return json(200, { ok: true, redirect });
};
