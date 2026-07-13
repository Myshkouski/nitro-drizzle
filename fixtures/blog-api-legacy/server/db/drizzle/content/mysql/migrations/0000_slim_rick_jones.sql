CREATE TABLE `posts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`image` text NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`authors` json NOT NULL DEFAULT ('[]'),
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`post_id` int NOT NULL,
	`author_id` int NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp NOT NULL,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
