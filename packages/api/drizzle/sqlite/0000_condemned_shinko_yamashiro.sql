CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`note_type` text DEFAULT 'other' NOT NULL,
	`source_type` text DEFAULT 'manual' NOT NULL,
	`source_name` text,
	`source_url` text,
	`philosopher_id` text,
	`work_id` text,
	`school_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`philosopher_id`) REFERENCES `philosophers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`work_id`) REFERENCES `works`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `philosopher_influences` (
	`id` text PRIMARY KEY NOT NULL,
	`influencer_id` text NOT NULL,
	`influenced_id` text NOT NULL,
	`influence_type` text DEFAULT 'direct' NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`influencer_id`) REFERENCES `philosophers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`influenced_id`) REFERENCES `philosophers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pi_pair_type_idx` ON `philosopher_influences` (`influencer_id`,`influenced_id`,`influence_type`);--> statement-breakpoint
CREATE TABLE `philosopher_schools` (
	`id` text PRIMARY KEY NOT NULL,
	`philosopher_id` text NOT NULL,
	`school_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`philosopher_id`) REFERENCES `philosophers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ps_philosopher_school_role_idx` ON `philosopher_schools` (`philosopher_id`,`school_id`,`role`);--> statement-breakpoint
CREATE TABLE `philosophers` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`also_known_as` text,
	`born_year` integer,
	`born_year_end` integer,
	`born_certainty` text DEFAULT 'unknown' NOT NULL,
	`died_year` integer,
	`died_year_end` integer,
	`died_certainty` text DEFAULT 'unknown' NOT NULL,
	`nationality` text,
	`bio_short` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `philosophers_slug_unique` ON `philosophers` (`slug`);--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`also_known_as` text,
	`period_start_year` integer,
	`period_end_year` integer,
	`period_certainty` text DEFAULT 'unknown' NOT NULL,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_slug_unique` ON `schools` (`slug`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`original_title` text,
	`philosopher_id` text NOT NULL,
	`work_type` text DEFAULT 'other' NOT NULL,
	`composed_year` integer,
	`composed_year_end` integer,
	`composed_certainty` text DEFAULT 'unknown' NOT NULL,
	`original_language` text,
	`description_short` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`philosopher_id`) REFERENCES `philosophers`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `works_slug_unique` ON `works` (`slug`);