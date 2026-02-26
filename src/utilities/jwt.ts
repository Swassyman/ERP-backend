import { SignJWT } from "jose";
import type { IJWTPayload } from "../config/types.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
if (typeof JWT_ACCESS_SECRET !== "string" || JWT_ACCESS_SECRET.length === 0) {
	throw new Error("Invalid JWT_ACCESS_SECRET environment variable");
}
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (typeof JWT_REFRESH_SECRET !== "string" || JWT_REFRESH_SECRET.length === 0) {
	throw new Error("Invalid JWT_REFRESH_SECRET environment variable");
}
export const JWT_ACCESS_SECRET_SIGN_KEY = new TextEncoder().encode(
	JWT_ACCESS_SECRET,
);
export const JWT_REFRESH_SECRET_SIGN_KEY = new TextEncoder().encode(
	JWT_REFRESH_SECRET,
);

const SECOND = 1000,
	MINUTE = 60 * SECOND,
	HOUR = 60 * MINUTE,
	DAY = 24 * HOUR;
export const JWT_ACCESS_TOKEN_EXPIRY = 5 * MINUTE;
export const JWT_REFRESH_TOKEN_EXPIRY = 30 * DAY;
export const JWS_ALG_HEADER_PARAMETER = "HS256";

export function getJWTTokenGenerator(
	expiration: number,
	signKey: Parameters<SignJWT["sign"]>[0],
) {
	return async (payload: IJWTPayload) => {
		const expires = new Date(Date.now() + expiration);

		return await new SignJWT(payload)
			.setProtectedHeader({ alg: JWS_ALG_HEADER_PARAMETER })
			.setIssuedAt()
			.setExpirationTime(expires)
			.sign(signKey);
	};
}

export const generateAccessToken = getJWTTokenGenerator(
	JWT_ACCESS_TOKEN_EXPIRY,
	JWT_ACCESS_SECRET_SIGN_KEY,
);

export const generateRefreshToken = getJWTTokenGenerator(
	JWT_REFRESH_TOKEN_EXPIRY,
	JWT_REFRESH_SECRET_SIGN_KEY,
);
