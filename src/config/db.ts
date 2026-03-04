import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";
import { quickEnv } from "@/utilities/helpers.js";

const DATABASE_URL = quickEnv("DATABASE_URL");

const sql = neon(DATABASE_URL);
const db = drizzle(sql, {
	schema: schema,
	casing: "snake_case",
});

export { db, schema };
