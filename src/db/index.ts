import { neon } from "@neondatabase/serverless";
import { quickEnv } from "@/lib/helpers.js";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

const DATABASE_URL = quickEnv("DATABASE_URL");

const sql = neon(DATABASE_URL);
const db = drizzle(sql, {
	// logger: true,
	schema: schema,
	casing: "snake_case",
});

export { db, schema };
