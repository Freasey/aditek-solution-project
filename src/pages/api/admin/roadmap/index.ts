import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../../../db/client';
import { roadmapItems } from '../../../../db/schema';
import { actor, back, formObject, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { newId, nowIso } from '../../../../lib/util';
import { firstIssue, roadmapSchema } from '../../../../lib/validation';



export const POST: APIRoute = async (ctx) => {
  const form = await readForm(ctx);
  if (!form) return back('/admin/roadmap', { error: 'Form tidak valid.' });
  const parsed = roadmapSchema.safeParse(formObject(form, ['title', 'summary', 'stage', 'sortOrder', 'published']));
  if (!parsed.success) return back('/admin/roadmap', { error: firstIssue(parsed.error) });

  const db = getDb(env);
  const id = newId();
  const now = nowIso();
  await db.insert(roadmapItems).values({ ...parsed.data, id, createdAt: now, updatedAt: now });
  await audit(db, actor(ctx.locals), 'roadmap.create', id);
  return back('/admin/roadmap', { ok: 'Item ditambahkan.' });
};
