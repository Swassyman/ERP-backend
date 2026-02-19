CREATE TYPE "public"."organization_type" AS ENUM('department', 'club', 'institution');--> statement-breakpoint
CREATE TABLE "user" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"deleted_at" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
