-- Seed khusus development lokal. JANGAN dijalankan ke database production.
-- pnpm db:seed:local
DELETE FROM `project_items`;
DELETE FROM `projects`;

INSERT INTO `projects` (`id`, `client_name`, `location`, `year`, `system`, `solution`, `photo_caption`, `quote`, `quote_role`, `status_label`, `sort_order`, `published`, `created_at`, `updated_at`) VALUES
  ('dev-project-1', 'PT Contoh Logistik', 'Gudang distribusi, Cikarang', 2025, 'security', 'Sistem keamanan', 'Access control dan CCTV, gudang Cikarang', 'Akses per zona sudah jalan, rekaman bongkar muat mudah dicari.', 'Kepala operasional', 'Berjalan', 1, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('dev-project-2', 'PT Contoh Properti', 'Gedung kantor, Jakarta Selatan', 2025, 'multi', 'Keamanan dan Spaces', 'Visitor management dan Spaces, kantor Jakarta Selatan', 'Tamu tidak antre lagi, ruang meeting tidak pernah bentrok.', 'General affairs', 'Berjalan', 2, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('dev-project-3', 'PT Contoh Manufaktur', 'Pabrik, Tangerang', 2026, 'erp', 'Sistem ERP', 'ERP inventory dan accounting, pabrik Tangerang', 'Stok gudang dan laporan keuangan sekarang dari satu data.', 'Finance manager', 'Berjalan', 3, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');

INSERT INTO `project_items` (`id`, `project_id`, `label`, `quantity`, `sort_order`) VALUES
  ('dev-item-1a', 'dev-project-1', 'Reader face recognition', '12', 1),
  ('dev-item-1b', 'dev-project-1', 'Kamera IP', '24', 2),
  ('dev-item-1c', 'dev-project-1', 'NVR dan software VMS', '1', 3),
  ('dev-item-2a', 'dev-project-2', 'Kiosk check-in tamu', '2', 1),
  ('dev-item-2b', 'dev-project-2', 'Tablet ruang meeting', '14', 2),
  ('dev-item-2c', 'dev-project-2', 'Reader kartu lift', '6', 3),
  ('dev-item-3a', 'dev-project-3', 'Modul inventory dan accounting', '2', 1),
  ('dev-item-3b', 'dev-project-3', 'Scanner barcode', '30', 2),
  ('dev-item-3c', 'dev-project-3', 'Pengguna aktif', '85', 3);

UPDATE `roadmap_items` SET `published` = 1;
UPDATE `settings` SET `value` = '6281200000000' WHERE `key` = 'whatsapp_number';
UPDATE `settings` SET `value` = 'halo@worksell.id' WHERE `key` = 'contact_email';
