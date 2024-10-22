import type { Customer } from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";

const PWRESET_SECRET = "pwreset";
const EMAIL_VERIFY_SECRET = "emailverifysecret";

export const validatePassword = (
	clearPassword: string,
	hashedPassword: string,
) => hashPassword(clearPassword) === hashedPassword;

export const hashPassword = (clearPassword: string) =>
	Buffer.from(clearPassword).toString("base64");

export const createPasswordResetToken = (customer: Customer, expiresAt: Date) =>
	Buffer.from(
		`${customer.id}:${PWRESET_SECRET}:${expiresAt.getTime()}`,
	).toString("base64");

export const createEmailVerifyToken = (customer: Customer) =>
	Buffer.from(`${customer.id}:${EMAIL_VERIFY_SECRET}:${uuidv4()}`).toString(
		"base64",
	);

export const validatePasswordResetToken = (token: string) => {
	const items = Buffer.from(token, "base64").toString("utf-8").split(":");
	const [customerId, secret, time] = items;

	if (secret !== PWRESET_SECRET) {
		return undefined;
	}

	// Check if the token is expired
	if (parseInt(time) < new Date().getTime()) {
		return undefined;
	}

	return customerId;
};

export const validateEmailVerifyToken = (token: string) => {
	const items = Buffer.from(token, "base64").toString("utf-8").split(":");
	const [customerId, secret] = items;
	if (secret !== EMAIL_VERIFY_SECRET) {
		return undefined;
	}

	return customerId;
};
