import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const SYSTEM_SLUGS = ['security', 'erp', 'spaces'] as const;
export const PROJECT_SYSTEMS = ['security', 'erp', 'spaces', 'multi'] as const;
export const ROADMAP_STAGES = ['perancangan', 'uji_coba', 'segera'] as const;
export const LEAD_STATUSES = ['baru', 'dihubungi', 'survei', 'penawaran', 'menang', 'batal'] as const;
export const CONTACT_VIA = ['whatsapp', 'email'] as const;

export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  r2Key: text('r2_key').notNull().unique(),
  contentType: text('content_type').notNull(),
  bytes: integer('bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  alt: text('alt').notNull().default(''),
  createdAt: text('created_at').notNull(),
  createdBy: text('created_by'),
});

export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    clientName: text('client_name').notNull(),
    location: text('location').notNull(),
    year: integer('year').notNull(),
    system: text('system', { enum: PROJECT_SYSTEMS }).notNull(),
    solution: text('solution').notNull(),
    photoId: text('photo_id').references(() => media.id),
    photoCaption: text('photo_caption'),
    quote: text('quote'),
    quoteRole: text('quote_role'),
    statusLabel: text('status_label').notNull().default('Berjalan'),
    sortOrder: integer('sort_order').notNull().default(0),
    published: integer('published', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [check('projects_system_check', sql`${t.system} IN ('security','erp','spaces','multi')`)],
);

export const projectItems = sqliteTable('project_items', {
  id: text('id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  quantity: text('quantity').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const systems = sqliteTable(
  'systems',
  {
    slug: text('slug', { enum: SYSTEM_SLUGS }).primaryKey(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    ctaLabel: text('cta_label').notNull(),
    pagePath: text('page_path').notNull(),
    photoId: text('photo_id').references(() => media.id),
    sortOrder: integer('sort_order').notNull().default(0),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [check('systems_slug_check', sql`${t.slug} IN ('security','erp','spaces')`)],
);

export const roadmapItems = sqliteTable(
  'roadmap_items',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    stage: text('stage', { enum: ROADMAP_STAGES }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    published: integer('published', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [check('roadmap_stage_check', sql`${t.stage} IN ('perancangan','uji_coba','segera')`)],
);

export const leads = sqliteTable(
  'leads',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    company: text('company').notNull(),
    systems: text('systems').notNull(), // JSON array: ["security","erp"]
    buildingType: text('building_type').notNull(),
    city: text('city').notNull(),
    contactVia: text('contact_via', { enum: CONTACT_VIA }).notNull(),
    contactValue: text('contact_value').notNull(),
    message: text('message'),
    status: text('status', { enum: LEAD_STATUSES }).notNull().default('baru'),
    notes: text('notes'),
    sourcePath: text('source_path'),
    userAgent: text('user_agent'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (t) => [
    index('leads_created_idx').on(sql`${t.createdAt} DESC`),
    index('leads_status_idx').on(t.status),
    check('leads_contact_via_check', sql`${t.contactVia} IN ('whatsapp','email')`),
    check(
      'leads_status_check',
      sql`${t.status} IN ('baru','dihubungi','survei','penawaran','menang','batal')`,
    ),
  ],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  target: text('target'),
  createdAt: text('created_at').notNull(),
});

export type Media = typeof media.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type ProjectItem = typeof projectItems.$inferSelect;
export type System = typeof systems.$inferSelect;
export type RoadmapItem = typeof roadmapItems.$inferSelect;
export type Lead = typeof leads.$inferSelect;
