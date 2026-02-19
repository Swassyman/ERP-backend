import "express";
import { JWTPayload } from "jose";

type WithId<T> = T & {
  id: number;
};

declare global {
  namespace ERP {
    interface SessionUser {
      id: string;
    }

    type IJWTPayload = JWTPayload & {
      userId: string;
    };

    type ICookies = {
      refreshToken?: string;
    };

    type User = WithId<{
      fullName: string;
      email: string;
      passwordHash: string;
      isActive: boolean;
    }>;
  }

  namespace Express {
    interface Request {
      cookies: null;
      user?: ERP.SessionUser;
    }
  }
}

export {};
