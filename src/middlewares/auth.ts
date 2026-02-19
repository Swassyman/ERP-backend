import type { NextFunction, Request, RequestHandler, Response } from "express";
import { jwtVerify } from "jose";
import type { IJWTPayload } from "../config/types.js";
import {
    JWS_ALG_HEADER_PARAMETER,
    JWT_ACCESS_SECRET_SIGN_KEY,
} from "../utilities/jwt.js";

const BEARER_PREFIX = "Bearer ";

export const authenticateToken: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers.authorization;

    if (
        typeof authHeader !== "string" ||
        !authHeader.startsWith(BEARER_PREFIX) ||
        authHeader.length <= BEARER_PREFIX.length
    ) {
        return res.status(401).json({ message: "Unauthorised" });
    }

    try {
        const accessToken = authHeader.slice(BEARER_PREFIX.length);
        const { payload } = await jwtVerify<IJWTPayload>(
            accessToken,
            JWT_ACCESS_SECRET_SIGN_KEY,
            { algorithms: [JWS_ALG_HEADER_PARAMETER] },
        );

        if (typeof payload.userId !== "number") {
            return res.status(401).json({ message: "Unauthorised" });
        }

        req.user = {
            id: payload.id,
        };
        next();
    } catch {
        return res.status(401).json({ message: "Unauthorised" });
    }
};
