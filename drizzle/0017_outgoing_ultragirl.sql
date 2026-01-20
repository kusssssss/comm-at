ALTER TABLE `event_rsvps` MODIFY COLUMN `status` enum('pending','approved','denied','waitlisted','confirmed','cancelled','attended','no_show') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `event_rsvps` ADD `requestMessage` text;--> statement-breakpoint
ALTER TABLE `event_rsvps` ADD `adminResponse` text;--> statement-breakpoint
ALTER TABLE `event_rsvps` ADD `respondedById` int;--> statement-breakpoint
ALTER TABLE `event_rsvps` ADD `respondedAt` timestamp;