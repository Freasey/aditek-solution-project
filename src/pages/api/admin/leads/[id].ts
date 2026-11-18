import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { getDb } from '../../../../db/client';
import { leads } from '../../../../db/schema';
import { actor, back, formObject, readForm } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { nowIso } from '../../../../lib/util';
import { firstIssue, leadUpdateSchema } from '../../../../lib/validation';

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id ?? '';
  const page = `/admin/leads/${id}`;
  const form = await readForm(ctx);
  if (!form) return back(page, { error: 'Form tidak valid.' });
  const parsed = leadUpdateSchema.safeParse(formObject(form, ['status', 'notes']));
  if (!parsed.success) return back(page, { error: firstIssue(parsed.error) });

  const db = getDb(env);
  const res = await db
    .update(leads)
    .set({ ...parsed.data, updatedAt: nowIso() })
    .where(eq(leads.id, id))
    .returning({ id: leads.id });
  if (!res.length) return back('/admin/leads', { error: 'Lead tidak ditemukan.' });
  await audit(db, actor(ctx.locals), 'lead.update', id);
  return back(page, { ok: 'Lead disimpan.' });
};
