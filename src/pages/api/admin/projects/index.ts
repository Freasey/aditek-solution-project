import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../../../db/client';
import { actor, back, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { parseProjectForm, photoExists, saveProject } from '../../../../lib/project-save';

export const POST: APIRoute = async (ctx) => {
  const form = await readForm(ctx);
  if (!form) return back('/admin/projects/new', { error: 'Form tidak valid.' });
  const parsed = parseProjectForm(form);
  if (!parsed.ok) return back('/admin/projects/new', { error: parsed.error });

  const db = getDb(env);
  if (!(await photoExists(db, parsed.data.photoId))) return back('/admin/projects/new', { error: 'Foto tidak ditemukan.' });
  const id = await saveProject(db, parsed.data);
  await audit(db, actor(ctx.locals), 'project.create', id);
  return back(`/admin/projects/${id}`, { ok: 'Proyek dibuat.' });
};
