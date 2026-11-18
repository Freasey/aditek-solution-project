import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../../../../../db/client';
import { media, projects, settings, systems } from '../../../../../db/schema';
import { actor, back } from '../../../../../lib/admin';
import { audit } from '../../../../../lib/audit';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const db = getDb(env);
  const row = await db.select().from(media).where(eq(media.id, id)).get();
  if (!row) return back('/admin/media', { error: 'Foto tidak ditemukan.' });

  const [p, s, og] = await Promise.all([
    db.select({ name: projects.clientName }).from(projects).where(eq(projects.photoId, id)).limit(1).get(),
    db.select({ title: systems.title }).from(systems).where(eq(systems.photoId, id)).limit(1).get(),
    db.select({ key: settings.key }).from(settings).where(and(eq(settings.key, 'og_image_id'), eq(settings.value, id))).get(),
  ]);
  const usedBy = p ? `proyek ${p.name}` : s ? `kartu ${s.title}` : og ? 'OG image di pengaturan' : null;
  if (usedBy) return back('/admin/media', { error: `Foto masih dipakai oleh ${usedBy}.` });

  await db.delete(media).where(eq(media.id, id));
  await env.MEDIA.delete(row.r2Key);
  await audit(db, actor(ctx.locals), 'media.delete', row.r2Key);
  return back('/admin/media', { ok: 'Foto dihapus.' });
};
