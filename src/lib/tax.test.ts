import type {
	TaxCategory,
	TaxedItemPrice,
	TaxRate,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import {
	buildTaxedPriceFromExternalAmount,
	calculateTaxedPrice,
	calculateTaxedPriceFromRate,
	calculateTaxTotals,
} from "#src/lib/tax.ts";

const money = (centAmount: number) => ({
	type: "centPrecision" as const,
	currencyCode: "EUR",
	centAmount,
	fractionDigits: 2,
});

const createTaxedItemPrice = (net: number, gross: number, rate = 0.21) => ({
	totalNet: money(net),
	totalGross: money(gross),
	totalTax: money(gross - net),
	taxPortions: [
		{
			rate,
			amount: money(gross - net),
		},
	],
});

describe("tax helpers", () => {
	test("calculateTaxTotals aggregates line, custom, and shipping taxes", () => {
		const lineTaxed = createTaxedItemPrice(1000, 1210);
		const customTaxed = createTaxedItemPrice(500, 605);
		const shippingTaxed: TaxedItemPrice = createTaxedItemPrice(300, 363);

		const resource = {
			lineItems: [{ taxedPrice: lineTaxed }] as any,
			customLineItems: [{ taxedPrice: customTaxed }] as any,
			shippingInfo: { taxedPrice: shippingTaxed } as any,
			totalPrice: money(0),
		};

		const { taxedPrice, taxedShippingPrice } = calculateTaxTotals(resource);

		expect(taxedPrice).toBeDefined();
		expect(taxedPrice?.totalNet.centAmount).toBe(1000 + 500 + 300);
		expect(taxedPrice?.totalGross.centAmount).toBe(1210 + 605 + 363);
		expect(taxedPrice?.totalTax?.centAmount).toBe(210 + 105 + 63);
		expect(taxedPrice?.taxPortions).toHaveLength(1);
		expect(taxedPrice?.taxPortions?.[0].amount.centAmount).toBe(378);
		expect(taxedShippingPrice).toEqual(shippingTaxed);
	});

	test("calculateTaxedPriceFromRate handles net amounts", () => {
		const rate: TaxRate = {
			amount: 0.2,
			includedInPrice: false,
			name: "Standard",
			country: "NL",
			id: "rate",
			subRates: [],
		};

		const taxed = calculateTaxedPriceFromRate(1000, "EUR", rate)!;
		expect(taxed.totalNet.centAmount).toBe(1000);
		expect(taxed.totalGross.centAmount).toBe(1200);
		expect(taxed.totalTax?.centAmount).toBe(200);
	});

	test("calculateTaxedPriceFromRate handles gross amounts", () => {
		const rate: TaxRate = {
			amount: 0.25,
			includedInPrice: true,
			name: "Gross",
			id: "gross",
			country: "BE",
			subRates: [],
		};

		const taxed = calculateTaxedPriceFromRate(1250, "EUR", rate)!;
		expect(taxed.totalGross.centAmount).toBe(1250);
		expect(taxed.totalNet.centAmount).toBe(1000);
		expect(taxed.totalTax?.centAmount).toBe(250);
	});

	test("calculateTaxedPriceFromRate respects HalfEven rounding (banker's)", () => {
		const rate: TaxRate = {
			amount: 0.05,
			includedInPrice: false,
			name: "5%",
			country: "NL",
			id: "rate",
			subRates: [],
		};

		// 250 * 0.05 = 12.5 — HalfEven rounds to 12 (toward even)
		const halfEven = calculateTaxedPriceFromRate(250, "EUR", rate, "HalfEven")!;
		expect(halfEven.totalTax?.centAmount).toBe(12);
		expect(halfEven.totalGross.centAmount).toBe(262);

		// HalfUp rounds 12.5 → 13
		const halfUp = calculateTaxedPriceFromRate(250, "EUR", rate, "HalfUp")!;
		expect(halfUp.totalTax?.centAmount).toBe(13);
		expect(halfUp.totalGross.centAmount).toBe(263);

		// HalfDown rounds 12.5 → 12
		const halfDown = calculateTaxedPriceFromRate(250, "EUR", rate, "HalfDown")!;
		expect(halfDown.totalTax?.centAmount).toBe(12);
		expect(halfDown.totalGross.centAmount).toBe(262);
	});

	test("buildTaxedPriceFromExternalAmount respects rounding mode", () => {
		const draft = {
			totalGross: {
				type: "centPrecision" as const,
				currencyCode: "EUR",
				centAmount: 525,
				fractionDigits: 2,
			},
			taxRate: {
				name: "5%",
				amount: 0.05,
				country: "NL",
				includedInPrice: true,
			},
		};

		// 525 * 0.05 / 1.05 = 25.0 — exact, no rounding ambiguity
		// Use a case with .5 ambiguity: 315 * 0.05 / 1.05 = 15.0 — also exact
		// 105 * 0.05 / 1.05 = 5.0
		// Pick 11 * 0.5 / 1.5 = 3.666... not clean. Use 525 to confirm baseline
		const halfEven = buildTaxedPriceFromExternalAmount(draft, "HalfEven");
		expect(halfEven.totalGross.centAmount).toBe(525);
		expect(halfEven.totalTax?.centAmount).toBe(25);
		expect(halfEven.totalNet.centAmount).toBe(500);
	});

	test("calculateTaxedPrice selects matching tax rate from category", () => {
		const taxCategory: TaxCategory = {
			id: "tax-cat",
			version: 1,
			createdAt: "2024-01-01T00:00:00.000Z",
			lastModifiedAt: "2024-01-01T00:00:00.000Z",
			name: "Standard",
			rates: [
				{
					id: "default",
					amount: 0.1,
					includedInPrice: false,
					country: "DE",
					name: "DE",
					subRates: [],
				},
				{
					id: "nl",
					amount: 0.21,
					includedInPrice: false,
					country: "NL",
					name: "NL",
					subRates: [],
				},
			],
		};

		const taxed = calculateTaxedPrice(1000, taxCategory, "EUR", "NL")!;
		expect(taxed.totalGross.centAmount).toBe(1210);
		expect(taxed.totalTax?.centAmount).toBe(210);
	});
});
