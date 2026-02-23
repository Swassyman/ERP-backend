import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (typeof DATABASE_URL !== "string" || DATABASE_URL.trim().length === 0) {
	throw new Error("DATABASE_URL must be set");
}

const neonClient = neon(DATABASE_URL);
export const db = drizzle(neonClient, {
	schema: schema,
	casing: "snake_case",
});
