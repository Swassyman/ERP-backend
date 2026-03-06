CREATE TYPE "public"."venue_access_level" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "facility" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "facility_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "venue" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "venue_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"venue_type_id" smallint NOT NULL,
	"organization_id" integer,
	"access_level" "venue_access_level" NOT NULL,
	"is_available" boolean NOT NULL,
	"unavailability_reason" text,
	"max_capacity" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "venue_facility" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "venue_facility_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"venue_id" integer NOT NULL,
	"facility_id" smallint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "venue_type" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "venue_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_venue_type_id_venue_type_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."venue_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_facility" ADD CONSTRAINT "venue_facility_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_facility" ADD CONSTRAINT "venue_facility_facility_id_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "facility_name_index" ON "facility" USING btree ("name") WHERE "facility"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "venue_name_index" ON "venue" USING btree ("name") WHERE "venue"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "venue_facility_venue_id_facility_id_index" ON "venue_facility" USING btree ("venue_id","facility_id") WHERE "venue_facility"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "venue_type_name_index" ON "venue_type" USING btree ("name") WHERE "venue_type"."deleted_at" is null;