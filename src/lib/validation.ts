import { z } from 'zod';
import { LEAD_STATUSES, PROJECT_SYSTEMS, ROADMAP_STAGES } from '../db/schema';
import { BUILDING_TYPES, CITIES } from './labels';
import { normalizeWhatsapp } from './util';

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const leadSchema = z
  .object({
    name: trimmed(2, 100),
    company: trimmed(2, 150),
    systems: z.array(z.enum(['security', 'erp', 'spaces', 'unsure'])).max(4).default([]),
    buildingType: z.enum(BUILDING_TYPES),
    city: z.enum(CITIES),
    contactVia: z.enum(['whatsapp', 'email']),
    whatsapp: z.string().trim().max(30).optional().default(''),
    email: z.string().trim().max(200).optional().default(''),
    message: optionalText(1000),
    sourcePath: z.string().max(200).optional(),
    turnstileToken: z.string().max(4096).optional().default(''),
    website: z.string().max(200).optional().default(''),
  })
  .transform((v, ctx) => {
    let contactValue: string;
    if (v.contactVia === 'whatsapp') {
      const n = normalizeWhatsapp(v.whatsapp);
      if (!n) {
        ctx.addIssue({ code: 'custom', path: ['whatsapp'], message: 'Nomor WhatsApp tidak valid.' });
        return z.NEVER;
      }
      contactValue = n;
    } else {
      const parsed = z.email().safeParse(v.email);
      if (!parsed.success) {
        ctx.addIssue({ code: 'custom', path: ['email'], message: 'Email tidak valid.' });
        return z.NEVER;
      }
      contactValue = parsed.data.toLowerCase();
    }
    return { ...v, systems: [...new Set(v.systems)], contactValue };
  });
export type LeadInput = z.output<typeof leadSchema>;

const checkbox = z
  .union([z.literal('on'), z.literal('1'), z.literal('true'), z.literal('')])
  .optional()
  .transform((v) => v === 'on' || v === '1' || v === 'true');
const intField = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const mediaId = z
  .string()
  .trim()
  .max(64)
  .optional()
  .transform((v) => (v ? v : null));

export const projectSchema = z.object({
  clientName: trimmed(2, 150),
  location: trimmed(2, 150),
  year: intField(2000, 2100),
  system: z.enum(PROJECT_SYSTEMS),
  solution: trimmed(2, 100),
  photoId: mediaId,
  photoCaption: optionalText(160),
  quote: optionalText(300),
  quoteRole: optionalText(100),
  sortOrder: intField(0, 9999).default(0),
  published: checkbox,
  items: z
    .array(z.object({ label: trimmed(1, 100) }))
    .max(12)
    .default([]),
});

export const systemSchema = z.object({
  title: trimmed(2, 60),
  summary: trimmed(2, 200),
  ctaLabel: trimmed(2, 60),
  photoId: mediaId,
  sortOrder: intField(0, 99).default(0),
});

export const roadmapSchema = z.object({
  title: trimmed(2, 80),
  summary: trimmed(2, 200),
  stage: z.enum(ROADMAP_STAGES),
  sortOrder: intField(0, 9999).default(0),
  published: checkbox,
});

export const leadUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES),
  notes: optionalText(4000),
});

export const settingsSchema = z.object({
  whatsapp_number: z
    .string()
    .trim()
    .max(30)
    .transform((v, ctx) => {
      if (!v) return '';
      const n = normalizeWhatsapp(v);
      if (!n) {
        ctx.addIssue({ code: 'custom', message: 'Nomor WhatsApp tidak valid.' });
        return z.NEVER;
      }
      return n;
    }),
  contact_email: z.union([z.literal(''), z.email().max(200)]),
  reply_promise: trimmed(2, 120),
  hero_title: trimmed(10, 120),
  footer_line: trimmed(5, 120),
  og_image_id: z.string().trim().max(64),
});
export type SettingsInput = z.output<typeof settingsSchema>;

export const mediaAltSchema = z.object({ alt: z.string().trim().max(200) });

/** Pesan error Zod pertama, dalam bahasa yang bisa dibaca admin. */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Data tidak valid.';
  const field = issue.path.join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}
