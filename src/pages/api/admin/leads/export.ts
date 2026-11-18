import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { getDb } from '../../../../db/client';
import { actor, csvCell } from '../../../../lib/admin';
import { audit } from '../../../../lib/audit';
import { LEAD_STATUS_LABEL, leadSystemLabel } from '../../../../lib/labels';
import { parseLeadFilter, queryLeads } from '../../../../lib/leads-query';

export const GET: APIRoute = async ({ url, locals }) => {
  const db = getDb(env);
  const rows = await queryLeads(db, parseLeadFilter(url), 10000);
  const header = ['Masuk', 'Nama', 'Perusahaan', 'Sistem', 'Jenis gedung', 'Kota', 'Kontak via', 'Kontak', 'Pesan', 'Status', 'Catatan', 'Halaman'];
  const lines = rows.map((l) => {
    let systems: string[] = [];
    try { systems = JSON.parse(l.systems) as string[]; } catch { systems = []; }
    return [
      l.createdAt, l.name, l.company, systems.map(leadSystemLabel).join(', '), l.buildingType, l.city,
      l.contactVia, l.contactValue, l.message, LEAD_STATUS_LABEL[l.status], l.notes, l.sourcePath,
    ].map(csvCell).join(',');
  });
  await audit(db, actor(locals), 'lead.export', `${rows.length} baris`);
  const csv = '﻿' + [header.map(csvCell).join(','), ...lines].join('\r\n') + '\r\n';
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="worksell-leads-${date}.csv"`,
    },
  });
};
