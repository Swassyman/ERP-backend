CREATE TYPE "public"."event_organizer_invitation_status" AS ENUM('pending', 'accepted', 'rejected', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."event_organizer_role" AS ENUM('host', 'co_host');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'awaiting_approval', 'cancelled', 'overridden', 'completed');--> statement-breakpoint
CREATE TYPE "public"."password_token_type" AS ENUM('INITIAL_SETUP', 'PASSWORD_RESET');--> statement-breakpoint
CREATE TYPE "public"."workflow_instance_status" AS ENUM('pending', 'approved', 'rejected', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."workflow_instance_step_status" AS ENUM('approved', 'rejected', 'skipped', 'pending');--> statement-breakpoint
CREATE TABLE "event" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_title" text NOT NULL,
	"event_type_id" smallint NOT NULL,
	"expected_participants" integer NOT NULL,
	"request_details" text NOT NULL,
	"status" "event_status" NOT NULL,
	"parent_event_id" bigint,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chk_event__ends_after_starts" CHECK ("event"."ends_at" > "event"."starts_at"),
	CONSTRAINT "chk_event__min_participants" CHECK ("event"."expected_participants">0),
	CONSTRAINT "chk_event__unique_to_program" CHECK ("event"."parent_event_id" IS NULL OR "event"."parent_event_id" != "event"."id")
);
--> statement-breakpoint
CREATE TABLE "event_organizer" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_organizer_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" bigint NOT NULL,
	"organization_id" integer NOT NULL,
	"role" "event_organizer_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_organizer_invitation" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_organizer_invitation_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" bigint NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now(),
	"invited_by_user_id" bigint NOT NULL,
	"sender_organization_id" integer NOT NULL,
	"recipient_organization_id" integer NOT NULL,
	"responded_by_user_id" bigint,
	"status" "event_organizer_invitation_status" DEFAULT 'pending' NOT NULL,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chk_event_organizer_invitation__to_self" CHECK ("event_organizer_invitation"."sender_organization_id" !="event_organizer_invitation"."recipient_organization_id"),
	CONSTRAINT "chk_event_organizer_invitation__status_update" CHECK (
			("event_organizer_invitation"."status" = 'pending' AND "event_organizer_invitation"."closed_at" is NULL)
			OR
			("event_organizer_invitation"."status" IN ('accepted', 'rejected', 'revoked', 'expired') AND "event_organizer_invitation"."closed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "event_report" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_report_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" bigint NOT NULL,
	"details" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_report_eventId_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "event_type" (
	"id" smallint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_type_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 32767 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"workflow_template_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "event_type_allowed_parent" (
	"child_type_id" smallint NOT NULL,
	"parent_type_id" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_type_allowed_parent_child_type_id_parent_type_id_pk" PRIMARY KEY("child_type_id","parent_type_id")
);
--> statement-breakpoint
CREATE TABLE "user_password_token" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "user_password_token_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"token_hash" text NOT NULL,
	"type" "password_token_type" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "venue_allotment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "venue_allotment_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"venue_id" integer NOT NULL,
	"event_id" bigint NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "chk_venue_allotment__ends_after_starts" CHECK ("venue_allotment"."ends_at" > "venue_allotment"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "workflow_instance" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workflow_instance_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"event_id" bigint NOT NULL,
	"initial_step_id" integer,
	"initiated_on" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "workflow_instance_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_instance_initialStepId_unique" UNIQUE("initial_step_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_instance_step" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workflow_instance_step_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"workflow_instance_id" bigint NOT NULL,
	"role_id" smallint NOT NULL,
	"next_step_id" bigint,
	"handled_by_user_role_id" bigint NOT NULL,
	"status" "workflow_instance_step_status" NOT NULL,
	"remarks" text,
	"handled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_instance_step_workflowInstanceId_nextStepId_unique" UNIQUE("workflow_instance_id","next_step_id"),
	CONSTRAINT "chk_workflow_instance_step__circular_reference" CHECK ("workflow_instance_step"."id"!="workflow_instance_step"."next_step_id")
);
--> statement-breakpoint
CREATE TABLE "workflow_template" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workflow_template_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"initial_step_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workflow_template_step" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "workflow_template_step_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workflow_template_id" integer NOT NULL,
	"role_id" smallint NOT NULL,
	"next_step_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chk_workflow_template_step__circular_reference" CHECK ("workflow_template_step"."id"!="workflow_template_step"."next_step_id")
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_event_type_id_event_type_id_fk" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_parent_event_id_event_id_fk" FOREIGN KEY ("parent_event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer" ADD CONSTRAINT "event_organizer_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer" ADD CONSTRAINT "event_organizer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer_invitation" ADD CONSTRAINT "event_organizer_invitation_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer_invitation" ADD CONSTRAINT "event_organizer_invitation_invited_by_user_id_user_role_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer_invitation" ADD CONSTRAINT "event_organizer_invitation_sender_organization_id_organization_id_fk" FOREIGN KEY ("sender_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer_invitation" ADD CONSTRAINT "event_organizer_invitation_recipient_organization_id_organization_id_fk" FOREIGN KEY ("recipient_organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_organizer_invitation" ADD CONSTRAINT "event_organizer_invitation_responded_by_user_id_user_role_id_fk" FOREIGN KEY ("responded_by_user_id") REFERENCES "public"."user_role"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_report" ADD CONSTRAINT "event_report_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_type" ADD CONSTRAINT "event_type_workflow_template_id_workflow_template_id_fk" FOREIGN KEY ("workflow_template_id") REFERENCES "public"."workflow_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_type_allowed_parent" ADD CONSTRAINT "event_type_allowed_parent_child_type_id_event_type_id_fk" FOREIGN KEY ("child_type_id") REFERENCES "public"."event_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_type_allowed_parent" ADD CONSTRAINT "event_type_allowed_parent_parent_type_id_event_type_id_fk" FOREIGN KEY ("parent_type_id") REFERENCES "public"."event_type"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_password_token" ADD CONSTRAINT "user_password_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_allotment" ADD CONSTRAINT "venue_allotment_venue_id_venue_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_allotment" ADD CONSTRAINT "venue_allotment_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instance" ADD CONSTRAINT "workflow_instance_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instance" ADD CONSTRAINT "workflow_instance_initial_step_id_workflow_instance_step_id_fk" FOREIGN KEY ("initial_step_id") REFERENCES "public"."workflow_instance_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instance_step" ADD CONSTRAINT "workflow_instance_step_workflow_instance_id_workflow_instance_id_fk" FOREIGN KEY ("workflow_instance_id") REFERENCES "public"."workflow_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instance_step" ADD CONSTRAINT "workflow_instance_step_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instance_step" ADD CONSTRAINT "workflow_instance_step_next_step_id_workflow_instance_step_id_fk" FOREIGN KEY ("next_step_id") REFERENCES "public"."workflow_instance_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_instance_step" ADD CONSTRAINT "workflow_instance_step_handled_by_user_role_id_user_role_id_fk" FOREIGN KEY ("handled_by_user_role_id") REFERENCES "public"."user_role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template" ADD CONSTRAINT "workflow_template_initial_step_id_workflow_template_step_id_fk" FOREIGN KEY ("initial_step_id") REFERENCES "public"."workflow_template_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template_step" ADD CONSTRAINT "workflow_template_step_workflow_template_id_workflow_template_id_fk" FOREIGN KEY ("workflow_template_id") REFERENCES "public"."workflow_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template_step" ADD CONSTRAINT "workflow_template_step_role_id_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."role"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_template_step" ADD CONSTRAINT "workflow_template_step_next_step_id_workflow_template_step_id_fk" FOREIGN KEY ("next_step_id") REFERENCES "public"."workflow_template_step"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_organizer_event_id_organization_id_index" ON "event_organizer" USING btree ("event_id","organization_id") WHERE "event_organizer"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "event_organizer_invitation_event_id_recipient_organization_id_index" ON "event_organizer_invitation" USING btree ("event_id","recipient_organization_id") WHERE "event_organizer_invitation"."closed_at" IS NULL AND "event_organizer_invitation"."deleted_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "event_type_name_index" ON "event_type" USING btree ("name") WHERE "event_type"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "user_password_token_token_hash_index" ON "user_password_token" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "user_password_token_user_id_type_index" ON "user_password_token" USING btree ("user_id","type") WHERE "user_password_token"."used_at" IS NULL AND "user_password_token"."expires_at" > now();--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_instance_event_id_index" ON "workflow_instance" USING btree ("event_id") WHERE "workflow_instance"."status"='pending';--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_template_initial_step_id_index" ON "workflow_template" USING btree ("initial_step_id") WHERE "workflow_template"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_template_name_index" ON "workflow_template" USING btree ("name") WHERE "workflow_template"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_template_step_workflow_template_id_next_step_id_index" ON "workflow_template_step" USING btree ("workflow_template_id","next_step_id") WHERE "workflow_template_step"."next_step_id" IS NOT NULL;