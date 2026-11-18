import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db/client';
import { projects } from '../../../../db/schema';
import { actor, back, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { parseProjectForm, photoExists, saveProject } from '../../../../lib/project-save';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const page = `/admin/projects/${id}`;
  const form = await readForm(ctx);
  if (!form) return back(page, { error: 'Form tidak valid.' });
  const parsed = parseProjectForm(form);
  if (!parsed.ok) return back(page, { error: parsed.error });

  const db = getDb(env);
  const exists = await db.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).get();
  if (!exists) return back('/admin/projects', { error: 'Proyek tidak ditemukan.' });
  if (!(await photoExists(db, parsed.data.photoId))) return back(page, { error: 'Foto tidak ditemukan.' });
  await saveProject(db, parsed.data, id);
  await audit(db, actor(ctx.locals), 'project.update', id);
  return back(page, { ok: 'Proyek disimpan.' });
};
