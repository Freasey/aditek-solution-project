import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db/client';
import { media } from '../../../../db/schema';
import { actor, back, formObject, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { firstIssue, mediaAltSchema } from '../../../../lib/validation';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const form = await readForm(ctx);
  if (!form) return back('/admin/media', { error: 'Form tidak valid.' });
  const parsed = mediaAltSchema.safeParse(formObject(form, ['alt']));
  if (!parsed.success) return back('/admin/media', { error: firstIssue(parsed.error) });

  const db = getDb(env);
  const res = await db.update(media).set({ alt: parsed.data.alt }).where(eq(media.id, id)).returning({ key: media.r2Key });
  if (!res.length) return back('/admin/media', { error: 'Foto tidak ditemukan.' });
  await audit(db, actor(ctx.locals), 'media.alt', res[0]!.key);
  return back('/admin/media', { ok: 'Alt text disimpan.' });
};
