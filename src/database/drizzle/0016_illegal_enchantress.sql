ALTER TABLE "users_feedbacks" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "workspace_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_files_workspace_id" ON "files" USING btree ("workspace_id");