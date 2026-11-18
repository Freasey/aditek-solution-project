import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../../db/client';
import { projects } from '../../../../../db/schema';
import { actor, back, readForm } from '../../../../../lib/admin';
import { audit } from '../../../../../lib/audit';
import { nowIso } from '../../../../../lib/util';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const form = await readForm(ctx);
  const published = form?.get('published') === '1';
  const db = getDb(env);
  const res = await db
    .update(projects)
    .set({ published, updatedAt: nowIso() })
    .where(eq(projects.id, id))
    .returning({ name: projects.clientName });
  if (!res.length) return back('/admin/projects', { error: 'Proyek tidak ditemukan.' });
  await audit(db, actor(ctx.locals), published ? 'project.publish' : 'project.unpublish', id);
  return back('/admin/projects', { ok: `${res[0]!.name} ${published ? 'tampil di Home' : 'disembunyikan'}.` });
};
