import assert from "node:assert";
import type {
	Address,
	Cart,
	CentPrecisionMoney,
	HighPrecisionMoneyDraft,
	ProductDraft,
	ShippingMethod,
	ShippingMethodDraft,
	ShippingMethodResourceIdentifier,
	TaxCategory,
	TaxCategoryDraft,
	Zone,
} from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { calculateMoneyTotalCentAmount } from "#src/repositories/helpers.ts";
import { customerDraftFactory } from "#src/testing/customer.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Carts Query", () => {
	const ctMock = new CommercetoolsMock();

	beforeEach(async () => {
		let response;
		response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-cart",
				name: {
					en: "Test",
				},
				description: {
					en: "Test Type",
				},
				resourceTypeIds: ["order"],
				fieldDefinitions: [
					{
						name: "offer_name",
						label: {
							en: "offer_name",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		expect(response.statusCode).toBe(201);

		response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
				currency: "EUR",
				custom: {
					type: {
						typeId: "type",
						key: "my-cart",
					},
					fields: {
						description: "example description",
					},
				},
			},
		});
		expect(response.statusCode).toBe(201);
	});

	test("no filter", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/carts?expand=custom.type",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBe(1);

		const myCart = response.json().results[0] as Cart;

		expect(myCart.custom?.type.id).not.toBeUndefined();
		expect(myCart.custom?.type.id).toBe(myCart.custom?.type.obj?.id);
		expect(myCart.custom?.type.obj?.description?.en).toBe("Test Type");
	});

	test("throw error when anonymousId and customerId are given", async () => {
		const customerId = "400be09e-bfe8-4925-a307-4ef6280b063e";
		const anonymousId = "a99f27d1-7e7e-4592-8d5a-aa5da1adfe24";
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
				currency: "EUR",
				anonymousId,
				customerId,
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toBe(
			"Can set only one of customer OR anonymousId",
		);
	});

	test("create cart with existing customer", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
				currency: "EUR",
				customerId: customer.id,
			},
		});
		expect(response.statusCode).toBe(201);
		expect(response.json().customerId).toBe(customer.id);
	});
});

describe("Cart Update Actions", () => {
	const ctMock = new CommercetoolsMock();
	let cart: Cart | undefined;
	let taxCategory: TaxCategory;

	const createCart = async (currency: string) => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
				currency,
				country: "NL",
			},
		});
		expect(response.statusCode).toBe(201);
		cart = response.json();
	};

	const createZone = async (country: string): Promise<Zone> => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: {
				name: country,
				locations: [
					{
						country,
					},
				],
			},
		});
		expect(response.statusCode).toBe(201);
		return response.json();
	};

	const createTaxCategory = async (
		draft: TaxCategoryDraft,
	): Promise<TaxCategory> => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/tax-categories",
			payload: draft,
		});
		expect(response.statusCode).toBe(201);
		return response.json();
	};

	const createShippingMethod = async (
		draft: ShippingMethodDraft,
	): Promise<ShippingMethod> => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/shipping-methods",
			payload: draft,
		});
		expect(response.statusCode).toBe(201);
		return response.json();
	};

	const productDraft: ProductDraft = {
		name: {
			"nl-NL": "test product",
		},
		productType: {
			typeId: "product-type",
			id: "some-uuid",
		},
		masterVariant: {
			sku: "1337",
			prices: [
				{
					value: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 14900,
						fractionDigits: 2,
					} as CentPrecisionMoney,
				},
				{
					value: {
						type: "centPrecision",
						currencyCode: "GBP",
						centAmount: 18900,
						fractionDigits: 2,
					} as CentPrecisionMoney,
				},
			],

			attributes: [
				{
					name: "test",
					value: "test",
				},
			],
		},
		variants: [
			{
				sku: "1338",
				prices: [
					{
						value: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 14900,
							fractionDigits: 2,
						} as CentPrecisionMoney,
					},
				],
				attributes: [
					{
						name: "test2",
						value: "test2",
					},
				],
			},
		],
		slug: {
			"nl-NL": "test-product",
		},
		publish: true,
	};

	beforeEach(async () => {
		await createCart("EUR");
		taxCategory = await createTaxCategory({
			name: "Standard VAT",
			key: "standard-vat",
			rates: [
				{
					name: "NL VAT",
					amount: 0.21,
					includedInPrice: false,
					country: "NL",
				},
			],
		});
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no update", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().locale).toBe("nl-NL");

		const responseAgain = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 2,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			},
		});
		expect(responseAgain.statusCode).toBe(200);
		expect(responseAgain.json().version).toBe(2);
		expect(responseAgain.json().locale).toBe("nl-NL");
	});

	test("addLineItem", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toHaveLength(1);
		expect(response.json().totalPrice.centAmount).toEqual(14900);
	});

	test("addLineItem by SKU", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "addLineItem", sku: "1337", quantity: 2 }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toHaveLength(1);
		expect(response.json().totalPrice.centAmount).toEqual(29800);
	});

	test.each([
		["EUR", 29800],
		["GBP", 37800],
	])("addLineItem with price selection", async (currency, total) => {
		await createCart(currency);

		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "addLineItem", sku: "1337", quantity: 2 }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toHaveLength(1);
		expect(response.json().lineItems[0].price.value.currencyCode).toBe(currency);
		expect(response.json().totalPrice.centAmount).toEqual(total);
	});

	test("addLineItem with custom field", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-type",
				name: {
					en: "My Type",
				},
				description: {
					en: "My Type Description",
				},
				fieldDefinitions: [
					{
						name: "foo",
						label: {
							en: "foo",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		assert(type, "type not created");
		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addLineItem",
						sku: "1337",
						quantity: 2,
						custom: {
							type: { typeId: "type", key: "my-type" },
							fields: { foo: "bar" },
						},
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toHaveLength(1);
		expect(response.json().lineItems[0].custom).toEqual({
			type: { typeId: "type", id: expect.any(String) },
			fields: { foo: "bar" },
		});
	});

	test("addLineItem with key", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-type",
				name: {
					en: "My Type",
				},
				description: {
					en: "My Type Description",
				},
				fieldDefinitions: [
					{
						name: "foo",
						label: {
							en: "foo",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		assert(type, "type not created");
		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addLineItem",
						sku: "1337",
						key: "my-key",
						quantity: 2,
						custom: {
							type: { typeId: "type", key: "my-type" },
							fields: { foo: "bar" },
						},
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toHaveLength(1);
		expect(response.json().lineItems[0].key).toBeDefined();
		expect(response.json().lineItems[0].key).toBe("my-key");
	});

	test("addLineItem unknown product", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "addLineItem", productId: "123", variantId: 1 }],
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toBe("A product with ID '123' not found.");
	});

	test("addItemShippingAddress", async () => {
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});

		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addItemShippingAddress",
						address: {
							firstName: "John",
							lastName: "Doe",
							company: "My Company",
							country: "NL",
						},
					},
				],
			},
		});

		expect(response.json().itemShippingAddresses).toHaveLength(1);
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toHaveLength(0);
	});

	test("changeTaxRoundingMode", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "changeTaxRoundingMode",
						taxRoundingMode: "HalfUp",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().taxRoundingMode).toBe("HalfUp");
	});

	test("recalculate", async () => {
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});

		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "recalculate",
						updateProductData: true,
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(1);
	});

	test("removeLineItem", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(cart, "cart not created");
		assert(product, "product not created");

		const updatedCart = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			},
		});
		const lineItem = updatedCart.json().lineItems[0];
		assert(lineItem, "lineItem not created");

		expect(updatedCart.json().lineItems).toHaveLength(1);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: updatedCart.json().version,
				actions: [{ action: "removeLineItem", lineItemId: lineItem.id }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().lineItems).toHaveLength(0);
	});

	test("removeLineItem decrease quantity", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(cart, "cart not created");
		assert(product, "product not created");

		const updatedCart = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
						quantity: 2,
					},
				],
			},
		});
		const lineItem = updatedCart.json().lineItems[0];
		assert(lineItem, "lineItem not created");

		expect(updatedCart.json().lineItems).toHaveLength(1);
		expect(updatedCart.json().lineItems[0].quantity).toBe(2);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: updatedCart.json().version,
				actions: [
					{ action: "removeLineItem", lineItemId: lineItem.id, quantity: 1 },
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().lineItems).toHaveLength(1);
		expect(response.json().lineItems[0].quantity).toBe(1);
	});

	test("setBillingAddress", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setBillingAddress", address }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().billingAddress).toEqual({
			...address,
			id: expect.any(String),
		});
	});

	test("setCountry", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setCountry", country: "BE" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().country).toBe("BE");
	});

	test("setDirectDiscounts", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setDirectDiscounts",
						discounts: [
							{
								target: { type: "totalPrice" },
								value: {
									money: [
										{
											centAmount: 500,
											currencyCode: "EUR",
											fractionDigits: 2,
											type: "centPrecision",
										},
									],
									type: "absolute",
								},
							},
						],
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().directDiscounts).toMatchObject([
			{
				id: expect.any(String),
				target: { type: "totalPrice" },
				value: {
					money: [
						{
							centAmount: 500,
							currencyCode: "EUR",
							fractionDigits: 2,
							type: "centPrecision",
						},
					],
					type: "absolute",
				},
			},
		]);
	});

	test("setLineItemPrice sets an external price for a line item", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const baseCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: { currency: "EUR" },
		});
		expect(baseCartResponse.statusCode).toBe(201);
		const baseCart = baseCartResponse.json() as Cart;

		const addLineItemResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${baseCart.id}`,
			payload: {
				version: baseCart.version,
				actions: [
					{
						action: "addLineItem",
						sku: product.masterData.current.masterVariant.sku,
						quantity: 2,
						key: "line-item-key",
					},
				],
			},
		});
		expect(addLineItemResponse.statusCode).toBe(200);
		const cartWithLineItem = addLineItemResponse.json() as Cart;
		const lineItem = cartWithLineItem.lineItems[0];
		assert(lineItem, "lineItem not created");

		const externalPrice: CentPrecisionMoney = {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 2500,
			fractionDigits: 2,
		};

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartWithLineItem.id}`,
			payload: {
				version: cartWithLineItem.version,
				actions: [
					{
						action: "setLineItemPrice",
						lineItemKey: lineItem.key,
						externalPrice,
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(cartWithLineItem.version + 1);
		expect(response.json().lineItems).toHaveLength(1);

		const updatedLineItem = response.json().lineItems[0];
		expect(updatedLineItem.priceMode).toBe("ExternalPrice");
		expect(updatedLineItem.price.value.centAmount).toBe(
			externalPrice.centAmount,
		);
		expect(updatedLineItem.price.value.currencyCode).toBe(
			externalPrice.currencyCode,
		);
		expect(updatedLineItem.totalPrice.centAmount).toBe(
			externalPrice.centAmount * updatedLineItem.quantity,
		);
		expect(response.json().totalPrice.centAmount).toBe(
			externalPrice.centAmount * updatedLineItem.quantity,
		);
	});

	test("setLineItemPrice supports high precision external price", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const baseCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: { currency: "EUR" },
		});
		expect(baseCartResponse.statusCode).toBe(201);
		const baseCart = baseCartResponse.json() as Cart;

		const addLineItemResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${baseCart.id}`,
			payload: {
				version: baseCart.version,
				actions: [
					{
						action: "addLineItem",
						sku: product.masterData.current.masterVariant.sku,
						quantity: 2,
					},
				],
			},
		});
		expect(addLineItemResponse.statusCode).toBe(200);
		const cartWithLineItem = addLineItemResponse.json() as Cart;
		const lineItem = cartWithLineItem.lineItems[0];
		assert(lineItem, "lineItem not created");

		const externalPrice: HighPrecisionMoneyDraft = {
			type: "highPrecision",
			currencyCode: "EUR",
			fractionDigits: 3,
			preciseAmount: 1015,
		};
		const expectedUnitCentAmount = calculateMoneyTotalCentAmount(
			externalPrice,
			1,
		);
		const expectedTotalCentAmount = calculateMoneyTotalCentAmount(
			externalPrice,
			2,
		);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartWithLineItem.id}`,
			payload: {
				version: cartWithLineItem.version,
				actions: [
					{
						action: "setLineItemPrice",
						lineItemId: lineItem.id,
						externalPrice,
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(cartWithLineItem.version + 1);
		expect(response.json().lineItems).toHaveLength(1);

		const updatedLineItem = response.json().lineItems[0];
		expect(updatedLineItem.priceMode).toBe("ExternalPrice");
		expect(updatedLineItem.price.value.type).toBe("highPrecision");
		expect(updatedLineItem.price.value.currencyCode).toBe(
			externalPrice.currencyCode,
		);
		expect(updatedLineItem.price.value.fractionDigits).toBe(
			externalPrice.fractionDigits,
		);
		expect(updatedLineItem.price.value.preciseAmount).toBe(
			externalPrice.preciseAmount,
		);
		expect(updatedLineItem.price.value.centAmount).toBe(expectedUnitCentAmount);
		expect(updatedLineItem.totalPrice.centAmount).toBe(expectedTotalCentAmount);
		expect(response.json().totalPrice.centAmount).toBe(expectedTotalCentAmount);
	});

	test("setLineItemPrice supports high precision external price with fractionDigits 5", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const baseCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: { currency: "EUR" },
		});
		expect(baseCartResponse.statusCode).toBe(201);
		const baseCart = baseCartResponse.json() as Cart;

		const addLineItemResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${baseCart.id}`,
			payload: {
				version: baseCart.version,
				actions: [
					{
						action: "addLineItem",
						sku: product.masterData.current.masterVariant.sku,
						quantity: 2,
					},
				],
			},
		});
		expect(addLineItemResponse.statusCode).toBe(200);
		const cartWithLineItem = addLineItemResponse.json() as Cart;
		const lineItem = cartWithLineItem.lineItems[0];
		assert(lineItem, "lineItem not created");

		const externalPrice: HighPrecisionMoneyDraft = {
			type: "highPrecision",
			currencyCode: "EUR",
			fractionDigits: 5,
			preciseAmount: 101499,
		};
		const expectedUnitCentAmount = calculateMoneyTotalCentAmount(
			externalPrice,
			1,
		);
		const expectedTotalCentAmount = calculateMoneyTotalCentAmount(
			externalPrice,
			2,
		);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartWithLineItem.id}`,
			payload: {
				version: cartWithLineItem.version,
				actions: [
					{
						action: "setLineItemPrice",
						lineItemId: lineItem.id,
						externalPrice,
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(cartWithLineItem.version + 1);
		expect(response.json().lineItems).toHaveLength(1);

		const updatedLineItem = response.json().lineItems[0];
		expect(updatedLineItem.priceMode).toBe("ExternalPrice");
		expect(updatedLineItem.price.value.type).toBe("highPrecision");
		expect(updatedLineItem.price.value.currencyCode).toBe(
			externalPrice.currencyCode,
		);
		expect(updatedLineItem.price.value.fractionDigits).toBe(
			externalPrice.fractionDigits,
		);
		expect(updatedLineItem.price.value.preciseAmount).toBe(
			externalPrice.preciseAmount,
		);
		expect(updatedLineItem.price.value.centAmount).toBe(expectedUnitCentAmount);
		expect(updatedLineItem.totalPrice.centAmount).toBe(expectedTotalCentAmount);
		expect(response.json().totalPrice.centAmount).toBe(expectedTotalCentAmount);
	});

	test("setLineItemPrice fails when the money uses another currency", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const baseCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: { currency: "EUR" },
		});
		expect(baseCartResponse.statusCode).toBe(201);
		const baseCart = baseCartResponse.json() as Cart;

		const addLineItemResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${baseCart.id}`,
			payload: {
				version: baseCart.version,
				actions: [
					{
						action: "addLineItem",
						sku: product.masterData.current.masterVariant.sku,
						quantity: 1,
					},
				],
			},
		});
		expect(addLineItemResponse.statusCode).toBe(200);
		const cartWithLineItem = addLineItemResponse.json() as Cart;
		const lineItem = cartWithLineItem.lineItems[0];
		assert(lineItem, "lineItem not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartWithLineItem.id}`,
			payload: {
				version: cartWithLineItem.version,
				actions: [
					{
						action: "setLineItemPrice",
						lineItemId: lineItem.id,
						externalPrice: {
							type: "centPrecision",
							currencyCode: "USD",
							centAmount: 5000,
							fractionDigits: 2,
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().message).toContain("Currency mismatch");
	});

	test("setLineItemPrice removes external price when no value is provided", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const baseCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: { currency: "EUR" },
		});
		expect(baseCartResponse.statusCode).toBe(201);
		const baseCart = baseCartResponse.json() as Cart;

		const addLineItemResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${baseCart.id}`,
			payload: {
				version: baseCart.version,
				actions: [
					{
						action: "addLineItem",
						sku: product.masterData.current.masterVariant.sku,
						quantity: 1,
					},
				],
			},
		});
		expect(addLineItemResponse.statusCode).toBe(200);
		const cartWithLineItem = addLineItemResponse.json() as Cart;
		const lineItem = cartWithLineItem.lineItems[0];
		assert(lineItem, "lineItem not created");

		const externalPrice: CentPrecisionMoney = {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 1000,
			fractionDigits: 2,
		};

		const setExternalPriceResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartWithLineItem.id}`,
			payload: {
				version: cartWithLineItem.version,
				actions: [
					{
						action: "setLineItemPrice",
						lineItemId: lineItem.id,
						externalPrice,
					},
				],
			},
		});
		expect(setExternalPriceResponse.statusCode).toBe(200);
		const cartWithExternalPrice = setExternalPriceResponse.json() as Cart;
		expect(cartWithExternalPrice.lineItems[0].priceMode).toBe("ExternalPrice");

		const resetResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartWithExternalPrice.id}`,
			payload: {
				version: cartWithExternalPrice.version,
				actions: [
					{
						action: "setLineItemPrice",
						lineItemId: lineItem.id,
					},
				],
			},
		});

		expect(resetResponse.statusCode).toBe(200);
		expect(resetResponse.json().version).toBe(cartWithExternalPrice.version + 1);
		expect(resetResponse.json().lineItems).toHaveLength(1);

		const revertedLineItem = resetResponse.json().lineItems[0];
		const expectedCentAmount =
			product.masterData.current.masterVariant.prices?.[0].value.centAmount;
		if (typeof expectedCentAmount !== "number") {
			throw new Error("product price not found");
		}
		expect(revertedLineItem.priceMode).toBe("Platform");
		expect(revertedLineItem.price.value.centAmount).toBe(expectedCentAmount);
		expect(revertedLineItem.totalPrice.centAmount).toBe(
			expectedCentAmount * revertedLineItem.quantity,
		);
		expect(resetResponse.json().totalPrice.centAmount).toBe(
			expectedCentAmount * revertedLineItem.quantity,
		);
	});

	test("setLineItemCustomField", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-type",
				name: {
					en: "My Type",
				},
				description: {
					en: "My Type Description",
				},
				fieldDefinitions: [
					{
						name: "foo",
						label: {
							en: "foo",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		assert(type, "type not created");

		const myCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
				currency: "EUR",
				lineItems: [
					{
						sku: product.masterData.current.masterVariant.sku,
						quantity: 1,
						custom: {
							type: {
								typeId: "type",
								key: "my-type",
							},
							fields: {},
						},
					},
				],
			},
		});
		const myCart = myCartResponse.json();

		const lineItem = myCart.lineItems[0];
		assert(lineItem, "lineItem not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${myCart.id}`,
			payload: {
				version: myCart.version,
				actions: [
					{
						action: "setLineItemCustomField",
						lineItemId: lineItem.id,
						name: "foo",
						value: "bar",
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toMatchObject([
			{
				id: lineItem.id,
				custom: {
					fields: {
						foo: "bar",
					},
				},
			},
		]);
	});

	test("setLineItemCustomType", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(product, "product not created");

		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-type",
				name: {
					en: "My Type",
				},
				description: {
					en: "My Type Description",
				},
				fieldDefinitions: [
					{
						name: "foo",
						label: {
							en: "foo",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		assert(type, "type not created");

		const myCartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
				currency: "EUR",
				lineItems: [
					{
						sku: product.masterData.current.masterVariant.sku,
						quantity: 1,
					},
				],
			},
		});
		const myCart = myCartResponse.json();

		const lineItem = myCart.lineItems[0];
		assert(lineItem, "lineItem not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${myCart.id}`,
			payload: {
				version: myCart.version,
				actions: [
					{
						action: "setLineItemCustomType",
						lineItemId: lineItem.id,
						type: {
							typeId: "type",
							key: "my-type",
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lineItems).toMatchObject([
			{
				id: lineItem.id,
				custom: {
					type: {
						typeId: "type",
						id: type.id,
					},
				},
			},
		]);
	});

	test("setCustomerEmail", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setCustomerEmail", email: "john@doe.com" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().customerEmail).toBe("john@doe.com");
	});

	test("setShippingAddress", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setShippingAddress", address }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().shippingAddress).toEqual(address);
	});

	test("setBillingAddressCustomType", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-type",
				name: {
					en: "My Type",
				},
				description: {
					en: "My Type Description",
				},
				fieldDefinitions: [
					{
						name: "foo",
						label: {
							en: "foo",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		assert(type, "type not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setBillingAddress", address },
					{
						action: "setBillingAddressCustomType",
						type: {
							typeId: "type",
							type: "my-type",
							key: "my-type",
						},
						fields: {
							foo: "bar",
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().billingAddress).toEqual({
			...address,
			id: expect.any(String),
			custom: {
				type: { typeId: "type", id: type.id },
				fields: { foo: "bar" },
			},
		});
	});

	test("setShippingAddressCustomType", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "my-type",
				name: {
					en: "My Type",
				},
				description: {
					en: "My Type Description",
				},
				fieldDefinitions: [
					{
						name: "foo",
						label: {
							en: "foo",
						},
						required: false,
						type: {
							name: "String",
						},
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		assert(type, "type not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setShippingAddress", address },
					{
						action: "setShippingAddressCustomType",
						type: {
							typeId: "type",
							type: "my-type",
							key: "my-type",
						},
						fields: {
							foo: "bar",
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().shippingAddress).toEqual({
			...address,
			custom: {
				type: { typeId: "type", id: type.id },
				fields: { foo: "bar" },
			},
		});
	});

	describe("setShippingMethod", () => {
		let standardShippingMethod: ShippingMethod;
		let standardExcludedShippingMethod: ShippingMethod;
		beforeEach(async () => {
			assert(cart, "cart not created");
			const nlZone = await createZone("NL");
			const frZone = await createZone("FR");
			const standardTax = await createTaxCategory({
				name: "Standard tax category",
				key: "standard",
				rates: [
					{
						name: "FR standard tax rate",
						amount: 0.2,
						includedInPrice: true,
						country: "FR",
					},
					{
						name: "NL standard tax rate",
						amount: 0.21,
						includedInPrice: true,
						country: "NL",
					},
				],
			});
			await createTaxCategory({
				name: "Reduced tax category",
				key: "reduced",
				rates: [
					{
						name: "FR reduced tax rate",
						amount: 0.1,
						includedInPrice: true,
						country: "FR",
					},
					{
						name: "NL reduced tax rate",
						amount: 0.09,
						includedInPrice: true,
						country: "NL",
					},
				],
			});
			const standardExcludedTax = await createTaxCategory({
				name: "Tax category that is excluded from price",
				key: "standard-excluded",
				rates: [
					{
						name: "FR standard-excluded tax rate",
						amount: 0.2,
						includedInPrice: false,
						country: "FR",
					},
					{
						name: "NL standard-excluded tax rate",
						amount: 0.21,
						includedInPrice: false,
						country: "NL",
					},
				],
			});
			standardShippingMethod = await createShippingMethod({
				isDefault: false,
				key: "standard",
				name: "Standard shipping",
				taxCategory: {
					typeId: "tax-category",
					id: standardTax.id,
				},
				zoneRates: [
					{
						zone: {
							typeId: "zone",
							id: nlZone.id,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 499,
									fractionDigits: 2,
								},
							},
						],
					},
					{
						zone: {
							typeId: "zone",
							id: frZone.id,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 699,
									fractionDigits: 2,
								},
							},
						],
					},
				],
			});

			standardExcludedShippingMethod = await createShippingMethod({
				isDefault: false,
				key: "standard-excluded",
				name: "Standard shipping with tax excluded from price",
				taxCategory: {
					typeId: "tax-category",
					id: standardExcludedTax.id,
				},
				zoneRates: [
					{
						zone: {
							typeId: "zone",
							id: nlZone.id,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 499,
									fractionDigits: 2,
								},
							},
						],
					},
					{
						zone: {
							typeId: "zone",
							id: frZone.id,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 699,
									fractionDigits: 2,
								},
							},
						],
					},
				],
			});
			await createShippingMethod({
				isDefault: false,
				key: "express",
				name: "Express shipping",
				taxCategory: {
					typeId: "tax-category",
					id: standardTax.id,
				},
				zoneRates: [
					{
						zone: {
							typeId: "zone",
							id: nlZone.id,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 899,
									fractionDigits: 2,
								},
							},
						],
					},
					{
						zone: {
							typeId: "zone",
							id: frZone.id,
						},
						shippingRates: [
							{
								price: {
									type: "centPrecision",
									currencyCode: "EUR",
									centAmount: 1099,
									fractionDigits: 2,
								},
							},
						],
					},
				],
			});

			expect(
				(
					await ctMock.app.inject({
						method: "POST",
						url: `/dummy/carts/${cart.id}`,
						payload: {
							version: 1,
							actions: [
								{
									action: "setShippingAddress",
									address: {
										streetName: "Street name",
										city: "Utrecht",
										country: "NL",
									},
								},
							],
						},
					})
				).statusCode,
			).toBe(200);
		});

		test("correctly sets shipping method", async () => {
			assert(cart, "cart not created");

			const shippingMethod: ShippingMethodResourceIdentifier = {
				typeId: "shipping-method",
				id: standardShippingMethod.id,
			};

			const response = await ctMock.app.inject({
				method: "POST",
				url: `/dummy/carts/${cart.id}`,
				payload: {
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				},
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().version).toBe(3);
			expect(response.json().shippingInfo.shippingMethod.id).toEqual(
				standardShippingMethod.id,
			);
		});

		test("correctly removes a shipping method", async () => {
			assert(cart, "cart not created");

			const shippingMethod: ShippingMethodResourceIdentifier = {
				typeId: "shipping-method",
				id: standardShippingMethod.id,
			};

			const response = await ctMock.app.inject({
				method: "POST",
				url: `/dummy/carts/${cart.id}`,
				payload: {
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				},
			});
			expect(response.statusCode).toBe(200);

			const removeResponse = await ctMock.app.inject({
				method: "POST",
				url: `/dummy/carts/${cart.id}`,
				payload: {
					version: 3,
					actions: [
						{
							action: "removeShippingMethod",
							shippingKey: standardShippingMethod.key,
						},
					],
				},
			});
			expect(removeResponse.statusCode).toBe(200);
			expect(removeResponse.json().shippingInfo).toBeUndefined();
		});

		test("correctly sets shippingInfo rates + tax when includedInPrice: true", async () => {
			assert(cart, "cart not created");
			assert(standardShippingMethod, "shipping method not created");

			const shippingMethod: ShippingMethodResourceIdentifier = {
				typeId: "shipping-method",
				id: standardShippingMethod.id,
			};

			const response = await ctMock.app.inject({
				method: "POST",
				url: `/dummy/carts/${cart.id}`,
				payload: {
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				},
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().version).toBe(3);
			expect(response.json().shippingInfo.shippingRate.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			expect(response.json().shippingInfo.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			expect(response.json().shippingInfo.taxRate).toMatchObject({
				name: "NL standard tax rate",
				amount: 0.21,
				includedInPrice: true,
				country: "NL",
			});
			expect(response.json().shippingInfo.taxedPrice).toMatchObject({
				totalNet: {
					type: "centPrecision",
					centAmount: 412,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
				totalGross: {
					type: "centPrecision",
					centAmount: 499,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
				taxPortions: [
					{
						name: "NL standard tax rate",
						rate: 0.21,
						amount: {
							type: "centPrecision",
							centAmount: 87,
							currencyCode: "EUR",
							fractionDigits: 2,
						},
					},
				],
				totalTax: {
					type: "centPrecision",
					centAmount: 87,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
			});
		});

		test("correctly sets shippingInfo rates + tax when includedInPrice: false", async () => {
			assert(cart, "cart not created");
			assert(standardExcludedShippingMethod, "shipping method not created");

			const shippingMethod: ShippingMethodResourceIdentifier = {
				typeId: "shipping-method",
				id: standardExcludedShippingMethod.id,
			};

			const response = await ctMock.app.inject({
				method: "POST",
				url: `/dummy/carts/${cart.id}`,
				payload: {
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				},
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().version).toBe(3);
			expect(response.json().shippingInfo.shippingRate.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			// TODO: should this be gross or net? docs unclear (currently always just returns the shipping rate (tier) price)
			expect(response.json().shippingInfo.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			expect(response.json().shippingInfo.taxRate).toMatchObject({
				name: "NL standard-excluded tax rate",
				amount: 0.21,
				includedInPrice: false,
				country: "NL",
			});
			expect(response.json().shippingInfo.taxedPrice).toMatchObject({
				totalNet: {
					type: "centPrecision",
					centAmount: 499,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
				totalGross: {
					type: "centPrecision",
					centAmount: 604,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
				taxPortions: [
					{
						name: "NL standard-excluded tax rate",
						rate: 0.21,
						amount: {
							type: "centPrecision",
							centAmount: 105,
							currencyCode: "EUR",
							fractionDigits: 2,
						},
					},
				],
				totalTax: {
					type: "centPrecision",
					centAmount: 105,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
			});
		});
	});

	test("setLineItemShippingDetails", async () => {
		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: productDraft,
		});
		const product = productResponse.json();

		assert(cart, "cart not created");
		assert(product, "product not created");

		const updatedCart = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			},
		});
		const lineItem = updatedCart.json().lineItems[0];
		assert(lineItem, "lineItem not created");

		expect(updatedCart.json().version).toBe(2);
		expect(updatedCart.json().lineItems).toHaveLength(1);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: updatedCart.json().version,
				actions: [
					{
						action: "setLineItemShippingDetails",
						lineItemId: lineItem.id,
						shippingDetails: {
							targets: [
								{
									addressKey: "address-key",
									quantity: 1,
								},
							],
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().lineItems).toHaveLength(1);

		const updatedLineItem = response.json().lineItems[0];
		expect(updatedLineItem.shippingDetails).toBeDefined();
		expect(updatedLineItem.shippingDetails.targets).toHaveLength(1);
	});

	test("addCustomLineItem", async () => {
		assert(cart, "cart not created");
		const typeResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "custom-line-item-type",
				name: { en: "Custom Line Item Type" },
				resourceTypeIds: ["custom-line-item"],
				fieldDefinitions: [
					{
						name: "description",
						label: { en: "Description" },
						required: false,
						type: { name: "String" },
						inputHint: "SingleLine",
					},
				],
			},
		});
		const type = typeResponse.json();

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addCustomLineItem",
						name: { en: "Custom Service Fee" },
						slug: "service-fee",
						money: {
							currencyCode: "EUR",
							centAmount: 1000,
						},
						quantity: 1,
						taxCategory: {
							typeId: "tax-category",
							id: taxCategory.id,
						},
						custom: {
							type: { typeId: "type", key: type.key },
							fields: { description: "Premium support service" },
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().customLineItems).toHaveLength(1);

		const customLineItem = response.json().customLineItems[0];
		expect(customLineItem.name).toEqual({ en: "Custom Service Fee" });
		expect(customLineItem.slug).toBe("service-fee");
		expect(customLineItem.money.centAmount).toBe(1000);
		expect(customLineItem.quantity).toBe(1);
		expect(customLineItem.totalPrice.centAmount).toBe(1000);
		expect(customLineItem.taxCategory.id).toBe(taxCategory.id);
		expect(customLineItem.taxedPrice).toBeDefined();
		expect(customLineItem.taxRate).toBeDefined();
		expect(customLineItem.taxRate.amount).toBe(0.21);
		expect(customLineItem.id).toBeDefined();
		expect(customLineItem.custom).toBeDefined();
		expect(customLineItem.custom.fields.description).toBe(
			"Premium support service",
		);
	});

	test("removeCustomLineItem by ID", async () => {
		assert(cart, "cart not created");

		const addResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addCustomLineItem",
						name: { en: "Service Fee" },
						slug: "service-fee",
						money: {
							currencyCode: "EUR",
							centAmount: 1000,
						},
						quantity: 1,
					},
				],
			},
		});

		expect(addResponse.statusCode).toBe(200);
		expect(addResponse.json().customLineItems).toHaveLength(1);

		const customLineItemId = addResponse.json().customLineItems[0].id;
		const removeResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: addResponse.json().version,
				actions: [
					{
						action: "removeCustomLineItem",
						customLineItemId,
					},
				],
			},
		});

		expect(removeResponse.statusCode).toBe(200);
		expect(removeResponse.json().customLineItems).toHaveLength(0);
	});

	test("removeCustomLineItem by key", async () => {
		assert(cart, "cart not created");

		const addResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addCustomLineItem",
						name: { en: "Service Fee" },
						slug: "service-fee",
						key: "custom-service-fee",
						money: {
							currencyCode: "EUR",
							centAmount: 1000,
						},
						quantity: 1,
					},
				],
			},
		});

		expect(addResponse.statusCode).toBe(200);
		expect(addResponse.json().customLineItems).toHaveLength(1);

		const removeResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: addResponse.json().version,
				actions: [
					{
						action: "removeCustomLineItem",
						customLineItemKey: "custom-service-fee",
					},
				],
			},
		});

		expect(removeResponse.statusCode).toBe(200);
		expect(removeResponse.json().customLineItems).toHaveLength(0);
	});

	test("changeCustomLineItemQuantity", async () => {
		assert(cart, "cart not created");
		const addResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addCustomLineItem",
						name: { en: "Service Fee" },
						slug: "service-fee",
						money: {
							currencyCode: "EUR",
							centAmount: 1000,
						},
						quantity: 1,
					},
				],
			},
		});

		const customLineItemId = addResponse.json().customLineItems[0].id;
		const changeResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: addResponse.json().version,
				actions: [
					{
						action: "changeCustomLineItemQuantity",
						customLineItemId,
						quantity: 3,
					},
				],
			},
		});

		expect(changeResponse.statusCode).toBe(200);
		expect(changeResponse.json().customLineItems).toHaveLength(1);

		const customLineItem = changeResponse.json().customLineItems[0];
		expect(customLineItem.quantity).toBe(3);
		expect(customLineItem.totalPrice.centAmount).toBe(3000);
	});

	test("changeCustomLineItemMoney", async () => {
		assert(cart, "cart not created");
		const addResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addCustomLineItem",
						name: { en: "Service Fee" },
						slug: "service-fee",
						money: {
							currencyCode: "EUR",
							centAmount: 1000,
						},
						quantity: 2,
					},
				],
			},
		});

		const customLineItemId = addResponse.json().customLineItems[0].id;
		const changeResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: addResponse.json().version,
				actions: [
					{
						action: "changeCustomLineItemMoney",
						customLineItemId,
						money: {
							currencyCode: "EUR",
							centAmount: 1500,
						},
					},
				],
			},
		});

		expect(changeResponse.statusCode).toBe(200);
		expect(changeResponse.json().customLineItems).toHaveLength(1);

		const customLineItem = changeResponse.json().customLineItems[0];
		expect(customLineItem.money.centAmount).toBe(1500);
		expect(customLineItem.totalPrice.centAmount).toBe(3000);
	});

	test("addCustomLineItem with tax calculation", async () => {
		assert(cart, "cart not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addCustomLineItem",
						name: { en: "Taxed Service" },
						slug: "taxed-service",
						money: {
							currencyCode: "EUR",
							centAmount: 1000,
						},
						quantity: 1,
						taxCategory: {
							typeId: "tax-category",
							id: taxCategory.id,
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		const customLineItem = response.json().customLineItems[0];

		expect(customLineItem.taxedPrice).toBeDefined();
		expect(customLineItem.taxedPrice.totalNet.centAmount).toBe(1000);
		expect(customLineItem.taxedPrice.totalGross.centAmount).toBe(1210);
		expect(customLineItem.taxedPrice.taxPortions).toHaveLength(1);
		expect(customLineItem.taxedPrice.taxPortions[0].rate).toBe(0.21);
	});
});
