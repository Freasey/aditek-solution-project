import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db/client';
import { SYSTEM_SLUGS, systems } from '../../../../db/schema';
import { actor, back, formObject, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { photoExists } from '../../../../lib/project-save';
import { nowIso } from '../../../../lib/util';
import { firstIssue, systemSchema } from '../../../../lib/validation';

export const POST: APIRoute = async (ctx) => {
  const slug = ctx.params.slug ?? '';
  if (!(SYSTEM_SLUGS as readonly string[]).includes(slug)) return back('/admin/systems', { error: 'Sistem tidak dikenal.' });
  const form = await readForm(ctx);
  if (!form) return back('/admin/systems', { error: 'Form tidak valid.' });
  const parsed = systemSchema.safeParse(formObject(form, ['title', 'summary', 'ctaLabel', 'photoId', 'sortOrder']));
  if (!parsed.success) return back('/admin/systems', { error: firstIssue(parsed.error) });

  const db = getDb(env);
  if (!(await photoExists(db, parsed.data.photoId))) return back('/admin/systems', { error: 'Foto tidak ditemukan.' });
  await db
    .update(systems)
    .set({ ...parsed.data, updatedAt: nowIso() })
    .where(eq(systems.slug, slug as (typeof SYSTEM_SLUGS)[number]));
  await audit(db, actor(ctx.locals), 'system.update', slug);
  return back('/admin/systems', { ok: `${parsed.data.title} disimpan.` });
};
