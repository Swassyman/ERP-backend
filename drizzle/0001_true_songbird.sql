DROP INDEX "role_code_index";--> statement-breakpoint
ALTER TABLE "role" ADD COLUMN "type_ref_id" integer NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "role_name_managed_entity_type_type_ref_id_index" ON "role" USING btree ("name","managed_entity_type","type_ref_id") WHERE "role"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "role_code_managed_entity_type_type_ref_id_index" ON "role" USING btree ("code","managed_entity_type","type_ref_id") WHERE "role"."deleted_at" is null;