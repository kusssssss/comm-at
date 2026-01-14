ALTER TABLE `artifacts` ADD `size` varchar(8);--> statement-breakpoint
ALTER TABLE `artifacts` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;