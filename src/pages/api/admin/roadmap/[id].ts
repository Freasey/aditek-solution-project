import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db/client';
import { roadmapItems } from '../../../../db/schema';
import { actor, back, formObject, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { nowIso } from '../../../../lib/util';
import { firstIssue, roadmapSchema } from '../../../../lib/validation';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const form = await readForm(ctx);
  if (!form) return back('/admin/roadmap', { error: 'Form tidak valid.' });
  const parsed = roadmapSchema.safeParse(formObject(form, ['title', 'summary', 'stage', 'sortOrder', 'published']));
  if (!parsed.success) return back('/admin/roadmap', { error: firstIssue(parsed.error) });

  const db = getDb(env);
  const res = await db
    .update(roadmapItems)
    .set({ ...parsed.data, updatedAt: nowIso() })
    .where(eq(roadmapItems.id, id))
    .returning({ id: roadmapItems.id });
  if (!res.length) return back('/admin/roadmap', { error: 'Item tidak ditemukan.' });
  await audit(db, actor(ctx.locals), 'roadmap.update', id);
  return back('/admin/roadmap', { ok: `${parsed.data.title} disimpan.` });
};
