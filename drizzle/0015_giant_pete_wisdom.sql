ALTER TABLE `event_passes` ADD `isWaitlisted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `event_passes` ADD `waitlistPosition` int;--> statement-breakpoint
ALTER TABLE `event_passes` ADD `waitlistedAt` timestamp;--> statement-breakpoint
ALTER TABLE `event_passes` ADD `promotedFromWaitlistAt` timestamp;