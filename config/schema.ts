import { sql } from "drizzle-orm";
import { boolean, date, integer, pgEnum, pgTable, PgVarchar, timestamp, varchar } from "drizzle-orm/pg-core";

// Enums

export const organizationTypeEnum = pgEnum("organizationType", [
  "Department",
  "Club",
  "Institution",
]);

// Common fields
export const commonFields = {
  createdAt: timestamp({ mode: "string", withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string", withTimezone: true })
    .defaultNow()
    .$onUpdate(() => sql`now()`)
    .notNull(),
};

// Tables

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  full_name: varchar().notNull(),
  email: varchar().notNull().unique(),
  password_hash: varchar().notNull(),
  is_active: boolean(),
  deleted_at: date(),
});
