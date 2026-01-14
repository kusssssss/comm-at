ALTER TABLE `ugc_media` MODIFY COLUMN `caption` varchar(140);--> statement-breakpoint
ALTER TABLE `ugc_media` ADD `ugcModerationStatus` enum('pending','approved','rejected') DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE `ugc_media` ADD `rejectionReason` varchar(255);--> statement-breakpoint
ALTER TABLE `ugc_media` ADD `holderCallsign` varchar(64);--> statement-breakpoint
ALTER TABLE `ugc_media` ADD `chapter` varchar(64);