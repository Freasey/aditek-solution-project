import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../../db/client';
import { roadmapItems } from '../../../../../db/schema';
import { actor, back } from '../../../../../lib/admin';
import { audit } from '../../../../../lib/audit';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const db = getDb(env);
  const res = await db.delete(roadmapItems).where(eq(roadmapItems.id, id)).returning({ title: roadmapItems.title });
  if (!res.length) return back('/admin/roadmap', { error: 'Item tidak ditemukan.' });
  await audit(db, actor(ctx.locals), 'roadmap.delete', `${id} ${res[0]!.title}`);
  return back('/admin/roadmap', { ok: 'Item dihapus.' });
};
