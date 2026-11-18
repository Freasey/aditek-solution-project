-- Konten contoh untuk production, sesuai design/home-coral-dark.html (branch plan).
-- Dijalankan sekali atas permintaan pemilik. Ganti dengan proyek dan testimoni asli lewat /admin/projects.
-- Aman dijalankan ulang (INSERT OR IGNORE).
INSERT OR IGNORE INTO `projects` (`id`, `client_name`, `location`, `year`, `system`, `solution`, `photo_caption`, `quote`, `quote_role`, `status_label`, `sort_order`, `published`, `created_at`, `updated_at`) VALUES
  ('sample-project-1', 'PT Contoh Logistik', 'Gudang distribusi, Cikarang', 2025, 'security', 'Sistem keamanan', 'Access control dan CCTV, gudang Cikarang', 'Akses per zona sudah jalan, rekaman bongkar muat mudah dicari.', 'Kepala operasional', 'Berjalan', 1, 1, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z'),
  ('sample-project-2', 'PT Contoh Properti', 'Gedung kantor, Jakarta Selatan', 2025, 'multi', 'Keamanan dan Spaces', 'Visitor management dan Spaces, kantor Jakarta Selatan', 'Tamu tidak antre lagi, ruang meeting tidak pernah bentrok.', 'General affairs', 'Berjalan', 2, 1, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z'),
  ('sample-project-3', 'PT Contoh Manufaktur', 'Pabrik, Tangerang', 2026, 'erp', 'Sistem ERP', 'ERP inventory dan accounting, pabrik Tangerang', 'Stok gudang dan laporan keuangan sekarang dari satu data.', 'Finance manager', 'Berjalan', 3, 1, '2026-11-18T00:00:00.000Z', '2026-11-18T00:00:00.000Z');

INSERT OR IGNORE INTO `project_items` (`id`, `project_id`, `label`, `quantity`, `sort_order`) VALUES
  ('sample-item-1a', 'sample-project-1', 'Reader face recognition', '12', 1),
  ('sample-item-1b', 'sample-project-1', 'Kamera IP', '24', 2),
  ('sample-item-1c', 'sample-project-1', 'NVR dan software VMS', '1', 3),
  ('sample-item-2a', 'sample-project-2', 'Kiosk check-in tamu', '2', 1),
  ('sample-item-2b', 'sample-project-2', 'Tablet ruang meeting', '14', 2),
  ('sample-item-2c', 'sample-project-2', 'Reader kartu lift', '6', 3),
  ('sample-item-3a', 'sample-project-3', 'Modul inventory dan accounting', '2', 1),
  ('sample-item-3b', 'sample-project-3', 'Scanner barcode', '30', 2),
  ('sample-item-3c', 'sample-project-3', 'Pengguna aktif', '85', 3);

-- Empat item "Sedang kami kembangkan" dari desain ditampilkan.
UPDATE `roadmap_items` SET `published` = 1, `updated_at` = '2026-11-18T00:00:00.000Z' WHERE `published` = 0;
