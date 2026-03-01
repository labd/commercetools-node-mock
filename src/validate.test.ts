import { describe, expect, it } from "vitest";
import { z } from "zod";
import { formatDetailedErrorMessage } from "./validate.ts";

describe("formatDetailedErrorMessage", () => {
	it("formats missing required field", () => {
		const schema = z.object({ name: z.string() });
		const result = schema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"name: Missing required value",
			);
		}
	});

	it("formats wrong type (string expected, got number)", () => {
		const schema = z.object({ name: z.string() });
		const result = schema.safeParse({ name: 123 });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"name: JSON String expected.",
			);
		}
	});

	it("formats wrong type (number expected, got string)", () => {
		const schema = z.object({ count: z.number() });
		const result = schema.safeParse({ count: "abc" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"count: JSON Number expected.",
			);
		}
	});

	it("formats wrong type (boolean expected)", () => {
		const schema = z.object({ active: z.boolean() });
		const result = schema.safeParse({ active: "yes" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"active: JSON Boolean expected.",
			);
		}
	});

	it("formats wrong type (object expected)", () => {
		const schema = z.object({ data: z.object({ id: z.string() }) });
		const result = schema.safeParse({ data: "not-an-object" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"data: JSON object expected.",
			);
		}
	});

	it("formats wrong type (array expected)", () => {
		const schema = z.object({ items: z.array(z.string()) });
		const result = schema.safeParse({ items: "not-an-array" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"items: JSON Array expected.",
			);
		}
	});

	it("formats invalid enum value", () => {
		const schema = z.object({ role: z.enum(["Admin", "User"]) });
		const result = schema.safeParse({ role: "SuperAdmin" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"role: Invalid enum value. Expected one of: 'Admin', 'User'",
			);
		}
	});

	it("formats nested field errors with dot path", () => {
		const schema = z.object({
			address: z.object({ country: z.string() }),
		});
		const result = schema.safeParse({ address: { country: 123 } });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"address.country: JSON String expected.",
			);
		}
	});

	it("formats refine errors (custom code)", () => {
		const schema = z
			.object({ id: z.string().optional(), key: z.string().optional() })
			.refine((data) => data.id !== undefined || data.key !== undefined, {
				message: "Either 'id' or 'key' must be provided",
			});
		const result = schema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"Either 'id' or 'key' must be provided",
			);
		}
	});

	it("uses first issue only when multiple errors exist", () => {
		const schema = z.object({ a: z.string(), b: z.number() });
		const result = schema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			// Should report the first missing field only
			expect(formatDetailedErrorMessage(result.error)).toBe(
				"a: Missing required value",
			);
		}
	});
});
