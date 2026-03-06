DROP INDEX "venue_facility_venue_id_facility_id_index";--> statement-breakpoint
ALTER TABLE "venue_facility" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "venue_facility" ADD CONSTRAINT "venue_facility_venueId_facilityId_unique" UNIQUE("venue_id","facility_id");