import { and, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import type { Db } from '../db/client';
import { LEAD_STATUSES, leads } from '../db/schema';
import { wibDateToIso } from './admin';

export interface LeadFilter {
  status: (typeof LEAD_STATUSES)[number] | '';
  from: string;
  to: string;
}

export function parseLeadFilter(url: URL): LeadFilter {
  const s = url.searchParams.get('status') ?? '';
  return {
    status: (LEAD_STATUSES as readonly string[]).includes(s) ? (s as LeadFilter['status']) : '',
    from: url.searchParams.get('from') ?? '',
    to: url.searchParams.get('to') ?? '',
  };
}

export function leadWhere(f: LeadFilter): SQL | undefined {
  const parts: SQL[] = [];
  if (f.status) parts.push(eq(leads.status, f.status));
  const from = wibDateToIso(f.from);
  const to = wibDateToIso(f.to, true);
  if (from) parts.push(gte(leads.createdAt, from));
  if (to) parts.push(lte(leads.createdAt, to));
  return parts.length ? and(...parts) : undefined;
}

export function queryLeads(db: Db, f: LeadFilter, limit: number, offset = 0) {
  return db.select().from(leads).where(leadWhere(f)).orderBy(desc(leads.createdAt)).limit(limit).offset(offset);
}
