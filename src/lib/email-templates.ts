export function getPasswordSetupContent(setupUrl: string) {
	return `
Hello,

An administrator has created an account for you.

Please set your password using the link below to activate your account:

${setupUrl}

This link will expire in 24 hours.

This is an automated message. Please do not reply.
`;
}

export function getPasswordUpdatedContent(loginUrl: string) {
	return `
Hello,

Your account password has been successfully changed.

You can log in using your updated credentials:

${loginUrl}

If you did not make this change, please report it immediately to the system administrator.

This is an automated security notification. Please do not reply.
`;
}
