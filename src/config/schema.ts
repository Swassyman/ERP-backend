import { sql } from "drizzle-orm";
import {
    boolean,
    date,
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

// Enums

export const organizationTypeEnum = pgEnum("organization_type", [
    "department",
    "club",
    "institution",
]);

// Common fields
const commonFields = {
    createdAt: timestamp({ mode: "string", withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp({ mode: "string", withTimezone: true })
        .defaultNow()
        .$onUpdate(() => sql`now()`)
        .notNull(),
};

// Tables

export const user = pgTable("user", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fullName: text().notNull(),
    email: text().notNull().unique(),
    password_hash: text().notNull(),
    is_active: boolean().default(true),
    deleted_at: date(),
    ...commonFields,
});
