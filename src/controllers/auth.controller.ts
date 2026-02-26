import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Request } from "express";
import { jwtVerify } from "jose";
import { z } from "zod";
import { db, schema } from "../config/db.js";
import type {
	ApiRequestHandler,
	ApiResponse,
	IJWTPayload,
	UserType,
} from "../config/types.js";
import {
	INSTITUTION_DOMAIN_REGEXP,
	REFRESH_TOKEN_COOKIE_NAME,
} from "../constants.js";
import { verifyPassword } from "../utilities/argon2.js";
import { ERROR_CODES } from "../utilities/errors.js";
import {
	generateAccessToken,
	generateRefreshToken,
	JWT_REFRESH_SECRET_SIGN_KEY,
	JWT_REFRESH_TOKEN_EXPIRY,
} from "../utilities/jwt.js";

const loginSchema = z
	.object({
		email: z
			.email({ error: "Invalid email format" })
			.regex(INSTITUTION_DOMAIN_REGEXP, {
				error: "Expected institution domain email",
			}),
		password: z
			.string({ error: "Invalid password input" })
			.min(6, { error: "Password must be at least 6 characters" }),
	})
	.strict();

export const login = async (
	req: Request,
	res: ApiResponse<{ accessToken: string }>,
) => {
	const parsed = loginSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: "Invalid credentials",
		});
	}

	const { email, password } = parsed.data;

	const user = await db.query.user.findFirst({
		where: and(eq(schema.user.email, email), isNull(schema.user.deletedAt)),
	});

	if (user == null) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.user_not_found,
			message: "Invalid credentials",
		});
	}

	const isValid = await verifyPassword(user.passwordHash, password);
	if (!isValid) {
		return res.status(401).json({
			success: false,
			code: ERROR_CODES.user_not_found,
			message: "Invalid credentials",
		});
	}

	const payload: IJWTPayload = {
		id: user.id,
		type: user.type,
	};

	const accessToken = await generateAccessToken(payload);
	const refreshToken = await generateRefreshToken(payload);

	res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		maxAge: JWT_REFRESH_TOKEN_EXPIRY,
	});

	return res.status(200).json({
		success: true,
		data: {
			accessToken: accessToken,
		},
	});
};

export const logout: ApiRequestHandler = (_req, res) => {
	res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
	});
	return res.sendStatus(200);
};

export const userDetails = async (
	req: Request,
	res: ApiResponse<{
		user: {
			id: number;
			email: string;
			fullName: string;
			type: UserType;
		};
		// roles: string[];
		permissions: string[];
	}>,
) => {
	if (req.user == null) {
		return res.status(401).json({
			success: false,
			code: ERROR_CODES.unauthorized,
			message: "Unauthorised",
		});
	}

	const user = await db.query.user.findFirst({
		where: and(
			eq(schema.user.id, req.user.id),
			isNull(schema.user.deletedAt),
		),
		columns: {
			id: true,
			email: true,
			fullName: true,
			type: true,
			// todo: return more info
		},
		with: {
			roles: {
				columns: {},
				with: {
					role: {
						columns: {
							code: true,
							id: true,
						},
					},
				},
			},
		},
	});

	if (user == null) {
		// todo: revisit
		return res.status(401).json({
			success: false,
			code: ERROR_CODES.unauthorized,
			message: "Unauthorised",
		});
	}

	const permissions = await db
		.selectDistinct({ code: schema.permission.code })
		.from(schema.rolePermission)
		.innerJoin(
			schema.permission,
			eq(schema.rolePermission.permissionId, schema.permission.id),
		)
		.where(
			inArray(
				schema.rolePermission.roleId,
				user.roles.map(({ role }) => role.id),
			),
		);

	return res.status(200).json({
		success: true,
		data: {
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				type: user.type,
			},
			// roles: user.organizationRoles.map(({ role }) => role.code),
			permissions: permissions.map((permission) => permission.code),
		},
	});
};

export const refresh = async (
	req: Request,
	res: ApiResponse<{
		accessToken: string;
		user: {
			id: number;
			email: string;
			fullName: string;
			type: UserType;
		};
		// roles: string[];
		permissions: string[];
	}>,
) => {
	try {
		const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];

		if (
			typeof refreshToken !== "string" ||
			refreshToken.trim().length === 0
		) {
			return res.status(401).json({
				success: false,
				code: ERROR_CODES.unauthorized,
				message: "No refresh token",
			});
		}

		const { payload } = await jwtVerify<IJWTPayload>(
			refreshToken,
			JWT_REFRESH_SECRET_SIGN_KEY,
		);

		const user = await db.query.user.findFirst({
			where: and(
				eq(schema.user.id, payload.id),
				isNull(schema.user.deletedAt),
			),
			columns: {
				id: true,
				email: true,
				fullName: true,
				type: true,
				// todo: return more info
			},
			with: {
				roles: {
					columns: {},
					with: {
						role: {
							columns: {
								code: true,
								id: true,
							},
						},
					},
				},
			},
		});

		if (user == null) {
			// todo: revisit
			return res.status(401).json({
				success: false,
				code: ERROR_CODES.unauthorized,
				message: "Unauthorised",
			});
		}

		const permissions = await db
			.selectDistinct({ code: schema.permission.code })
			.from(schema.rolePermission)
			.innerJoin(
				schema.permission,
				eq(schema.rolePermission.permissionId, schema.permission.id),
			)
			.where(
				inArray(
					schema.rolePermission.roleId,
					user.roles.map(({ role }) => role.id),
				),
			);

		const newPayload = {
			id: user.id,
			type: user.type,
		} satisfies IJWTPayload;

		const newAccessToken = await generateAccessToken(newPayload);
		const newRefreshToken = await generateRefreshToken(newPayload);

		// todo: extract this into a constant
		res.cookie(REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: JWT_REFRESH_TOKEN_EXPIRY,
		});

		return res.status(200).json({
			success: true,
			data: {
				accessToken: newAccessToken,
				user: {
					id: user.id,
					type: user.type,
					email: user.email,
					fullName: user.fullName,
				},
				permissions: permissions.map((permission) => permission.code),
			},
		});
	} catch {
		return res.status(401).json({
			success: false,
			code: ERROR_CODES.unauthorized,
			message: "Invalid or expired refresh token",
		});
	}
};
