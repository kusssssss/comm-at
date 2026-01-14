CREATE TABLE `artifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dropId` int NOT NULL,
	`serialNumber` varchar(64) NOT NULL,
	`activationCodeHash` varchar(255) NOT NULL,
	`artifactStatus` enum('unmarked','marked','flagged') NOT NULL DEFAULT 'unmarked',
	`markedByUserId` int,
	`markedAt` timestamp,
	`flagReason` text,
	`flaggedAt` timestamp,
	`flaggedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `artifacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `artifacts_serialNumber_unique` UNIQUE(`serialNumber`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditAction` enum('drop_created','drop_published','drop_archived','artifacts_generated','artifact_flagged','artifact_reissued','event_created','event_published','event_cancelled','pass_revoked','user_revoked','user_banned','user_role_changed') NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`targetType` varchar(64),
	`targetId` int,
	`targetIdentifier` varchar(128),
	`description` text,
	`previousValue` text,
	`newValue` text,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `check_in_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`eventPassId` int,
	`scannedByUserId` int NOT NULL,
	`checkInResult` enum('accepted','rejected') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `check_in_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `doctrine_cards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`isPinned` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `doctrine_cards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `drops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artistName` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`editionSize` int NOT NULL,
	`dropStatus` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `drops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event_passes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` int NOT NULL,
	`userId` int NOT NULL,
	`passStatus` enum('claimed','used','revoked') NOT NULL DEFAULT 'claimed',
	`qrPayload` varchar(128) NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	`usedAt` timestamp,
	`revokedAt` timestamp,
	`revokedReason` text,
	`revokedById` int,
	CONSTRAINT `event_passes_id` PRIMARY KEY(`id`),
	CONSTRAINT `event_passes_qrPayload_unique` UNIQUE(`qrPayload`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`city` varchar(128) NOT NULL DEFAULT 'South Jakarta',
	`description` text,
	`rules` text,
	`capacity` int NOT NULL,
	`userRole` enum('public','marked_initiate','marked_member','marked_inner_circle','staff','admin') NOT NULL DEFAULT 'marked_initiate',
	`locationText` text,
	`locationRevealAt` timestamp,
	`eventDate` timestamp,
	`eventStatus` enum('draft','published','completed','cancelled') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marking_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artifactId` int NOT NULL,
	`userId` int,
	`markingResult` enum('success','failed') NOT NULL,
	`failureReason` text,
	`ipAddress` varchar(64),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marking_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phoneNumber` varchar(32) NOT NULL,
	`code` varchar(6) NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`action` varchar(64) NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`windowStart` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`phoneNumber` varchar(32),
	`userRole` enum('public','marked_initiate','marked_member','marked_inner_circle','staff','admin') NOT NULL DEFAULT 'public',
	`callSign` varchar(64),
	`chapter` varchar(128) DEFAULT 'South Jakarta',
	`userStatus` enum('active','revoked','banned') NOT NULL DEFAULT 'active',
	`revokedReason` text,
	`revokedAt` timestamp,
	`revokedById` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`),
	CONSTRAINT `users_phoneNumber_unique` UNIQUE(`phoneNumber`),
	CONSTRAINT `users_callSign_unique` UNIQUE(`callSign`)
);
