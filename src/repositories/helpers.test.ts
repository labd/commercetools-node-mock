import type {
	BaseAddress,
	HighPrecisionMoneyDraft,
	Money,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { InMemoryStorage } from "#src/storage/index.ts";
import {
	calculateCentAmountFromPreciseAmount,
	calculateMoneyTotalCentAmount,
	createAddress,
	createHighPrecisionMoney,
} from "./helpers.ts";

describe("Helpers", () => {
	const storage = new InMemoryStorage();
	const projectKey = "test-project";

	describe("createAddress", () => {
		test("should generate random id when id is not provided", () => {
			const baseAddress: BaseAddress = {
				country: "US",
				streetName: "Test Street",
				city: "Test City",
			};

			const result = createAddress(baseAddress, projectKey, storage);
			expect(result).toBeDefined();
			expect(result?.id).toBeDefined();
			expect(typeof result?.id).toBe("string");
			expect(result?.id).toMatch(/^[a-z0-9]{8}$/);
		});
	});

	describe("calculateCentAmountFromPreciseAmount", () => {
		test("rounds half even by default", () => {
			const centAmount = calculateCentAmountFromPreciseAmount(1005, 3, "EUR");
			expect(centAmount).toBe(100);
		});

		test("supports HalfUp and HalfDown rounding modes", () => {
			const halfUp = calculateCentAmountFromPreciseAmount(
				1005,
				3,
				"EUR",
				"HalfUp",
			);
			const halfDown = calculateCentAmountFromPreciseAmount(
				1005,
				3,
				"EUR",
				"HalfDown",
			);
			expect(halfUp).toBe(101);
			expect(halfDown).toBe(100);
		});

		test("uses currency fraction digits for conversion", () => {
			const centAmount = calculateCentAmountFromPreciseAmount(1234, 2, "JPY");
			expect(centAmount).toBe(12);
		});
	});

	describe("createHighPrecisionMoney", () => {
		test("computes centAmount when missing", () => {
			const money = createHighPrecisionMoney({
				type: "highPrecision",
				currencyCode: "EUR",
				fractionDigits: 3,
				preciseAmount: 1015,
			});

			expect(money.type).toBe("highPrecision");
			expect(money.centAmount).toBe(102);
			expect(money.preciseAmount).toBe(1015);
			expect(money.fractionDigits).toBe(3);
		});

		test("throws when preciseAmount is missing", () => {
			expect(() =>
				createHighPrecisionMoney({
					type: "highPrecision",
					currencyCode: "EUR",
					fractionDigits: 3,
				} as HighPrecisionMoneyDraft),
			).toThrow("HighPrecisionMoney requires preciseAmount");
		});

		test("throws when fractionDigits is missing", () => {
			expect(() =>
				createHighPrecisionMoney({
					type: "highPrecision",
					currencyCode: "EUR",
					preciseAmount: 1015,
				} as HighPrecisionMoneyDraft),
			).toThrow("HighPrecisionMoney requires fractionDigits");
		});
	});

	describe("calculateMoneyTotalCentAmount", () => {
		test("uses preciseAmount when available", () => {
			const money: HighPrecisionMoneyDraft = {
				type: "highPrecision",
				currencyCode: "EUR",
				fractionDigits: 5,
				preciseAmount: 101499,
				centAmount: 101,
			};

			const totalCentAmount = calculateMoneyTotalCentAmount(money, 2);
			expect(totalCentAmount).toBe(203);
		});

		test("falls back to centAmount when preciseAmount is missing", () => {
			const money: Money = {
				currencyCode: "EUR",
				centAmount: 123,
			};

			const totalCentAmount = calculateMoneyTotalCentAmount(money, 3);
			expect(totalCentAmount).toBe(369);
		});

		test("supports rounding mode overrides", () => {
			const money: HighPrecisionMoneyDraft = {
				type: "highPrecision",
				currencyCode: "EUR",
				fractionDigits: 3,
				preciseAmount: 1005,
			};

			const totalCentAmount = calculateMoneyTotalCentAmount(money, 1, "HalfUp");
			expect(totalCentAmount).toBe(101);
		});
	});
});
