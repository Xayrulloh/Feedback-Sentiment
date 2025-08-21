ALTER TABLE "files" ADD COLUMN "mime_type" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "size" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "row_count" integer;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "extension" varchar(50) NOT NULL;