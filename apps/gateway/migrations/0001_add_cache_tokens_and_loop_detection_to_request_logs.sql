ALTER TABLE `request_logs` ADD `user_prompt_hash` text;--> statement-breakpoint
ALTER TABLE `request_logs` ADD `is_repeated_loop` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `request_logs` ADD `cache_read_input_tokens` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `request_logs` ADD `cache_creation_input_tokens` integer DEFAULT 0 NOT NULL;