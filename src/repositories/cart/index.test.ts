import type { CartDraft, LineItem } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { CartRepository } from "./index";

describe("Cart repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CartRepository(config);

	test("create cart in store", async () => {
		storage.add("dummy", "product", {
			createdAt: "",
			lastModifiedAt: "",
			productType: {
				typeId: "product-type",
				id: "fake-product-type-id",
			},
			version: 1,
			id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
			masterData: {
				current: {
					name: { "nl-NL": "Dummy" },
					slug: { "nl-NL": "Dummy" },
					categories: [],
					masterVariant: {
						sku: "MYSKU",
						id: 1,
						prices: [
							{
								id: "fake-price-id",
								value: {
									currencyCode: "EUR",
									centAmount: 1000,
									type: "centPrecision",
									fractionDigits: 2,
								},
								country: "NL",
							},
						],
					},
					variants: [],
					searchKeywords: {},
				},
				published: false,
				staged: {
					name: { "nl-NL": "Dummy" },
					slug: { "nl-NL": "Dummy" },
					categories: [],
					masterVariant: {
						sku: "MYSKU",
						id: 1,
						prices: [
							{
								id: "fake-price-id",
								value: {
									currencyCode: "EUR",
									centAmount: 1000,
									type: "centPrecision",
									fractionDigits: 2,
								},
								country: "NL",
							},
						],
					},
					variants: [],
					searchKeywords: {},
				},
				hasStagedChanges: false,
			},
		});

		const cart: CartDraft = {
			anonymousId: "1234567890",
			billingAddress: {
				id: "1234567890",
				country: "NL",
				firstName: "John",
				lastName: "Doe",
				streetName: "Main Street",
				streetNumber: "123",
				postalCode: "123456",
			},
			country: "NL",
			currency: "EUR",
			customerEmail: "john.doe@example.com",
			customLineItems: [],
			inventoryMode: "None",
			itemShippingAddresses: [],
			lineItems: [
				{
					id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
					sku: "MYSKU",
					variantId: 1,
					quantity: 1,
					variant: {
						prices: [
							{
								id: "fake-price-id",
								value: {
									currencyCode: "EUR",
									centAmount: 1000,
									type: "centPrecision",
									fractionDigits: 2,
								},
								country: "NL",
							},
						],
					},
				} as unknown as LineItem,
			],
			origin: "Customer",
			shipping: [],
			shippingAddress: {
				id: "1234567890",
				country: "NL",
				firstName: "John",
				lastName: "Doe",
				streetName: "Main Street",
				streetNumber: "123",
				postalCode: "123456",
			},
			shippingMode: "Single",
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			taxCalculationMode: "UnitPriceLevel",
		};

		const ctx = { projectKey: "dummy", storeKey: "dummyStore" };

		const result = repository.create(ctx, cart);
		expect(result.id).toBeDefined();

		const items = repository.query(ctx);
		expect(items.count).toBe(1);

		expect(result.anonymousId).toEqual(cart.anonymousId);
		expect(result.billingAddress).toEqual(cart.billingAddress);
		expect(result.country).toEqual(cart.country);
		expect(result.customerEmail).toEqual(cart.customerEmail);
		expect(result.customerId).toEqual(cart.customerId);
		expect(result.locale).toEqual(cart.locale);
		expect(result.origin).toEqual(cart.origin);
		expect(result.shipping).toEqual(cart.shipping);
		expect(result.shippingAddress).toEqual(cart.shippingAddress);
		expect(result.shippingMode).toEqual(cart.shippingMode);
		expect(result.taxCalculationMode).toEqual(cart.taxCalculationMode);
		expect(result.taxMode).toEqual(cart.taxMode);
		expect(result.taxRoundingMode).toEqual(cart.taxRoundingMode);
		expect(result.store?.key).toEqual(ctx.storeKey);
	});
});
