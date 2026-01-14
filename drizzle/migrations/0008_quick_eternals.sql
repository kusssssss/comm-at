CREATE TABLE `sponsor_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sponsorId` int NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`pageType` varchar(50) NOT NULL,
	`referenceId` int,
	`userId` int,
	`userAgent` text,
	`ipHash` varchar(64),
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_drops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sponsorId` int NOT NULL,
	`dropId` int NOT NULL,
	`isPrimarySponsor` boolean NOT NULL DEFAULT false,
	`customMessage` text,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_drops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sponsorId` int NOT NULL,
	`eventId` int NOT NULL,
	`isPrimarySponsor` boolean NOT NULL DEFAULT false,
	`customMessage` text,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsor_inquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(255) NOT NULL,
	`contactPhone` varchar(50),
	`sponsorTier` enum('platinum','gold','silver','bronze') NOT NULL DEFAULT 'bronze',
	`message` text,
	`status` varchar(50) NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sponsor_inquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sponsors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`logoUrl` varchar(512),
	`websiteUrl` varchar(512),
	`sponsorTier` enum('platinum','gold','silver','bronze') NOT NULL DEFAULT 'bronze',
	`sponsorStatus` enum('active','pending','expired','paused') NOT NULL DEFAULT 'pending',
	`contactName` varchar(255),
	`contactEmail` varchar(255),
	`contractStartDate` datetime,
	`contractEndDate` datetime,
	`totalImpressions` int NOT NULL DEFAULT 0,
	`totalClicks` int NOT NULL DEFAULT 0,
	`displayOrder` int NOT NULL DEFAULT 0,
	`showOnHomepage` boolean NOT NULL DEFAULT true,
	`createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sponsors_id` PRIMARY KEY(`id`),
	CONSTRAINT `sponsors_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);