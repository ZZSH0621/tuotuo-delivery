CREATE TABLE `api_attempt_windows` (
	`site_id` text NOT NULL,
	`user_id` text NOT NULL,
	`window_start_ms` integer NOT NULL,
	`attempts` integer NOT NULL,
	PRIMARY KEY(`site_id`, `user_id`, `window_start_ms`),
	CONSTRAINT "attempts_positive" CHECK("api_attempt_windows"."attempts">0),
	CONSTRAINT "window_nonnegative" CHECK("api_attempt_windows"."window_start_ms">=0)
);
--> statement-breakpoint
CREATE TABLE `api_cost_reservations` (
	`site_id` text NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text NOT NULL,
	`budget_period_start_ms` integer NOT NULL,
	`max_cost_micros` integer NOT NULL,
	`created_at_ms` integer NOT NULL,
	PRIMARY KEY(`site_id`, `user_id`, `request_id`),
	CONSTRAINT "cost_positive" CHECK("api_cost_reservations"."max_cost_micros">0),
	CONSTRAINT "period_nonnegative" CHECK("api_cost_reservations"."budget_period_start_ms">=0),
	CONSTRAINT "created_nonnegative" CHECK("api_cost_reservations"."created_at_ms">=0)
);
--> statement-breakpoint
CREATE INDEX `api_cost_reservations_period` ON `api_cost_reservations` (`site_id`,`user_id`,`budget_period_start_ms`);