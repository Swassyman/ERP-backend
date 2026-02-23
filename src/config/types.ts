import type { Response } from "express";
import type { JWTPayload } from "jose";
import type { ERROR_CODES } from "../utilities/errors.js";
import type * as schema from "./schema.js";

export type User = typeof schema.user.$inferSelect;

export type OrganizationType =
	(typeof schema.organizationTypeEnum.enumValues)[number];

export type IJWTPayload = JWTPayload & { id: number };

export type ApiResponse<T = unknown> = Response<ApiError | ApiSuccess<T>>;
export type ApiError = {
	code: ERROR_CODES;
	message: string;
};
export type ApiSuccess<T> = {
	data: T;
};
