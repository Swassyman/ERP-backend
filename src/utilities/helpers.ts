import { NeonDbError } from "@neondatabase/serverless";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { FLATTENED_PERMISSIONS, PERMISSION_SCOPES } from "@/constants.js";

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

export function quickEnv(name: string, check: false): string | undefined;
export function quickEnv(name: string, check?: true): string;
export function quickEnv(name: string, check?: boolean): string | undefined {
	const value = process.env[name];
	if (check && (typeof value !== "string" || value.length === 0)) {
		throw new Error(`Environment variable '${name}' must be set`);
	}
	return value;
}

export function isPermissionScope(scope: string): scope is PermissionScope {
	return (PERMISSION_SCOPES as string[]).includes(scope);
}

export function isPermission(permission: string): permission is PermissionCode {
	return permission in FLATTENED_PERMISSIONS;
}
