import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../../db/client';
import { projects } from '../../../../../db/schema';
import { actor, back } from '../../../../../lib/admin';
import { audit } from '../../../../../lib/audit';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const db = getDb(env);
  const res = await db.delete(projects).where(eq(projects.id, id)).returning({ name: projects.clientName });
  if (!res.length) return back('/admin/projects', { error: 'Proyek tidak ditemukan.' });
  await audit(db, actor(ctx.locals), 'project.delete', `${id} ${res[0]!.name}`);
  return back('/admin/projects', { ok: 'Proyek dihapus.' });
};
