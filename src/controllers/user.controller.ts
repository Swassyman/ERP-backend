import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../config/db.js";
import * as schema from "../config/schema.js";
import { verifyPassword } from "../utilities/argon2.js";
import { generateAccessToken, generateRefreshToken, JWT_REFRESH_SECRET_SIGN_KEY, JWT_REFRESH_TOKEN_EXPIRY } from "../utilities/jwt.js";
import { IJWTPayload } from "../config/types.js";
import { z } from "zod";
import { jwtVerify } from "jose";

const loginSchema = z.object({
	email: z.email({ message: "Invalid email format" }),
	password: z.string().min(6, {
		message: "Password must be at least 6 characters",
	}),
});

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			message: "Invalid input",
		});
	}

	const { email, password } = parsed.data;

	if (!email || !password) {
		return res.status(400).json({ message: "Email and password required" });
	}

	const user = await db.query.user.findFirst({
		where: eq(schema.user.email, email),
	});

	if (!user) {
		return res.status(400).json({ message: "Invalid credentials" });
	}

	const isValid = await verifyPassword(user.passwordHash, password);
	if (!isValid) {
		return res.status(401).json({ message: "Invalid credentials" });
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
  message: "Login successful",
  accessToken,
	});

};

export const userDetails = async (req: Request, res: Response) => {
	try {

		if (!req.user) {
			return res.status(401).json({ message: "Unauthorised" });
		}

		const user = await db.query.user.findFirst({
			where: eq(schema.user.id, req.user.id),
			columns: {
				id: true,
				email: true,
				fullName: true,
			},
		});

		return res.status(200).json({
			user,
		});

	} catch (error) {
		return res.status(500).json({ message: "Internal server error" });
	}
};

export const refresh = async (req: Request, res: Response) => {
	try {
		const refreshToken = req.cookies?.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token" });
		}
		const { payload } = await jwtVerify<IJWTPayload>(
			refreshToken,
		  JWT_REFRESH_SECRET_SIGN_KEY,
		);
		
		if (typeof payload.id !== "number") {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const newAccessToken = await generateAccessToken({
			id: payload.id,
		});

		const newRefreshToken = await generateRefreshToken({
			id: payload.id,
		});

		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			maxAge: JWT_REFRESH_TOKEN_EXPIRY,
		});

		return res.status(200).json({
			accessToken: newAccessToken,
		});
		
	} catch (error) {
		return res.status(401).json({ message: "Invalid or expired refresh token" });
	}
};
