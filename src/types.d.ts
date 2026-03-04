import type * as express from "express";
import type { JWTPayload } from "jose";
import type { PERMISSION } from "./constants.ts";
import type { ERROR_CODES } from "./utilities/errors.ts";
import type { schema } from "./config/db.ts";

declare global {
	// schema types
	export type ManagedEntityType =
		(typeof schema.managedEntityTypeEnum.enumValues)[number];
	export type User = typeof schema.user.$inferSelect;
	export type UserType = (typeof schema.userTypeEnum.enumValues)[number];
	export type Role = typeof schema.role.$inferSelect;
	export type Permission = typeof schema.permission.$inferSelect;
	export type VenueAccessLevel =
		(typeof schema.venueAccessLevelEnum.enumValues)[number];

	// system types
	export type PermissionScope = keyof typeof PERMISSION;
	export type PermissionCode =
		// | keyof typeof PERMISSION
		FlattenPermission<typeof PERMISSION>;

	export type IJWTPayload = JWTPayload & Pick<User, "id" | "type">;

	// frontend types:
	// types that are re-used in frontend.
	export namespace Frontend {
		export type AuthenticatedUser = {
			user: Pick<User, "id" | "fullName" | "email" | "type"> & {
				permissions: PermissionCode[];
			};
		};
	}

	// utility types
	export type MaybePromise<T> = T | Promise<T>;
	type FlattenPermission<T> = {
		[K in keyof T]: `${K & string}:${keyof T[K] & string}`;
	}[keyof T];

	export type ApiResponse<T = unknown> = express.Response<
		ApiError | ApiSuccess<T>
	>;
	export type ApiSuccess<T> = {
		success: true;
		data: T;
		// todo: meta and stuff
	};
	export type ApiError = {
		success: false;
		code: ERROR_CODES;
		message: string;
		// todo: details
	};
	export type ApiRequestHandler<
		T = unknown,
		P = unknown,
		B = unknown,
	> = express.RequestHandler<P, ApiSuccess<T> | ApiError, B>;
}
