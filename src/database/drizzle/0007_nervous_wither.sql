CREATE TYPE "public"."rate_limit_error" AS ENUM('TOO_MANY_LOGIN', 'TOO_MANY_UPLOAD', 'TOO_MANY_DOWNLOAD', 'TOO_MANY_API');--> statement-breakpoint
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
ALTER TABLE "suspicious_activity" ADD CONSTRAINT "suspicious_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;