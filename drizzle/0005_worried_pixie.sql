ALTER TABLE "user" DROP CONSTRAINT "email_check";--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "email_check" CHECK ("user"."email" LIKE '%@tkmce.ac.in);