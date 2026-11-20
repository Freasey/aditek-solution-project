import type { LEAD_STATUSES, PROJECT_SYSTEMS, ROADMAP_STAGES } from '../db/schema';

export const LEAD_SYSTEM_OPTIONS = [
  { value: 'security', label: 'Sistem keamanan' },
  { value: 'erp', label: 'Sistem ERP' },
  { value: 'spaces', label: 'Spaces' },
  { value: 'marketing', label: 'Digital Marketing' },
  { value: 'unsure', label: 'Belum yakin' },
] as const;

export const BUILDING_TYPES = ['Kantor', 'Gudang atau distribusi', 'Pabrik', 'Lainnya'] as const;
export const CITIES = ['Jakarta', 'Bogor', 'Depok', 'Tangerang', 'Bekasi'] as const;

export const STAGE_LABEL: Record<(typeof ROADMAP_STAGES)[number], string> = {
  perancangan: 'Perancangan',
  uji_coba: 'Uji coba',
  segera: 'Segera',
};

export const LEAD_STATUS_LABEL: Record<(typeof LEAD_STATUSES)[number], string> = {
  baru: 'Baru',
  dihubungi: 'Dihubungi',
  survei: 'Survei',
  penawaran: 'Penawaran',
  menang: 'Menang',
  batal: 'Batal',
};

export const PROJECT_SYSTEM_LABEL: Record<(typeof PROJECT_SYSTEMS)[number], string> = {
  security: 'Sistem keamanan',
  erp: 'Sistem ERP',
  spaces: 'Spaces',
  marketing: 'Digital Marketing',
  multi: 'Gabungan',
};

export function leadSystemLabel(value: string): string {
  return LEAD_SYSTEM_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
