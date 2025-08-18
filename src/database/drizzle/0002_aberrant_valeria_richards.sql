ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_folder_id_folders_id_fk";
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_user_id_users_id_fk";
