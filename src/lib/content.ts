import { asc, eq, inArray } from 'drizzle-orm';
import type { Db } from '../db/client';
import { media, projectItems, projects, roadmapItems, settings, systems } from '../db/schema';
import type { Media, Project, ProjectItem, RoadmapItem, System } from '../db/schema';

export const SETTING_KEYS = [
  'whatsapp_number',
  'contact_email',
  'reply_promise',
  'hero_title',
  'footer_line',
  'og_image_id',
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type SiteSettings = Record<SettingKey, string>;

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsapp_number: '',
  contact_email: '',
  reply_promise: 'Kami balas dalam satu hari kerja.',
  hero_title: 'Satu tim IT untuk kebutuhan perusahaan Anda.',
  footer_line: 'Dirancang dengan benar, dipakai setiap hari.',
  og_image_id: '',
};

export async function getSettings(db: Db): Promise<SiteSettings> {
  const rows = await db.select().from(settings);
  const out = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if ((SETTING_KEYS as readonly string[]).includes(r.key)) out[r.key as SettingKey] = r.value;
  }
  return out;
}

async function mediaById(db: Db, ids: (string | null)[]): Promise<Map<string, Media>> {
  const wanted = [...new Set(ids.filter((v): v is string => !!v))];
  if (!wanted.length) return new Map();
  const rows = await db.select().from(media).where(inArray(media.id, wanted));
  return new Map(rows.map((m) => [m.id, m]));
}

export async function getMedia(db: Db, id: string | null | undefined): Promise<Media | null> {
  if (!id) return null;
  return (await db.select().from(media).where(eq(media.id, id)).get()) ?? null;
}

export type ProjectCard = Project & { items: ProjectItem[]; photo: Media | null };

export async function getProjectCards(db: Db, opts: { publishedOnly: boolean }): Promise<ProjectCard[]> {
  const q = db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.createdAt));
  const list = opts.publishedOnly ? await q.where(eq(projects.published, true)) : await q;
  if (!list.length) return [];
  const [items, photos] = await Promise.all([
    db
      .select()
      .from(projectItems)
      .where(inArray(projectItems.projectId, list.map((p) => p.id)))
      .orderBy(asc(projectItems.sortOrder)),
    mediaById(db, list.map((p) => p.photoId)),
  ]);
  return list.map((p) => ({
    ...p,
    items: items.filter((i) => i.projectId === p.id),
    photo: p.photoId ? (photos.get(p.photoId) ?? null) : null,
  }));
}

export async function getProjectCard(db: Db, id: string): Promise<ProjectCard | null> {
  const p = await db.select().from(projects).where(eq(projects.id, id)).get();
  if (!p) return null;
  const [items, photo] = await Promise.all([
    db.select().from(projectItems).where(eq(projectItems.projectId, id)).orderBy(asc(projectItems.sortOrder)),
    getMedia(db, p.photoId),
  ]);
  return { ...p, items, photo };
}

export type SystemCard = System & { photo: Media | null };

export async function getSystems(db: Db): Promise<SystemCard[]> {
  const list = await db.select().from(systems).orderBy(asc(systems.sortOrder));
  const photos = await mediaById(db, list.map((s) => s.photoId));
  return list.map((s) => ({ ...s, photo: s.photoId ? (photos.get(s.photoId) ?? null) : null }));
}

export async function getRoadmap(db: Db, opts: { publishedOnly: boolean }): Promise<RoadmapItem[]> {
  const q = db.select().from(roadmapItems).orderBy(asc(roadmapItems.sortOrder), asc(roadmapItems.createdAt));
  return opts.publishedOnly ? q.where(eq(roadmapItems.published, true)) : q;
}
