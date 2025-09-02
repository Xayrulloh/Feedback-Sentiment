CREATE TABLE "users_feedbacks" (
	"user_id" uuid NOT NULL,
	"feedback_id" uuid NOT NULL,
	"file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_users_feedbacks" PRIMARY KEY("user_id","feedback_id")
);
--> statement-breakpoint
ALTER TABLE "feedbacks" DROP CONSTRAINT "feedbacks_file_id_files_id_fk";
--> statement-breakpoint
ALTER TABLE "feedbacks" ADD COLUMN "content_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "users_feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "users_feedbacks_feedback_id_feedbacks_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "users_feedbacks_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_feedbacks_feedback_id" ON "users_feedbacks" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "idx_users_feedbacks_file_id" ON "users_feedbacks" USING btree ("file_id");--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "feedbacks" DROP COLUMN "file_id";--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_content_hash_unique" UNIQUE("content_hash");