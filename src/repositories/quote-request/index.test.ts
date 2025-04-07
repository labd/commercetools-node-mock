import type { Cart, LineItem } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { QuoteRequestRepository } from ".";

describe("QuoteRequest repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = {
		storage,
		strict: false,
	};
	const repository = new QuoteRequestRepository(config);

	test("create from cart", async () => {
		const cart: Cart = {
			id: "b3875a58-4ab2-4aaa-b399-184ce7561c27",
			version: 1,
			createdAt: "2021-09-02T12:23:30.036Z",
			lastModifiedAt: "2021-09-02T12:23:30.546Z",
			discountCodes: [],
			directDiscounts: [],
			inventoryMode: "None",
			itemShippingAddresses: [],
			lineItems: [
				{
					id: "15fc56ba-a74e-4cf8-b4b0-bada5c101541",
					productId: "PRODUCTID",
					variantId: 1,
					quantity: 1,
				} as unknown as LineItem,
			],
			customLineItems: [],
			totalPrice: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 10000,
				fractionDigits: 2,
			},
			cartState: "Active",
			shippingMode: "Single",
			shipping: [],
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			taxCalculationMode: "UnitPriceLevel",
			refusedGifts: [],
			origin: "Customer",
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
			customerEmail: "john.doe@example.com",
			customerGroup: {
				id: "1234567890",
				typeId: "customer-group",
			},
			customerId: "1234567890",
			custom: {
				type: {
					typeId: "type",
					id: "1234567890",
				},
				fields: {
					description: "example description",
				},
			},

			shippingAddress: {
				id: "1234567890",
				country: "NL",
				firstName: "John",
				lastName: "Doe",
				streetName: "Main Street",
				streetNumber: "123",
				postalCode: "123456",
			},
			shippingInfo: {
				shippingMethodName: "Standard Shipping",
				price: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1000,
					fractionDigits: 2,
				},
				shippingRate: {
					price: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 1000,
						fractionDigits: 2,
					},
					tiers: [],
				},
				shippingMethodState: "Shipped",
			},
			taxedPrice: {
				totalNet: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1000,
					fractionDigits: 2,
				},
				taxPortions: [],
				totalGross: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 1210,
					fractionDigits: 2,
				},
			},
			taxedShippingPrice: {
				totalNet: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 100,
					fractionDigits: 2,
				},
				taxPortions: [],
				totalGross: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 121,
					fractionDigits: 2,
				},
			},
		};

		storage.add("dummy", "cart", cart);
		const ctx = { projectKey: "dummy" };

		const result = repository.create(ctx, {
			cart: {
				id: cart.id,
				typeId: "cart",
			},
			cartVersion: cart.version,
		});
		expect(result.cart?.id).toBe(cart.id);

		const items = repository.query(ctx);
		expect(items.count).toBe(1);

		expect(result.billingAddress).toEqual(cart.billingAddress);
		expect(result.cart?.id).toEqual(cart.id);
		expect(result.country).toEqual(cart.country);
		expect(result.custom).toEqual(cart.custom);
		expect(result.customerGroup).toEqual(cart.customerGroup);
		expect(result.customer.id).toEqual(cart.customerId);
		expect(result.customLineItems).toEqual(cart.customLineItems);
		expect(result.directDiscounts).toEqual(cart.directDiscounts);
		expect(result.lineItems).toEqual(cart.lineItems);
		expect(result.paymentInfo).toEqual(cart.paymentInfo);
		expect(result.shippingAddress).toEqual(cart.shippingAddress);
		expect(result.taxCalculationMode).toEqual(cart.taxCalculationMode);
		expect(result.taxedPrice).toEqual(cart.taxedPrice);
		expect(result.taxMode).toEqual(cart.taxMode);
		expect(result.taxRoundingMode).toEqual(cart.taxRoundingMode);
		expect(result.totalPrice).toEqual(cart.totalPrice);
		expect(result.store).toEqual(cart.store);
	});
});
