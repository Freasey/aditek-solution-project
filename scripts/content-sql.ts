/**
 * Ubah content/production.json menjadi SQL untuk D1.
 *
 *   pnpm content:sql                      SQL ke stdout
 *   pnpm content:apply:local              jalankan ke D1 lokal
 *   pnpm content:apply:remote             jalankan ke D1 production
 *
 * Aturan:
 * - Hanya bagian yang ada di file yang disentuh. Bagian yang tidak ada dibiarkan.
 * - `settings`: hanya key yang ditulis yang diubah.
 * - `systems`: kartu yang ditulis diperbarui berdasarkan slug. Foto tidak disentuh.
 * - `projects` dan `roadmap`: file adalah daftar lengkap. Baris di database yang tidak ada di
 *   file dihapus. Urutan di file menjadi urutan tampil. Foto proyek (dipasang lewat /admin)
 *   tetap dipertahankan.
 * - Validasi memakai skema Zod yang sama dengan form /admin.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { SYSTEM_SLUGS } from '../src/db/schema';
import { firstIssue, projectSchema, roadmapSchema, settingsSchema, systemSchema } from '../src/lib/validation';

const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const outPath = outIdx >= 0 ? args[outIdx + 1] : undefined;
const file =
  args.find((a, i) => !a.startsWith('--') && (outIdx < 0 || i !== outIdx + 1)) ?? 'content/production.json';

const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

const fileSchema = z
  .object({
    $comment: z.unknown().optional(),
    settings: z.record(z.string(), z.string()).optional(),
    systems: z
      .array(
        z.object({
          slug: z.enum(SYSTEM_SLUGS),
          title: z.string(),
          summary: z.string(),
          ctaLabel: z.string(),
        }),
      )
      .optional(),
    roadmap: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(64).optional(),
          title: z.string(),
          summary: z.string(),
          stage: z.string(),
          published: z.boolean().default(true),
        }),
      )
      .optional(),
    projects: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(64).optional(),
          clientName: z.string(),
          location: z.string(),
          year: z.number(),
          system: z.string(),
          solution: z.string(),
          photoCaption: z.string().optional(),
          quote: z.string().optional(),
          quoteRole: z.string().optional(),
          items: z.array(z.string()).default([]),
          published: z.boolean().default(true),
        }),
      )
      .optional(),
  })
  .strict();

function fail(where: string, msg: string): never {
  console.error(`Data tidak valid di ${where}: ${msg}`);
  process.exit(1);
}

const parsedFile = fileSchema.safeParse(raw);
if (!parsedFile.success) fail(file, firstIssue(parsedFile.error));
const content = parsedFile.data;

const q = (v: string | number | boolean | null | undefined): string => {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  return `'${v.replace(/'/g, "''")}'`;
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(pt|cv|tbk)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const now = new Date().toISOString();
const sql: string[] = [`-- Dibuat oleh scripts/content-sql.ts dari ${file} pada ${now}`];
const touched: string[] = [];

// settings
if (content.settings) {
  const shape = settingsSchema.shape;
  for (const [key, value] of Object.entries(content.settings)) {
    if (!(key in shape)) fail(`settings.${key}`, 'key tidak dikenal');
    const r = shape[key as keyof typeof shape].safeParse(value);
    if (!r.success) fail(`settings.${key}`, firstIssue(r.error));
    sql.push(
      `INSERT INTO \`settings\` (\`key\`, \`value\`, \`updated_at\`) VALUES (${q(key)}, ${q(r.data)}, ${q(now)})` +
        ` ON CONFLICT(\`key\`) DO UPDATE SET \`value\` = excluded.\`value\`, \`updated_at\` = excluded.\`updated_at\`;`,
    );
  }
  touched.push('settings');
}

// systems
if (content.systems) {
  content.systems.forEach((s, i) => {
    const r = systemSchema.safeParse({ ...s, sortOrder: i + 1 });
    if (!r.success) fail(`systems[${s.slug}]`, firstIssue(r.error));
    const d = r.data;
    sql.push(
      `UPDATE \`systems\` SET \`title\` = ${q(d.title)}, \`summary\` = ${q(d.summary)}, \`cta_label\` = ${q(d.ctaLabel)},` +
        ` \`sort_order\` = ${d.sortOrder}, \`updated_at\` = ${q(now)} WHERE \`slug\` = ${q(s.slug)};`,
    );
  });
  touched.push('systems');
}

// roadmap
if (content.roadmap) {
  const ids: string[] = [];
  content.roadmap.forEach((item, i) => {
    const r = roadmapSchema.safeParse({ ...item, sortOrder: i + 1, published: item.published ? 'on' : '' });
    if (!r.success) fail(`roadmap[${i}] "${item.title}"`, firstIssue(r.error));
    const d = r.data;
    const id = item.id ?? `roadmap-${slug(d.title)}`;
    if (ids.includes(id)) fail(`roadmap[${i}]`, `id ganda "${id}"`);
    ids.push(id);
    sql.push(
      `INSERT INTO \`roadmap_items\` (\`id\`, \`title\`, \`summary\`, \`stage\`, \`sort_order\`, \`published\`, \`created_at\`, \`updated_at\`)` +
        ` VALUES (${q(id)}, ${q(d.title)}, ${q(d.summary)}, ${q(d.stage)}, ${d.sortOrder}, ${q(d.published)}, ${q(now)}, ${q(now)})` +
        ` ON CONFLICT(\`id\`) DO UPDATE SET \`title\` = excluded.\`title\`, \`summary\` = excluded.\`summary\`, \`stage\` = excluded.\`stage\`,` +
        ` \`sort_order\` = excluded.\`sort_order\`, \`published\` = excluded.\`published\`, \`updated_at\` = excluded.\`updated_at\`;`,
    );
  });
  sql.push(
    ids.length
      ? `DELETE FROM \`roadmap_items\` WHERE \`id\` NOT IN (${ids.map(q).join(', ')});`
      : 'DELETE FROM `roadmap_items`;',
  );
  touched.push('roadmap');
}

// projects
if (content.projects) {
  const ids: string[] = [];
  content.projects.forEach((p, i) => {
    const { items, published, id: givenId, ...rest } = p;
    const r = projectSchema.safeParse({
      ...rest,
      sortOrder: i + 1,
      published: published ? 'on' : '',
      items: items.map((label) => ({ label })),
    });
    if (!r.success) fail(`projects[${i}] "${p.clientName}"`, firstIssue(r.error));
    const d = r.data;
    const id = givenId ?? `proj-${slug(d.clientName)}-${d.year}`;
    if (ids.includes(id)) fail(`projects[${i}]`, `id ganda "${id}", isi "id" sendiri untuk proyek ini`);
    ids.push(id);
    sql.push(
      `INSERT INTO \`projects\` (\`id\`, \`client_name\`, \`location\`, \`year\`, \`system\`, \`solution\`, \`photo_caption\`, \`quote\`, \`quote_role\`, \`sort_order\`, \`published\`, \`created_at\`, \`updated_at\`)` +
        ` VALUES (${q(id)}, ${q(d.clientName)}, ${q(d.location)}, ${d.year}, ${q(d.system)}, ${q(d.solution)}, ${q(d.photoCaption)}, ${q(d.quote)}, ${q(d.quoteRole)}, ${d.sortOrder}, ${q(d.published)}, ${q(now)}, ${q(now)})` +
        ` ON CONFLICT(\`id\`) DO UPDATE SET \`client_name\` = excluded.\`client_name\`, \`location\` = excluded.\`location\`, \`year\` = excluded.\`year\`,` +
        ` \`system\` = excluded.\`system\`, \`solution\` = excluded.\`solution\`, \`photo_caption\` = excluded.\`photo_caption\`, \`quote\` = excluded.\`quote\`,` +
        ` \`quote_role\` = excluded.\`quote_role\`, \`sort_order\` = excluded.\`sort_order\`, \`published\` = excluded.\`published\`, \`updated_at\` = excluded.\`updated_at\`;`,
    );
    sql.push(`DELETE FROM \`project_items\` WHERE \`project_id\` = ${q(id)};`);
    if (d.items.length) {
      const rows = d.items.map((it, j) => `(${q(`${id}-item-${j + 1}`)}, ${q(id)}, ${q(it.label)}, ${j + 1})`);
      sql.push(`INSERT INTO \`project_items\` (\`id\`, \`project_id\`, \`label\`, \`sort_order\`) VALUES ${rows.join(', ')};`);
    }
  });
  const keep = ids.map(q).join(', ');
  sql.push(
    ids.length
      ? `DELETE FROM \`project_items\` WHERE \`project_id\` NOT IN (${keep});`
      : 'DELETE FROM `project_items`;',
    ids.length ? `DELETE FROM \`projects\` WHERE \`id\` NOT IN (${keep});` : 'DELETE FROM `projects`;',
  );
  touched.push('projects');
}

if (!touched.length) fail(file, 'tidak ada bagian settings, systems, roadmap, atau projects');

sql.push(
  `INSERT INTO \`audit_log\` (\`id\`, \`actor\`, \`action\`, \`target\`, \`created_at\`)` +
    ` VALUES (${q(crypto.randomUUID())}, 'content-sync', 'content.sync', ${q(touched.join(','))}, ${q(now)});`,
);

const out = sql.join('\n') + '\n';
if (outPath) {
  writeFileSync(outPath, out);
  console.error(`OK: ${touched.join(', ')} -> ${outPath}`);
} else {
  process.stdout.write(out);
}
