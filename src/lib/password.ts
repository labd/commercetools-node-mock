export const validatePassword = (
	clearPassword: string,
	hashedPassword: string
) => hashPassword(clearPassword) === hashedPassword

export const hashPassword = (clearPassword: string) =>
	Buffer.from(clearPassword).toString('base64')
