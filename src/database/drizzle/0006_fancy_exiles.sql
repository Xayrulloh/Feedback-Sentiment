CREATE TYPE "public"."rate_limit_duration" AS ENUM('hour', 'day');--> statement-breakpoint
CREATE TYPE "public"."rate_limit_target" AS ENUM('API', 'UPLOAD', 'DOWNLOAD', 'LOGIN');--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"target" "rate_limit_target" NOT NULL,
	"duration" "rate_limit_duration" NOT NULL,
	"limit" integer NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
