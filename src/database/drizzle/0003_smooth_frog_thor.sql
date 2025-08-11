ALTER TABLE "folders" RENAME TO "files";--> statement-breakpoint
ALTER TABLE "feedbacks" RENAME COLUMN "folder_id" TO "file_id";--> statement-breakpoint
ALTER TABLE "feedbacks" ALTER COLUMN "sentiment" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbacks" ALTER COLUMN "confidence" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "feedbacks" ALTER COLUMN "summary" SET NOT NULL;