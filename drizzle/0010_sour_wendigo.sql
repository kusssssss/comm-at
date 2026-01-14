ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_openId_unique` UNIQUE(`openId`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `passwordHash`;