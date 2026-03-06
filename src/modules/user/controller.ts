import { asyncHandler } from "@/utilities/async-handler.js";
import { ok } from "@/utilities/helpers.js";
import { createUserSchema } from "./schema.js";
import * as service from "./service.js";

export const createUser = asyncHandler<{
	id: number;
}>(async (req, res) => {
	const body = createUserSchema.parse(req.body);
	const result = await service.createUser(body);
	return ok(res, result);
});

export const getUsers = asyncHandler<
	{
		email: string;
		fullName: string;
		id: number;
		isActive: boolean;
		createdAt: string;
		roles: {
			id: number;
			isActive: boolean;
			createdAt: string;
			roleId: number;
			managedEntityId: number;
		}[];
	}[]
>(async (_req, res) => {
	const result = await service.getUsers();
	return ok(res, result);
});
