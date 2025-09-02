ALTER TABLE "users_feedbacks" DROP CONSTRAINT "pk_users_feedbacks";--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD COLUMN "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_users_feedbacks_user_id" ON "users_feedbacks" USING btree ("user_id");