import type {
	TaxCategory,
	TaxRate,
	TaxedItemPrice,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import {
	calculateTaxTotals,
	calculateTaxedPrice,
	calculateTaxedPriceFromRate,
} from "~src/lib/tax";

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
