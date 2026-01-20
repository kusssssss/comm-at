CREATE TABLE `cipher_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`cipherAuditAction` enum('enrollment_started','enrollment_completed','login_success','login_failed','device_bound','device_changed','recovery_code_used','recovery_codes_regenerated','account_locked','account_unlocked','layer_changed','reputation_changed') NOT NULL,
	`details` text,
	`ipAddress` varchar(64),
	`userAgent` text,
	`deviceFingerprint` varchar(255),
	`success` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cipher_audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invite_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`inviteCodeStatus` enum('active','used','expired','revoked') NOT NULL DEFAULT 'active',
	`markState` enum('outside','initiate','member','inner_circle','dormant','restricted','revoked') NOT NULL DEFAULT 'initiate',
	`expiresAt` timestamp,
	`usedByUserId` int,
	`usedAt` timestamp,
	`createdById` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invite_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `invite_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `recovery_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`codeHash` varchar(255) NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recovery_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drops` ADD `markState` enum('outside','initiate','member','inner_circle','dormant','restricted','revoked') DEFAULT 'outside' NOT NULL;--> statement-breakpoint
ALTER TABLE `drops` ADD `attendanceLockEventId` int;--> statement-breakpoint
ALTER TABLE `events` ADD `timeRevealHoursBefore` int DEFAULT 48 NOT NULL;--> statement-breakpoint
ALTER TABLE `events` ADD `category` varchar(64) DEFAULT 'community';--> statement-breakpoint
ALTER TABLE `users` ADD `cipherSeed` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `cipherEnrolledAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `deviceFingerprint` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `deviceBoundAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `failedCipherAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `cipherLockedUntil` timestamp;