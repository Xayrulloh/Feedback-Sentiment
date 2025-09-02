CREATE TYPE "public"."sentiment" AS ENUM('negative', 'neutral', 'positive', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_error" AS ENUM('TOO_MANY_LOGIN', 'TOO_MANY_UPLOAD', 'TOO_MANY_DOWNLOAD', 'TOO_MANY_API');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_target" AS ENUM('API', 'UPLOAD', 'DOWNLOAD', 'LOGIN');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"content_hash" varchar(64) NOT NULL,
	"content" text NOT NULL,
	"sentiment" "sentiment" NOT NULL,
	"confidence" integer NOT NULL,
	"summary" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "feedbacks_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size" bigint NOT NULL,
	"row_count" integer,
	"extension" varchar(50) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"target" "rate_limit_target" NOT NULL,
	"limit" integer NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "rate_limits_target_unique" UNIQUE("target")
);
--> statement-breakpoint
CREATE TABLE "suspicious_activity" (
	"user_id" uuid,
	"email" varchar(255),
	"ip" varchar(45),
	"action" "rate_limit_target" NOT NULL,
	"error" "rate_limit_error" NOT NULL,
	"details" text,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users_feedbacks" (
	"user_id" uuid NOT NULL,
	"feedback_id" uuid NOT NULL,
	"file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pk_users_feedbacks" PRIMARY KEY("user_id","feedback_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspicious_activity" ADD CONSTRAINT "suspicious_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "users_feedbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "users_feedbacks_feedback_id_feedbacks_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedbacks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users_feedbacks" ADD CONSTRAINT "users_feedbacks_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_feedbacks_feedback_id" ON "users_feedbacks" USING btree ("feedback_id");--> statement-breakpoint
CREATE INDEX "idx_users_feedbacks_file_id" ON "users_feedbacks" USING btree ("file_id");