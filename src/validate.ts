import type { InvalidJsonInputError } from "@commercetools/platform-sdk";
import type { z } from "zod";
import { CommercetoolsError } from "./exceptions.ts";

/**
 * Format a Zod error into a commercetools-style detailedErrorMessage.
 *
 * The real API uses messages like:
 *   "quantityOnStock: Missing required value"
 *   "name: JSON object expected."
 *   "roles: Invalid enum value. Expected one of: 'InventorySupply', ..."
 *
 * We use the first issue only, matching the real API behaviour of reporting
 * a single detailed message.
 */
export function formatDetailedErrorMessage(error: z.ZodError): string {
	const issue = error.issues[0];
	if (!issue) return "Unknown error";

	const path = issue.path.join(".");

	// Missing required field: Zod reports invalid_type with "received undefined"
	if (
		issue.code === "invalid_type" &&
		issue.message.includes("received undefined")
	) {
		return `${path}: Missing required value`;
	}

	// Wrong type (e.g. string received instead of number)
	if (issue.code === "invalid_type") {
		const expected = (issue as any).expected;
		switch (expected) {
			case "string":
				return `${path}: JSON String expected.`;
			case "number":
			case "integer":
				return `${path}: JSON Number expected.`;
			case "boolean":
				return `${path}: JSON Boolean expected.`;
			case "object":
				return `${path}: JSON object expected.`;
			case "array":
				return `${path}: JSON Array expected.`;
			default:
				return `${path}: Invalid type: expected ${expected}`;
		}
	}

	// Invalid enum value
	if (issue.code === "invalid_value") {
		const values = (issue as any).values;
		if (Array.isArray(values)) {
			const formatted = values.map((v: string) => `'${v}'`).join(", ");
			return `${path}: Invalid enum value. Expected one of: ${formatted}`;
		}
	}

	// Refine errors (e.g. ResourceIdentifier id-or-key check)
	if (issue.code === "custom") {
		return issue.message;
	}

	// Fallback: use Zod's message with path prefix
	return path ? `${path}: ${issue.message}` : issue.message;
}

export const validateData = <T>(data: any, schema: z.ZodType) => {
	const result = schema.safeParse(data);
	if (result.success) {
		return data as T;
	}
	throw new CommercetoolsError<InvalidJsonInputError>({
		code: "InvalidJsonInput",
		message: "Request body does not contain valid JSON.",
		detailedErrorMessage: formatDetailedErrorMessage(result.error),
	});
};

export const validateDraft = (data: unknown, schema: z.ZodType): void => {
	const result = schema.safeParse(data);
	if (!result.success) {
		throw new CommercetoolsError<InvalidJsonInputError>({
			code: "InvalidJsonInput",
			message: "Request body does not contain valid JSON.",
			detailedErrorMessage: formatDetailedErrorMessage(result.error),
		});
	}
};
