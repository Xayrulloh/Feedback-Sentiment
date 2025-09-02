ALTER TABLE "users_feedbacks" DROP CONSTRAINT "pk_users_feedbacks";
--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "pk_users_feedbacks" PRIMARY KEY("user_id","feedback_id");