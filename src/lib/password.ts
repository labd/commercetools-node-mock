import { Customer } from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";

const PWRESET_SECRET = "pwreset";

export const validatePassword = (
	clearPassword: string,
	hashedPassword: string,
) => hashPassword(clearPassword) === hashedPassword;

export const hashPassword = (clearPassword: string) =>
	Buffer.from(clearPassword).toString("base64");

export const createPasswordResetToken = (customer: Customer) =>
	Buffer.from(`${customer.id}:${PWRESET_SECRET}:${uuidv4()}`).toString(
		"base64",
	);

export const validatePasswordResetToken = (token: string) => {
	const items = Buffer.from(token, "base64").toString("utf-8").split(":");
	const [customerId, secret] = items;
	if (secret !== PWRESET_SECRET) {
		return undefined;
	}

	return customerId;
};
