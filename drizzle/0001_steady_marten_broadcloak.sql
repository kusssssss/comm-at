CREATE TABLE `ugc_consent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ugcMediaId` int NOT NULL,
	`ugcConsentStatus` enum('granted','pending','revoked') NOT NULL DEFAULT 'granted',
	`consentNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ugc_consent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ugc_media` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ugcMediaType` enum('image','video') NOT NULL,
	`storageUrl` varchar(512) NOT NULL,
	`thumbnailUrl` varchar(512),
	`dropId` int,
	`artifactId` int,
	`caption` varchar(40),
	`ugcVisibility` enum('public','inside_only') NOT NULL DEFAULT 'public',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ugc_media_id` PRIMARY KEY(`id`)
);
