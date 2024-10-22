import type {
	Cart,
	ShippingRate,
	ShippingRatePriceTier,
} from "@commercetools/platform-sdk";
import { describe, expect, it } from "vitest";
import {
	markMatchingShippingRate,
	markMatchingShippingRatePriceTiers,
} from "./shipping";

// describe('markMatchingShippingMethods', () => {
// 	const zones: Record<string, Zone> = {
// 		NL: {
// 			id: '45b39469-4f3d-4d03-9e24-ed6bd5c038d9',
// 			createdAt: '2021-08-05T09:00:00.000Z',
// 			lastModifiedAt: '2021-08-05T09:00:00.000Z',
// 			version: 1,
// 			name: 'NL',
// 			description: '',
// 			locations: [
// 				{
// 					country: 'NL',
// 				},
// 			],
// 		},
// 		DE: {
// 			id: '45b39469-4f3d-4d03-9e24-ed6bd5c038d9',
// 			createdAt: '2021-08-05T09:00:00.000Z',
// 			lastModifiedAt: '2021-08-05T09:00:00.000Z',
// 			version: 1,
// 			name: 'DE',
// 			description: '',
// 			locations: [
// 				{
// 					country: 'DE',
// 				},
// 			],
// 		},
// 	}

// 	const shippingMethods: Record<string, Partial<ShippingMethod>> = {
// 		default: {
// 			id: '1c39b73f-186c-4711-8fd9-de60ec561ac0',
// 			key: 'default',
// 			zoneRates: [
// 				{
// 					zone: {
// 						typeId: 'zone',
// 						id: '45b39469-4f3d-4d03-9e24-ed6bd5c038d9',
// 						obj: zones['NL'],
// 					},
// 					shippingRates: [
// 						{
// 							price: {
// 								type: 'centPrecision',
// 								currencyCode: 'EUR',
// 								centAmount: 495,
// 								fractionDigits: 2,
// 							},
// 							freeAbove: {
// 								type: 'centPrecision',
// 								currencyCode: 'USD',
// 								centAmount: 5000,
// 								fractionDigits: 2,
// 							},
// 							tiers: [],
// 						},
// 					],
// 				},
// 			],
// 			isDefault: true,
// 		},
// 		tiered: {
// 			id: '2c39b73f-186c-4711-8fd9-de60ec561ac0',
// 			key: 'tiered',
// 			description: 'More expensive optional one',
// 			zoneRates: [
// 				{
// 					zone: {
// 						typeId: 'zone',
// 						id: '45b39469-4f3d-4d03-9e24-ed6bd5c038d9',
// 						obj: zones['NL'],
// 					},
// 					shippingRates: [
// 						{
// 							price: {
// 								type: 'centPrecision',
// 								currencyCode: 'EUR',
// 								centAmount: 495,
// 								fractionDigits: 2,
// 							},
// 							freeAbove: {
// 								type: 'centPrecision',
// 								currencyCode: 'USD',
// 								centAmount: 5000,
// 								fractionDigits: 2,
// 							},
// 							tiers: [],
// 						},
// 					],
// 				},
// 			],
// 			isDefault: false,
// 		},
// 		german: {
// 			id: '8c39b73f-186c-4711-8fd9-de60ec561ac0',
// 			key: 'tiered',
// 			description: 'More expensive optional one',
// 			zoneRates: [
// 				{
// 					zone: {
// 						typeId: 'zone',
// 						id: '45b39469-4f3d-4d03-9e24-ed6bd5c038d9',
// 						obj: zones['DE'],
// 					},
// 					shippingRates: [
// 						{
// 							price: {
// 								type: 'centPrecision',
// 								currencyCode: 'EUR',
// 								centAmount: 495,
// 								fractionDigits: 2,
// 							},
// 							freeAbove: {
// 								type: 'centPrecision',
// 								currencyCode: 'USD',
// 								centAmount: 5000,
// 								fractionDigits: 2,
// 							},
// 							tiers: [],
// 						},
// 					],
// 				},
// 			],
// 			isDefault: false,
// 		},
// 	}

// 	it('should mark the default shipping method', () => {
// 		const cart: Partial<Cart> = {
// 			id: '1',
// 			version: 1,
// 			totalPrice: {
// 				currencyCode: 'EUR',
// 				centAmount: 1000,
// 				fractionDigits: 2,
// 				type: 'centPrecision',
// 			},
// 			shippingAddress: {
// 				country: 'NL',
// 			},
// 			lineItems: [],
// 			customLineItems: [],
// 		}

// 		const data = markMatchingShippingMethods(
// 			cart as Cart,
// 			Object.values(shippingMethods) as ShippingMethod[]
// 		)
// 	})
// })

describe("markMatchingShippingRate", () => {
	const rate: ShippingRate = {
		price: {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 495,
			fractionDigits: 2,
		},
		freeAbove: {
			type: "centPrecision",
			currencyCode: "USD",
			centAmount: 5000,
			fractionDigits: 2,
		},
		tiers: [],
	};

	it("should mark the shipping rate as matching", () => {
		const cart: Partial<Cart> = {
			totalPrice: {
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
				type: "centPrecision",
			},
		};

		const result = markMatchingShippingRate(cart as Cart, rate);
		expect(result).toMatchObject({
			...rate,
			isMatching: true,
		});
	});

	it("should mark the shipping rate as not matching", () => {
		const cart: Partial<Cart> = {
			totalPrice: {
				currencyCode: "USD",
				centAmount: 1000,
				fractionDigits: 2,
				type: "centPrecision",
			},
		};

		const result = markMatchingShippingRate(cart as Cart, rate);
		expect(result).toMatchObject({
			...rate,
			isMatching: false,
		});
	});
});

describe("markMatchingShippingRatePriceTiers", () => {
	it("should handle CartValue types", () => {
		const tiers: ShippingRatePriceTier[] = [
			// Above 100 euro shipping is 4 euro
			{
				type: "CartValue",
				minimumCentAmount: 10000,
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 400,
					fractionDigits: 2,
				},
			},
			// Above 200 euro shipping is 3 euro
			{
				type: "CartValue",
				minimumCentAmount: 20000,
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 300,
					fractionDigits: 2,
				},
			},
			// Above 50 euro shipping is 5 euro
			{
				type: "CartValue",
				minimumCentAmount: 500,
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 700,
					fractionDigits: 2,
				},
			},
		];

		// Create a cart with a total price of 90 euro
		const cart: Partial<Cart> = {
			totalPrice: {
				currencyCode: "EUR",
				centAmount: 9000,
				fractionDigits: 2,
				type: "centPrecision",
			},
		};

		const result = markMatchingShippingRatePriceTiers(cart as Cart, tiers);
		expect(result).toMatchObject([
			{
				minimumCentAmount: 10000,
				isMatching: false,
			},
			{
				minimumCentAmount: 20000,
				isMatching: false,
			},
			{
				minimumCentAmount: 500,
				isMatching: true,
			},
		]);
	});
});
