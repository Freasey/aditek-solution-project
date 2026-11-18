/** Membuat link wa.me atau mailto: berisi permintaan yang sudah tertulis. Dipakai server dan browser. */
export interface ContactTargets {
  whatsapp: string;
  email: string;
}
export interface LeadSummary {
  name: string;
  company: string;
  systems: string[];
  buildingType: string;
  city: string;
  contactVia: 'whatsapp' | 'email';
  contactValue: string;
  message?: string | null;
}

const SYSTEM_LABEL: Record<string, string> = {
  security: 'Sistem keamanan',
  erp: 'Sistem ERP',
  spaces: 'Spaces',
  unsure: 'Belum yakin',
};

export function leadText(l: LeadSummary): string {
  const sys = l.systems.map((s) => SYSTEM_LABEL[s] ?? s).join(', ') || 'Belum dipilih';
  return [
    `Halo Worksell ID, saya ${l.name} dari ${l.company}.`,
    `Sistem: ${sys}`,
    `Gedung: ${l.buildingType}, ${l.city}`,
    `Hubungi lewat ${l.contactVia === 'whatsapp' ? 'WhatsApp' : 'email'}: ${l.contactValue}`,
    l.message ?? '',
  ]
    .join('\n')
    .trim();
}

export function contactLink(to: ContactTargets, l: LeadSummary): string | null {
  const text = leadText(l);
  if (l.contactVia === 'whatsapp' && to.whatsapp) {
    return `https://wa.me/${to.whatsapp}?text=${encodeURIComponent(text)}`;
  }
  const email = to.email;
  if (!email) return to.whatsapp ? `https://wa.me/${to.whatsapp}?text=${encodeURIComponent(text)}` : null;
  const subject = encodeURIComponent(`Permintaan konsultasi, ${l.company}`);
  return `mailto:${email}?subject=${subject}&body=${encodeURIComponent(text)}`;
}
