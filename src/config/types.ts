import type { Response } from "express";
import type { JWTPayload } from "jose";
import type { PERMISSION } from "../constants.js";
import type { ERROR_CODES } from "../utilities/errors.js";
import type * as schema from "./schema.js";

// schema types
export type User = typeof schema.user.$inferSelect;
export type UserType = (typeof schema.userTypeEnum.enumValues)[number];
export type OrganizationType =
	(typeof schema.organizationTypeEnum.enumValues)[number];
export type Role = typeof schema.role.$inferSelect;
export type Permission = typeof schema.permission.$inferSelect;

// system types
export type PermissionScope = keyof typeof PERMISSION;
export type PermissionCode =
	// | keyof typeof PERMISSION
	FlattenPermission<typeof PERMISSION>;

export type IJWTPayload = JWTPayload & Pick<User, "id" | "type">;

// utility types
type FlattenPermission<T> = {
	[K in keyof T]: `${K & string}:${keyof T[K] & string}`;
}[keyof T];

export type ApiResponse<T = unknown> = Response<ApiError | ApiSuccess<T>>;
export type ApiError = {
	code: ERROR_CODES;
	message: string;
	// todo: details
};
export type ApiSuccess<T> = {
	data: T;
	// todo: meta and stuff
};
