import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../config/db.js";
import * as schema from "../config/schema.js";
import { verifyPassword } from "../utilities/argon2.js";

export const login = async (req: Request, res: Response) => {
	const { email, password } = req.body as {
		//  todo: @rishi validate using zod
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

	const isValid = await verifyPassword(user.passwordHash, password);
	if (!isValid) {
		return res.status(401).json({ message: "Invalid credentials" });
	}

	//creation of tokens required
};
