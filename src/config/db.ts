import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (typeof DATABASE_URL !== "string" || DATABASE_URL.trim().length === 0) {
	throw new Error("DATABASE_URL must be set");
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, {
	schema: schema,
	casing: "snake_case",
});

export { db, schema };
