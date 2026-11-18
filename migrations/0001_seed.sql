-- Seed awal production: tiga kartu sistem, roadmap (belum dipublikasikan), dan pengaturan.
-- Tidak ada data proyek di sini. Proyek contoh hanya ada di seed/dev.sql.
INSERT INTO `systems` (`slug`, `title`, `summary`, `cta_label`, `page_path`, `sort_order`, `updated_at`) VALUES
  ('security', 'Sistem keamanan', 'Access control, CCTV, dan visitor management dalam satu arsitektur.', 'Konsultasikan sistem keamanan', '/security-system', 1, '2026-11-18T00:00:00.000Z'),
  ('erp', 'Sistem ERP', 'Sales, purchasing, inventory, sampai accounting dalam satu data.', 'Konsultasikan sistem ERP', '/erp-system', 2, '2026-11-18T00:00:00.000Z'),
  ('spaces', 'Spaces', 'Aplikasi workplace kami, dimulai dari booking ruang meeting.', 'Minta demo Spaces', '/workplace-management', 3, '2026-11-18T00:00:00.000Z');
--> statement-breakpoint
INSERT INTO `roadmap_items` (`id`, `title`, `summary`, `stage`, `sort_order`, `published`, `created_at`, `updated_at`) VALUES
  ('3f0c2a0e-6c55-4a43-9d0e-6a1d1f2b7a01', 'Manajemen aset IT', 'Laptop, lisensi, dan perangkat jaringan.', 'uji_coba', 1, 0, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z'),
  ('3f0c2a0e-6c55-4a43-9d0e-6a1d1f2b7a02', 'Helpdesk IT', 'Tiket keluhan IT karyawan.', 'uji_coba', 2, 0, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z'),
  ('3f0c2a0e-6c55-4a43-9d0e-6a1d1f2b7a03', 'Parkir dan kendaraan', 'Gerbang dengan pembaca plat nomor.', 'perancangan', 3, 0, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z'),
  ('3f0c2a0e-6c55-4a43-9d0e-6a1d1f2b7a04', 'Monitoring energi', 'Pemakaian listrik per lantai.', 'perancangan', 4, 0, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z');
--> statement-breakpoint
INSERT INTO `settings` (`key`, `value`, `updated_at`) VALUES
  ('whatsapp_number', '', '2026-11-18T00:00:00.000Z'),
  ('contact_email', '', '2026-11-18T00:00:00.000Z'),
  ('reply_promise', 'Kami balas dalam satu hari kerja.', '2026-11-18T00:00:00.000Z'),
  ('hero_title', 'System integrator untuk keamanan gedung, ERP, dan workplace.', '2026-11-18T00:00:00.000Z'),
  ('footer_line', 'Dirancang dengan benar, dipakai setiap hari.', '2026-11-18T00:00:00.000Z'),
  ('og_image_id', '', '2026-11-18T00:00:00.000Z');
