import type { SQL } from "drizzle-orm";
import { type CheckBuilder, check } from "drizzle-orm/pg-core";

export type CustomCheckEntry = {
	error: string;
};
type CustomChecks = {
	[table: string]: CustomCheckEntry;
};

export const CHECKS = {
	user: {
		email_must_belong_to_institution: {
			error: "The email address must belong to the institution",
		},
	},
	venue: {
		unavailability_reason_presence: {
			error: "Unavailability reason must be present only when venue is unavailable",
		},
	},
} as const satisfies Record<string, CustomChecks>;

type CheckIdentifier = {
	[TT in keyof typeof CHECKS]: {
		[K in keyof (typeof CHECKS)[TT]]: `${TT & string}:${K & string}`;
	}[keyof (typeof CHECKS)[TT]];
}[keyof typeof CHECKS];

export function buildCheck(identifier: CheckIdentifier, value: SQL): CheckBuilder {
	const colonIndex = identifier.indexOf(":");
	if (colonIndex < 1) throw new Error("invalid identifier"); // 1 because table name cannot be empty
	const tableName = identifier.slice(0, colonIndex);
	const checkName = identifier.slice(colonIndex + 1);
	return check(`chk_${tableName}__${checkName}`, value);
}

type TableName = keyof typeof CHECKS;
type CheckName<T extends TableName> = keyof (typeof CHECKS)[T] & string;

export function isTableName(name: string): name is TableName {
	return name in CHECKS;
}

export function isCheckName<T extends TableName>(table: T, name: string): name is CheckName<T> {
	return name in CHECKS[table];
}
