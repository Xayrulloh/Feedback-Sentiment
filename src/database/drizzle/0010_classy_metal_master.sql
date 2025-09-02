ALTER TABLE "files" DROP CONSTRAINT "files_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_feedbacks" DROP CONSTRAINT "users_feedbacks_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users_feedbacks" DROP CONSTRAINT "users_feedbacks_feedback_id_feedbacks_id_fk";
--> statement-breakpoint
DROP INDEX "idx_users_feedbacks_file_id";