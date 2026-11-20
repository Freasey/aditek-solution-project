-- Menambah layanan Digital Marketing (slug 'marketing') ke CHECK constraint projects dan systems.
-- SQLite tidak bisa mengubah CHECK, jadi kedua tabel dibuat ulang.
-- D1 selalu menegakkan foreign key (PRAGMA foreign_keys=OFF diabaikan), sehingga DROP TABLE projects
-- akan menghapus project_items lewat ON DELETE CASCADE. Karena itu project_items dicadangkan dulu
-- lalu dikembalikan.
CREATE TABLE `__backup_project_items` AS SELECT * FROM `project_items`;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`client_name` text NOT NULL,
	`location` text NOT NULL,
	`year` integer NOT NULL,
	`system` text NOT NULL,
	`solution` text NOT NULL,
	`photo_id` text,
	`photo_caption` text,
	`quote` text,
	`quote_role` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "projects_system_check" CHECK("system" IN ('security','erp','spaces','marketing','multi'))
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "client_name", "location", "year", "system", "solution", "photo_id", "photo_caption", "quote", "quote_role", "sort_order", "published", "created_at", "updated_at") SELECT "id", "client_name", "location", "year", "system", "solution", "photo_id", "photo_caption", "quote", "quote_role", "sort_order", "published", "created_at", "updated_at" FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
INSERT OR IGNORE INTO `project_items`("id", "project_id", "label", "sort_order") SELECT "id", "project_id", "label", "sort_order" FROM `__backup_project_items`;--> statement-breakpoint
DROP TABLE `__backup_project_items`;--> statement-breakpoint
CREATE TABLE `__new_systems` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`cta_label` text NOT NULL,
	`page_path` text NOT NULL,
	`photo_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "systems_slug_check" CHECK("slug" IN ('security','erp','spaces','marketing'))
);
--> statement-breakpoint
INSERT INTO `__new_systems`("slug", "title", "summary", "cta_label", "page_path", "photo_id", "sort_order", "updated_at") SELECT "slug", "title", "summary", "cta_label", "page_path", "photo_id", "sort_order", "updated_at" FROM `systems`;--> statement-breakpoint
DROP TABLE `systems`;--> statement-breakpoint
ALTER TABLE `__new_systems` RENAME TO `systems`;--> statement-breakpoint
INSERT OR IGNORE INTO `systems` (`slug`, `title`, `summary`, `cta_label`, `page_path`, `sort_order`, `updated_at`) VALUES
  ('marketing', 'Digital Marketing', 'Branding, website, SEO, dan Google Ads supaya calon pelanggan menemukan Anda.', 'Konsultasikan digital marketing', '/digital-marketing', 4, '2026-11-20T00:00:00.000Z');
