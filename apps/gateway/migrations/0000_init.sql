CREATE TABLE `admin_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`secret_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interview_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`key_hash` text NOT NULL,
	`candidate_name` text NOT NULL,
	`quota_type` text NOT NULL,
	`quota_limit` real NOT NULL,
	`quota_used` real DEFAULT 0 NOT NULL,
	`allowed_models` text DEFAULT '[]' NOT NULL,
	`expires_at` integer NOT NULL,
	`timezone` text DEFAULT 'UTC',
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interview_keys_key_hash_unique` ON `interview_keys` (`key_hash`);--> statement-breakpoint
CREATE TABLE `request_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`key_id` text NOT NULL,
	`protocol` text NOT NULL,
	`model` text NOT NULL,
	`user_prompt_count` integer DEFAULT 0 NOT NULL,
	`system_prompt` text,
	`user_prompt` text,
	`full_payload` text,
	`response_content` text,
	`r2_log_key` text,
	`prompt_tokens` integer DEFAULT 0 NOT NULL,
	`completion_tokens` integer DEFAULT 0 NOT NULL,
	`cost_usd` real DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`key_id`) REFERENCES `interview_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `upstream_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider_type` text NOT NULL,
	`cf_aig_provider` text,
	`api_protocol` text DEFAULT 'openai' NOT NULL,
	`base_url` text NOT NULL,
	`api_key` text NOT NULL,
	`available_models` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL
);
