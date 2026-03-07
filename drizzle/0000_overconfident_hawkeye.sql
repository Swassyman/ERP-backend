CREATE TYPE "public"."managed_entity_type" AS ENUM('organization', 'venue');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('admin', 'end_user');--> statement-breakpoint
CREATE TYPE "public"."venue_access_level" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "facility" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "facility_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "managed_entity" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "managed_entity_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"managed_entity_type" "managed_entity_type" NOT NULL,
	"ref_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"organization_type_id" smallint NOT NULL,
	"parent_organization_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organization_type" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "organization_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "organization_type_allowed_parent" (
	"child_type_id" smallint NOT NULL,
	"parent_type_id" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_type_allowed_parent_child_type_id_parent_type_id_pk" PRIMARY KEY("child_type_id","parent_type_id")
);
--> statement-breakpoint
CREATE TABLE "permission" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "permission_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"code" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "permission_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "role" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"managed_entity_type" "managed_entity_type" NOT NULL,
	"type_ref_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "role_permission_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"permission_id" integer NOT NULL,
	"role_id" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_permission_roleId_permissionId_unique" UNIQUE("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"type" "user_type" NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "email_check" CHECK ("user"."email" LIKE '%@tkmce.ac.in')
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_role_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"role_id" smallint NOT NULL,
	"managed_entity_id" bigint NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
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
	CONSTRAINT "venue_facility_venueId_facilityId_unique" UNIQUE("venue_id","facility_id")
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
ALTER TABLE "organization" ADD CONSTRAINT "organization_organization_type_id_organization_type_id_fk" FOREIGN KEY ("organization_type_id") REFERENCES "public"."organization_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_parent_organization_id_organization_id_fk" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_type_allowed_parent" ADD CONSTRAINT "organization_type_allowed_parent_child_type_id_organization_type_id_fk" FOREIGN KEY ("child_type_id") REFERENCES "public"."organization_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_type_allowed_parent" ADD CONSTRAINT "organization_type_allowed_parent_parent_type_id_organization_type_id_fk" FOREIGN KEY ("parent_type_id") REFERENCES "public"."organization_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_permission_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_managed_entity_id_managed_entity_id_fk" FOREIGN KEY ("managed_entity_id") REFERENCES "public"."managed_entity"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_venue_type_id_venue_type_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."venue_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue" ADD CONSTRAINT "venue_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_facility" ADD CONSTRAINT "venue_facility_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_facility" ADD CONSTRAINT "venue_facility_facility_id_facility_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facility"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "facility_name_index" ON "facility" USING btree ("name") WHERE "facility"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "managed_entity_managed_entity_type_ref_id_index" ON "managed_entity" USING btree ("managed_entity_type","ref_id") WHERE "managed_entity"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_name_index" ON "organization" USING btree ("name") WHERE "organization"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "organization_type_name_index" ON "organization_type" USING btree ("name") WHERE "organization_type"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "role_name_managed_entity_type_type_ref_id_index" ON "role" USING btree ("name","managed_entity_type","type_ref_id") WHERE "role"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_index" ON "user" USING btree ("email") WHERE "user"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_user_id_role_id_managed_entity_id_index" ON "user_role" USING btree ("user_id","role_id","managed_entity_id") WHERE "user_role"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "venue_name_index" ON "venue" USING btree ("name") WHERE "venue"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "venue_type_name_index" ON "venue_type" USING btree ("name") WHERE "venue_type"."deleted_at" is null;