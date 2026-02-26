import type * as express from "express";
import type { JWTPayload } from "jose";
import type { PERMISSION } from "../constants.js";
import type { ERROR_CODES } from "../utilities/errors.js";
import type { schema } from "./db.js";

// schema types
export type ManagedEntityType =
	(typeof schema.managedEntityTypeEnum.enumValues)[number];
export type User = typeof schema.user.$inferSelect;
export type UserType = (typeof schema.userTypeEnum.enumValues)[number];
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

export type ApiResponse<T = unknown> = express.Response<
	ApiError | ApiSuccess<T>
>;
export type ApiError = {
	code: ERROR_CODES;
	message: string;
	// todo: details
};
export type ApiSuccess<T> = {
	data: T;
	// todo: meta and stuff
};
export type MaybePromise<T> = T | Promise<T>;

export type ApiRequestHandler<T, P = unknown> = express.RequestHandler<
	P,
	ApiError | ApiSuccess<T>
>;
