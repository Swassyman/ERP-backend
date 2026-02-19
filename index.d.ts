import "express";
import type * as types from "./config/types.ts";

declare global {
    namespace Express {
        interface Request {
            user?: types.User;
        }
    }
}
