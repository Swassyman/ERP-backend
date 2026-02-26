import { NeonDbError } from "@neondatabase/serverless";
import { DrizzleQueryError } from "drizzle-orm/errors";
import type { PermissionCode, PermissionScope } from "../config/types.js";
import {
	FLATTENED_PERMISSIONS,
	type PERMISSION,
	PERMISSION_SCOPES,
} from "../constants.js";

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

export function isPermissionScope(scope: string): scope is PermissionScope {
	return (PERMISSION_SCOPES as string[]).includes(scope);
}

export function isPermission(permission: string): permission is PermissionCode {
	return permission in FLATTENED_PERMISSIONS;
}

// export function isRole(role: string): role is RoleCode {
// 	return role in ROLE;
// }
