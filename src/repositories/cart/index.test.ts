import type {
	Cart,
	CartDraft,
	CustomLineItemDraft,
	LineItem,
} from "@commercetools/platform-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import { InMemoryStorage } from "~src/storage";
import { CartRepository } from "./index";

describe("Cart repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CartRepository(config);

	storage.add("dummy", "type", {
		...getBaseResourceProperties(),
		id: "1234567890",
		key: "custom-type-key",
		name: { "nl-NL": "custom-type-name" },
		resourceTypeIds: [],
		fieldDefinitions: [],
	});

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
					attributes: [],
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
					attributes: [],
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

		storage.add("dummy", "tax-category", {
			...getBaseResourceProperties(),
			id: "tax-category-id",
			key: "standard-tax",
			name: "Standard Tax",
			rates: [
				{
					id: "nl-rate",
					name: "Standard VAT",
					amount: 0.21,
					includedInPrice: false,
					country: "NL",
				},
			],
		});

		storage.add("dummy", "zone", {
			...getBaseResourceProperties(),
			id: "nl-zone-id",
			key: "nl-zone",
			name: "Netherlands Zone",
			locations: [
				{
					country: "NL",
				},
			],
		});

		storage.add("dummy", "shipping-method", {
			...getBaseResourceProperties(),
			id: "shipping-method-id",
			key: "standard-shipping",
			name: "Standard Shipping",
			taxCategory: {
				typeId: "tax-category",
				id: "tax-category-id",
			},
			zoneRates: [
				{
					zone: {
						typeId: "zone",
						id: "nl-zone-id",
						obj: {
							...getBaseResourceProperties(),
							id: "nl-zone-id",
							key: "nl-zone",
							name: "Netherlands Zone",
							locations: [
								{
									country: "NL",
								},
							],
						},
					},
					shippingRates: [
						{
							price: {
								currencyCode: "EUR",
								centAmount: 500,
								type: "centPrecision",
								fractionDigits: 2,
							},
							tiers: [],
						},
					],
				},
			],
			active: true,
			isDefault: false,
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
			shippingMethod: {
				typeId: "shipping-method",
				id: "shipping-method-id",
			},
			customLineItems: [
				{
					name: { "nl-NL": "Douane kosten" },
					slug: "customs-fee",
					money: {
						currencyCode: "EUR",
						centAmount: 2500,
					},
					quantity: 1,
					taxCategory: {
						typeId: "tax-category" as const,
						id: "tax-category-id",
					},
				},
			],
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
					custom: {
						type: {
							typeId: "type",
							id: "1234567890",
						},
						fields: {
							description: "example description",
						},
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
		expect(result.lineItems[0].custom?.fields.description as string).toEqual(
			cart.lineItems![0].custom?.fields?.description,
		);
		expect(result.customLineItems).toHaveLength(1);
		expect(result.customLineItems[0].name).toEqual(
			cart.customLineItems?.[0].name,
		);
		expect(result.totalPrice.centAmount).toBe(3500);

		expect(result.shippingInfo).toBeDefined();
		expect(result.shippingInfo!.shippingMethod!.id).toBe("shipping-method-id");
		expect(result.shippingInfo!.shippingMethodName).toBe("Standard Shipping");
		expect(result.shippingInfo?.price).toBeDefined();
		expect(result.shippingInfo?.price.centAmount).toBe(500);
		expect(result.shippingInfo?.price.currencyCode).toBe("EUR");
		expect(result.shippingInfo?.taxedPrice).toBeDefined();
		expect(result.shippingInfo?.taxedPrice?.totalGross.centAmount).toBe(605);
		expect(result.shippingInfo?.taxedPrice?.totalNet.centAmount).toBe(500);
		expect(result.shippingInfo?.taxRate?.amount).toBe(0.21);
		expect(result.shippingInfo?.taxRate?.name).toBe("Standard VAT");
	});

	test("create cart with business unit", async () => {
		storage.add("dummy", "business-unit", {
			...getBaseResourceProperties(),
			unitType: "Company",
			key: "business-unit-key",
			status: "Active",
			storeMode: "Explicit",
			name: "Test",
			addresses: [],
			associateMode: "Explicit",
			associates: [],
			topLevelUnit: {
				typeId: "business-unit",
				key: "business-unit-key",
			},
			approvalRuleMode: "Explicit",
		});

		const cart: CartDraft = {
			country: "NL",
			currency: "EUR",
			businessUnit: {
				typeId: "business-unit",
				key: "business-unit-key",
			},
		};

		const ctx = { projectKey: "dummy", storeKey: "dummyStore" };

		const result = repository.create(ctx, cart);
		expect(result.id).toBeDefined();

		expect(result.businessUnit).toEqual({
			key: "business-unit-key",
			typeId: "business-unit",
		});
	});

	test("should calculate taxed price for custom line items with tax category", () => {
		storage.add("dummy", "tax-category", {
			...getBaseResourceProperties(),
			id: "tax-category-with-rate",
			key: "vat-tax",
			name: "VAT Tax",
			rates: [
				{
					id: "rate-1",
					name: "Standard VAT",
					amount: 0.21,
					includedInPrice: false,
					country: "NL",
				},
			],
		});

		const cart: CartDraft = {
			currency: "EUR",
			country: "NL",
			customLineItems: [
				{
					name: { en: "Service Fee" },
					slug: "service-fee",
					money: {
						currencyCode: "EUR",
						centAmount: 1000,
					},
					quantity: 1,
					taxCategory: {
						typeId: "tax-category" as const,
						id: "tax-category-with-rate",
					},
				},
			],
		};

		const ctx = { projectKey: "dummy", storeKey: "dummyStore" };
		const result = repository.create(ctx, cart);

		expect(result.customLineItems).toHaveLength(1);
		const customLineItem = result.customLineItems[0];

		expect(customLineItem.taxedPrice).toBeDefined();
		expect(customLineItem.taxedPrice?.totalGross.centAmount).toBe(1210);
		expect(customLineItem.taxedPrice?.totalNet.centAmount).toBe(1000);
		expect(customLineItem.taxedPrice?.totalTax?.centAmount).toBe(210);
		expect(customLineItem.taxedPrice?.taxPortions).toHaveLength(1);
		expect(customLineItem.taxedPrice?.taxPortions[0].rate).toBe(0.21);
		expect(customLineItem.taxRate).toBeDefined();
		expect(customLineItem.taxRate?.amount).toBe(0.21);
		expect(customLineItem.taxRate?.name).toBe("Standard VAT");
		expect(customLineItem.taxRate?.includedInPrice).toBe(false);
		expect(customLineItem.taxRate?.country).toBe("NL");
	});
});

describe("createShippingInfo", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CartRepository(config);

	beforeEach(() => {
		storage.add("dummy", "tax-category", {
			...getBaseResourceProperties(),
			id: "shipping-tax-category-id",
			key: "shipping-tax",
			name: "Shipping Tax",
			rates: [
				{
					id: "nl-shipping-rate",
					name: "Standard VAT",
					amount: 0.21,
					includedInPrice: false,
					country: "NL",
				},
			],
		});

		storage.add("dummy", "zone", {
			...getBaseResourceProperties(),
			id: "test-zone-id",
			name: "Test Zone",
			locations: [
				{
					country: "NL",
				},
			],
		});
	});

	test("should calculate shipping info", () => {
		storage.add("dummy", "shipping-method", {
			...getBaseResourceProperties(),
			id: "basic-shipping-id",
			name: "Standard Shipping",
			taxCategory: {
				typeId: "tax-category",
				id: "shipping-tax-category-id",
			},
			zoneRates: [
				{
					zone: {
						typeId: "zone",
						id: "test-zone-id",
						obj: {
							...getBaseResourceProperties(),
							id: "test-zone-id",
							name: "Test Zone",
							locations: [
								{
									country: "NL",
								},
							],
						},
					},
					shippingRates: [
						{
							price: {
								currencyCode: "EUR",
								centAmount: 595,
								type: "centPrecision",
								fractionDigits: 2,
							},
							tiers: [],
						},
					],
				},
			],
			active: true,
			isDefault: false,
		});

		const cart: any = {
			...getBaseResourceProperties(),
			id: "basic-cart-id",
			version: 1,
			cartState: "Active",
			totalPrice: {
				currencyCode: "EUR",
				centAmount: 3000,
				type: "centPrecision",
				fractionDigits: 2,
			},
			shippingAddress: {
				country: "NL",
			},
			taxRoundingMode: "HalfEven",
		};

		const context = { projectKey: "dummy", storeKey: "testStore" };
		const shippingMethodRef = {
			typeId: "shipping-method" as const,
			id: "basic-shipping-id",
		};

		const result = repository.createShippingInfo(
			context,
			cart,
			shippingMethodRef,
		);

		expect(result.price.centAmount).toBe(595);
		expect(result.shippingMethodName).toBe("Standard Shipping");
		expect(result.shippingMethod!.id).toBe("basic-shipping-id");
		expect(result.taxRate?.amount).toBe(0.21);
		expect(result.taxedPrice!.totalNet.centAmount).toBe(595);
		expect(result.taxedPrice!.totalGross.centAmount).toBe(720);
	});

	test("should apply free shipping when cart total is above freeAbove threshold", () => {
		storage.add("dummy", "shipping-method", {
			...getBaseResourceProperties(),
			id: "free-above-shipping-id",
			key: "free-above-shipping",
			name: "Free Above €50",
			taxCategory: {
				typeId: "tax-category",
				id: "shipping-tax-category-id",
			},
			zoneRates: [
				{
					zone: {
						typeId: "zone",
						id: "test-zone-id",
						obj: {
							...getBaseResourceProperties(),
							id: "test-zone-id",
							key: "test-zone",
							name: "Test Zone",
							locations: [
								{
									country: "NL",
								},
							],
						},
					},
					shippingRates: [
						{
							price: {
								currencyCode: "EUR",
								centAmount: 995,
								type: "centPrecision",
								fractionDigits: 2,
							},
							freeAbove: {
								currencyCode: "EUR",
								centAmount: 5000,
								type: "centPrecision",
								fractionDigits: 2,
							},
							tiers: [],
						},
					],
				},
			],
			active: true,
			isDefault: false,
		});

		const cart: any = {
			...getBaseResourceProperties(),
			id: "test-cart-id",
			version: 1,
			cartState: "Active",
			totalPrice: {
				currencyCode: "EUR",
				centAmount: 6000,
				type: "centPrecision",
				fractionDigits: 2,
			},
			shippingAddress: {
				country: "NL",
			},
			taxRoundingMode: "HalfEven",
		};

		const context = { projectKey: "dummy", storeKey: "testStore" };
		const shippingMethodRef = {
			typeId: "shipping-method" as const,
			id: "free-above-shipping-id",
		};

		const result = repository.createShippingInfo(
			context,
			cart,
			shippingMethodRef,
		);

		expect(result.price.centAmount).toBe(0);
		expect(result.shippingMethodName).toBe("Free Above €50");
		expect(result.taxedPrice!.totalGross.centAmount).toBe(0);
		expect(result.taxedPrice!.totalNet.centAmount).toBe(0);
	});

	test("should charge normal shipping when cart total is below freeAbove threshold", () => {
		storage.add("dummy", "shipping-method", {
			...getBaseResourceProperties(),
			id: "free-above-shipping-id-2",
			key: "free-above-shipping-2",
			name: "Free Above €50",
			taxCategory: {
				typeId: "tax-category",
				id: "shipping-tax-category-id",
			},
			zoneRates: [
				{
					zone: {
						typeId: "zone",
						id: "test-zone-id",
						obj: {
							...getBaseResourceProperties(),
							id: "test-zone-id",
							key: "test-zone",
							name: "Test Zone",
							locations: [
								{
									country: "NL",
								},
							],
						},
					},
					shippingRates: [
						{
							price: {
								currencyCode: "EUR",
								centAmount: 995,
								type: "centPrecision",
								fractionDigits: 2,
							},
							freeAbove: {
								currencyCode: "EUR",
								centAmount: 5000,
								type: "centPrecision",
								fractionDigits: 2,
							},
							tiers: [],
						},
					],
				},
			],
			active: true,
			isDefault: false,
		});

		const cart: any = {
			...getBaseResourceProperties(),
			id: "test-cart-id-2",
			version: 1,
			cartState: "Active",
			totalPrice: {
				currencyCode: "EUR",
				centAmount: 2000,
				type: "centPrecision",
				fractionDigits: 2,
			},
			shippingAddress: {
				country: "NL",
			},
			taxRoundingMode: "HalfEven",
		};

		const context = { projectKey: "dummy", storeKey: "testStore" };
		const shippingMethodRef = {
			typeId: "shipping-method" as const,
			id: "free-above-shipping-id-2",
		};

		const result = repository.createShippingInfo(
			context,
			cart,
			shippingMethodRef,
		);

		expect(result.price.centAmount).toBe(995);
		expect(result.shippingMethodName).toBe("Free Above €50");
		expect(result.taxedPrice!.totalGross.centAmount).toBe(1204);
		expect(result.taxedPrice!.totalNet.centAmount).toBe(995);
	});
});
