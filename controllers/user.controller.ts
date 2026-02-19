import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../config/db.js";
import * as schema from "../config/schema.js";

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as {
        email: string;
        password: string;
    };

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }

    const user = await db.query.user.findFirst({
        where: eq(schema.user.email, email),
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
};
