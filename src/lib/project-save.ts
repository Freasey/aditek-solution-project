import type { BatchItem } from 'drizzle-orm/batch';
import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import { media, projectItems, projects } from '../db/schema';
import { firstIssue, projectSchema } from './validation';
import { newId, nowIso } from './util';

const FIELDS = [
  'clientName', 'location', 'year', 'system', 'solution', 'photoId', 'photoCaption',
  'quote', 'quoteRole', 'sortOrder', 'published',
] as const;

export function parseProjectForm(form: FormData) {
  const raw: Record<string, unknown> = {};
  for (const k of FIELDS) {
    const v = form.get(k);
    if (typeof v === 'string') raw[k] = v;
  }
  raw.items = form
    .getAll('item_label')
    .map((v) => String(v).trim())
    .filter(Boolean)
    .map((label) => ({ label }));
  const parsed = projectSchema.safeParse(raw);
  return parsed.success ? { ok: true as const, data: parsed.data } : { ok: false as const, error: firstIssue(parsed.error) };
}

type ProjectInput = Extract<ReturnType<typeof parseProjectForm>, { ok: true }>['data'];

export async function photoExists(db: Db, id: string | null): Promise<boolean> {
  if (!id) return true;
  return !!(await db.select({ id: media.id }).from(media).where(eq(media.id, id)).get());
}

/** Simpan proyek beserta baris perangkat dalam satu batch (atomik di D1). */
export async function saveProject(db: Db, input: ProjectInput, id?: string): Promise<string> {
  const now = nowIso();
  const { items, ...fields } = input;
  const projectId = id ?? newId();
  const head: BatchItem<'sqlite'> = id
    ? db.update(projects).set({ ...fields, updatedAt: now }).where(eq(projects.id, id))
    : db.insert(projects).values({ ...fields, id: projectId, createdAt: now, updatedAt: now });
  const rest: BatchItem<'sqlite'>[] = [];
  if (id) rest.push(db.delete(projectItems).where(eq(projectItems.projectId, id)));
  if (items.length) {
    rest.push(
      db.insert(projectItems).values(
        items.map((it, i) => ({ id: newId(), projectId, label: it.label, sortOrder: i + 1 })),
      ),
    );
  }
  await db.batch([head, ...rest]);
  return projectId;
}
