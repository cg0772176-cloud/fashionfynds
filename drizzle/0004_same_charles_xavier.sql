ALTER TABLE `brands` ADD `subscription_tier` text DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE `brands` ADD `subscription_expires_at` text;--> statement-breakpoint
ALTER TABLE `brands` ADD `commission_rate` real DEFAULT 15;--> statement-breakpoint
ALTER TABLE `brands` ADD `status` text DEFAULT 'pending';