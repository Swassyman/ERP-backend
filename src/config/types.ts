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
// export type RoleCode = keyof typeof ROLE;
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

// Source - https://stackoverflow.com/a/64519702
// Posted by Jan Sommer, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-24, License - CC BY-SA 4.0

// export type UniqueArray<T> = T extends readonly [infer X, ...infer Rest]
// 	? InArray<Rest, X> extends true
// 		? ["Encountered value with duplicates:", X]
// 		: readonly [X, ...UniqueArray<Rest>]
// 	: T;

// export type InArray<T, X> = T extends readonly [X, ...infer _Rest]
// 	? true
// 	: T extends readonly [X]
// 		? true
// 		: T extends readonly [infer _, ...infer Rest]
// 			? InArray<Rest, X>
// 			: false;
