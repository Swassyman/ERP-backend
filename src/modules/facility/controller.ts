import { db, schema } from "@/config/db.js";
import { ERROR_CODES } from "@/utilities/errors.js";
import { unreachable } from "@/utilities/helpers.js";
import { isNull } from "drizzle-orm";
import { createFacilitySchema } from "./schema.js";

export const getFacilities: ApiRequestHandler<
	{
		id: number;
		name: string;
	}[]
> = async (_req, res) => {
	const facilities = await db
		.select({
			id: schema.facility.id,
			name: schema.facility.name,
		})
		.from(schema.facility)
		.where(isNull(schema.facility.deletedAt));

	return res.status(200).json({
		success: true,
		data: facilities,
	});
};

export const createFacility: ApiRequestHandler<
	{
		id: number;
	},
	undefined
> = async (req, res) => {
	const parsed = createFacilitySchema.safeParse(req.body);

	if (!parsed.success) {
		return res.status(400).json({
			success: false,
			code: ERROR_CODES.validation_error,
			message: parsed.error.message,
		});
	}

	const [inserted] = await db
		.insert(schema.facility)
		.values({
			name: parsed.data.name,
		})
		.returning({ id: schema.facility.id });

	if (inserted == null) {
		unreachable();
	}

	return res.status(200).json({
		success: true,
		data: {
			id: inserted.id,
		},
	});
};
