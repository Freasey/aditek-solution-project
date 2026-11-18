-- Penyimpanan foto khusus development lokal (dipakai bila BLOB_READ_WRITE_TOKEN kosong).
-- JANGAN dijalankan ke database production.
CREATE TABLE IF NOT EXISTS `dev_blobs` (
  `pathname` text PRIMARY KEY NOT NULL,
  `content_type` text NOT NULL,
  `data` blob NOT NULL
);
