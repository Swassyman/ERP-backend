import { eq } from "drizzle-orm";
import type { Request } from "express";
import { jwtVerify } from "jose";
import { z } from "zod";
import { db } from "../config/db.js";
import * as schema from "../config/schema.js";
import type { ApiResponse, IJWTPayload } from "../config/types.js";
import { INSTITUTION_DOMAIN_REGEXP } from "../constants.js";
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
			code: ERROR_CODES.validation_error,
			message: "Invalid credentials",
		});
	}

	const { email, password } = parsed.data;

	const user = await db.query.user.findFirst({
		where: eq(schema.user.email, email),
	});

	if (user == null) {
		return res.status(400).json({
			code: ERROR_CODES.user_not_found,
			message: "Invalid credentials",
		});
	}

	const isValid = await verifyPassword(user.passwordHash, password);
	if (!isValid) {
		return res.status(401).json({
			code: ERROR_CODES.user_not_found,
			message: "Invalid credentials",
		});
	}

	const payload: IJWTPayload = {
		id: user.id,
	};

	const accessToken = await generateAccessToken(payload);
	const refreshToken = await generateRefreshToken(payload);

	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: true,
		sameSite: "strict",
		maxAge: JWT_REFRESH_TOKEN_EXPIRY,
	});

	return res.status(200).json({
		data: {
			accessToken: accessToken,
		},
	});
};

export const userDetails = async (
	req: Request,
	res: ApiResponse<{
		user: {
			id: number;
			email: string;
			fullName: string;
		};
	}>,
) => {
	if (!req.user) {
		return res.status(401).json({
			code: ERROR_CODES.unauthorized,
			message: "Unauthorised",
		});
	}

	const user = await db.query.user.findFirst({
		where: eq(schema.user.id, req.user.id),
		columns: {
			id: true,
			email: true,
			fullName: true,
			// todo: return more info
		},
	});

	if (user == null) {
		// todo: revisit
		return res.status(401).json({
			code: ERROR_CODES.unauthorized,
			message: "Unauthorised",
		});
	}

	return res.status(200).json({
		data: {
			user: user,
		},
	});
};

export const refresh = async (
	req: Request,
	res: ApiResponse<{ accessToken: string }>,
) => {
	try {
		const refreshToken = req.cookies?.refreshToken;

		if (typeof refreshToken !== "string" || refreshToken.trim().length === 0) {
			return res.status(401).json({
				code: ERROR_CODES.unauthorized,
				message: "No refresh token",
			});
		}

		const { payload } = await jwtVerify<IJWTPayload>(
			refreshToken,
			JWT_REFRESH_SECRET_SIGN_KEY,
		);

		const newAccessToken = await generateAccessToken({ id: payload.id });
		const newRefreshToken = await generateRefreshToken({ id: payload.id });

		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: JWT_REFRESH_TOKEN_EXPIRY,
		});

		return res.status(200).json({
			data: {
				accessToken: newAccessToken,
			},
		});
	} catch {
		return res.status(401).json({
			code: ERROR_CODES.unauthorized,
			message: "Invalid or expired refresh token",
		});
	}
};
