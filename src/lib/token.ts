import { nanoid } from "nanoid";

const DEFAULT_LENGTH = 12;

export function generateSecureString(length: number = DEFAULT_LENGTH) {
	return nanoid(length);
}
