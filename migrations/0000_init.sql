CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`target` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text NOT NULL,
	`systems` text NOT NULL,
	`building_type` text NOT NULL,
	`city` text NOT NULL,
	`contact_via` text NOT NULL,
	`contact_value` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'baru' NOT NULL,
	`notes` text,
	`source_path` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "leads_contact_via_check" CHECK("leads"."contact_via" IN ('whatsapp','email')),
	CONSTRAINT "leads_status_check" CHECK("leads"."status" IN ('baru','dihubungi','survei','penawaran','menang','batal'))
);
--> statement-breakpoint
CREATE INDEX `leads_created_idx` ON `leads` ("created_at" DESC);--> statement-breakpoint
CREATE INDEX `leads_status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`content_type` text NOT NULL,
	`bytes` integer NOT NULL,
	`width` integer,
	`height` integer,
	`alt` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_r2_key_unique` ON `media` (`r2_key`);--> statement-breakpoint
CREATE TABLE `project_items` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`label` text NOT NULL,
	`quantity` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
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
	`status_label` text DEFAULT 'Berjalan' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "projects_system_check" CHECK("projects"."system" IN ('security','erp','spaces','multi'))
);
--> statement-breakpoint
CREATE TABLE `roadmap_items` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`stage` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "roadmap_stage_check" CHECK("roadmap_items"."stage" IN ('perancangan','uji_coba','segera'))
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `systems` (
	`slug` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`cta_label` text NOT NULL,
	`page_path` text NOT NULL,
	`photo_id` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "systems_slug_check" CHECK("systems"."slug" IN ('security','erp','spaces'))
);
