import { NeonDbError } from "@neondatabase/serverless";
import { DrizzleQueryError } from "drizzle-orm/errors";

export function getPgErrorCode(error: unknown): string | undefined {
	return error instanceof DrizzleQueryError &&
		error.cause instanceof NeonDbError
		? error.cause.code
		: undefined;
}

export function unreachable(): never {
	console.error("never supposed to reach here");
	throw new Error("unreachable");
}
