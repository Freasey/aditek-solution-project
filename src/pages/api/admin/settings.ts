import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../../db/client';
import { settings } from '../../../db/schema';
import { actor, back, formObject, readForm } from '../../../lib/admin';
import { audit } from '../../../lib/audit';
import { SETTING_KEYS } from '../../../lib/content';
import { photoExists } from '../../../lib/project-save';
import { nowIso } from '../../../lib/util';
import { firstIssue, settingsSchema } from '../../../lib/validation';

export const POST: APIRoute = async (ctx) => {
  const form = await readForm(ctx);
  if (!form) return back('/admin/settings', { error: 'Form tidak valid.' });
  const raw = { og_image_id: '', ...formObject(form, SETTING_KEYS) };
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return back('/admin/settings', { error: firstIssue(parsed.error) });

  const db = getDb(env);
  if (!(await photoExists(db, parsed.data.og_image_id || null))) {
    return back('/admin/settings', { error: 'OG image tidak ditemukan.' });
  }
  const now = nowIso();
  const [first, ...rest] = SETTING_KEYS.map((key) =>
    db
      .insert(settings)
      .values({ key, value: parsed.data[key], updatedAt: now })
      .onConflictDoUpdate({ target: settings.key, set: { value: parsed.data[key], updatedAt: now } }),
  );
  await db.batch([first!, ...rest]);
  await audit(db, actor(ctx.locals), 'settings.update', null);
  return back('/admin/settings', { ok: 'Pengaturan disimpan.' });
};
