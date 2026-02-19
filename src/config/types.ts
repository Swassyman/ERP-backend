import type { JWTPayload } from "jose";
import type * as schema from "./schema.js";

export type User = typeof schema.user.$inferSelect;

export type IJWTPayload = JWTPayload & Pick<User, "id">;
