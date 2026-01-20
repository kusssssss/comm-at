ALTER TABLE `events` ADD `tagline` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `eventAccessType` enum('invite_only','members_only','open') DEFAULT 'members_only' NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `eventSecretLevel` enum('low','medium','high') DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `events` ADD `area` varchar(128);--> statement-breakpoint
ALTER TABLE `events` ADD `venueName` varchar(255);--> statement-breakpoint
ALTER TABLE `events` ADD `venueAddress` text;--> statement-breakpoint
ALTER TABLE `events` ADD `coordinates` varchar(64);--> statement-breakpoint
ALTER TABLE `events` ADD `coverImageUrl` text;--> statement-breakpoint
ALTER TABLE `events` ADD `tags` text;--> statement-breakpoint
ALTER TABLE `events` ADD `featuredOrder` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `events` ADD `createdBy` int;