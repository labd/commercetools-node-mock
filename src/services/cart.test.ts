import type {
	Address,
	Cart,
	CentPrecisionMoney,
	ProductDraft,
	ShippingMethod,
	ShippingMethodDraft,
	ShippingMethodResourceIdentifier,
	TaxCategory,
	TaxCategoryDraft,
	Zone,
} from "@commercetools/platform-sdk";
import assert from "assert";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { customerDraftFactory } from "~src/testing/customer";
import { CommercetoolsMock } from "../index";

describe("Carts Query", () => {
	const ctMock = new CommercetoolsMock();

	beforeEach(async () => {
		let response;
		response = await supertest(ctMock.app)
			.post("/dummy/types")
			.send({
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
			});
		expect(response.status).toBe(201);

		response = await supertest(ctMock.app)
			.post("/dummy/carts")
			.send({
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
			});
		expect(response.status).toBe(201);
	});

	test("no filter", async () => {
		const response = await supertest(ctMock.app)
			.get("/dummy/carts")
			.query({
				expand: "custom.type",
			})
			.send();

		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);

		const myCart = response.body.results[0] as Cart;

		expect(myCart.custom?.type.id).not.toBeUndefined();
		expect(myCart.custom?.type.id).toBe(myCart.custom?.type.obj?.id);
		expect(myCart.custom?.type.obj?.description?.en).toBe("Test Type");
	});

	test("throw error when anonymousId and customerId are given", async () => {
		const customerId = "400be09e-bfe8-4925-a307-4ef6280b063e";
		const anonymousId = "a99f27d1-7e7e-4592-8d5a-aa5da1adfe24";
		const response = await supertest(ctMock.app).post("/dummy/carts").send({
			currency: "EUR",
			anonymousId,
			customerId,
		});
		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"Can set only one of customer OR anonymousId",
		);
	});

	test("create cart with existing customer", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		const response = await supertest(ctMock.app).post("/dummy/carts").send({
			currency: "EUR",
			customerId: customer.id,
		});
		expect(response.status).toBe(201);
		expect(response.body.customerId).toBe(customer.id);
	});
});

describe("Cart Update Actions", () => {
	const ctMock = new CommercetoolsMock();
	let cart: Cart | undefined;

	const createCart = async (currency: string) => {
		const response = await supertest(ctMock.app).post("/dummy/carts").send({
			currency,
		});
		expect(response.status).toBe(201);
		cart = response.body;
	};

	const createZone = async (country: string): Promise<Zone> => {
		const response = await supertest(ctMock.app)
			.post("/dummy/zones")
			.send({
				name: country,
				locations: [
					{
						country,
					},
				],
			});
		expect(response.status).toBe(201);
		return response.body;
	};

	const createTaxCategory = async (
		draft: TaxCategoryDraft,
	): Promise<TaxCategory> => {
		const response = await supertest(ctMock.app)
			.post("/dummy/tax-categories")
			.send(draft);
		expect(response.status).toBe(201);
		return response.body;
	};

	const createShippingMethod = async (
		draft: ShippingMethodDraft,
	): Promise<ShippingMethod> => {
		const response = await supertest(ctMock.app)
			.post("/dummy/shipping-methods")
			.send(draft);
		expect(response.status).toBe(201);
		return response.body;
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
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no update", async () => {
		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.locale).toBe("nl-NL");

		const responseAgain = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 2,
				actions: [{ action: "setLocale", locale: "nl-NL" }],
			});
		expect(responseAgain.status).toBe(200);
		expect(responseAgain.body.version).toBe(2);
		expect(responseAgain.body.locale).toBe("nl-NL");
	});

	test("addLineItem", async () => {
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lineItems).toHaveLength(1);
		expect(response.body.totalPrice.centAmount).toEqual(14900);
	});

	test("addLineItem by SKU", async () => {
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "addLineItem", sku: "1337", quantity: 2 }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lineItems).toHaveLength(1);
		expect(response.body.totalPrice.centAmount).toEqual(29800);
	});

	test.each([
		["EUR", 29800],
		["GBP", 37800],
	])("addLineItem with price selection", async (currency, total) => {
		await createCart(currency);

		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "addLineItem", sku: "1337", quantity: 2 }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lineItems).toHaveLength(1);
		expect(response.body.lineItems[0].price.value.currencyCode).toBe(currency);
		expect(response.body.totalPrice.centAmount).toEqual(total);
	});

	test("addLineItem with custom field", async () => {
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		const type = await supertest(ctMock.app)
			.post(`/dummy/types`)
			.send({
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
			})
			.then((x) => x.body);

		assert(type, "type not created");
		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
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
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lineItems).toHaveLength(1);
		expect(response.body.lineItems[0].custom).toEqual({
			type: { typeId: "type", id: expect.any(String) },
			fields: { foo: "bar" },
		});
	});

	test("addLineItem with key", async () => {
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		const type = await supertest(ctMock.app)
			.post(`/dummy/types`)
			.send({
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
			})
			.then((x) => x.body);

		assert(type, "type not created");
		assert(cart, "cart not created");
		assert(product, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
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
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lineItems).toHaveLength(1);
		expect(response.body.lineItems[0].key).toBeDefined();
		expect(response.body.lineItems[0].key).toBe("my-key");
	});

	test("addLineItem unknown product", async () => {
		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "addLineItem", productId: "123", variantId: 1 }],
			});
		expect(response.status).toBe(400);
		expect(response.body.message).toBe("A product with ID '123' not found.");
	});

	test("addItemShippingAddress", async () => {
		await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
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
			});

		expect(response.body.itemShippingAddresses).toHaveLength(1);
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lineItems).toHaveLength(0);
	});

	test("changeTaxRoundingMode", async () => {
		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeTaxRoundingMode",
						taxRoundingMode: "HalfUp",
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.taxRoundingMode).toBe("HalfUp");
	});

	test("recalculate", async () => {
		await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "recalculate",
						updateProductData: true,
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.version).toBe(1);
	});

	test("removeLineItem", async () => {
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");
		assert(product, "product not created");

		const updatedCart = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			});
		const lineItem = updatedCart.body.lineItems[0];
		assert(lineItem, "lineItem not created");

		expect(updatedCart.body.lineItems).toHaveLength(1);

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: updatedCart.body.version,
				actions: [{ action: "removeLineItem", lineItemId: lineItem.id }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.lineItems).toHaveLength(0);
	});

	test("removeLineItem decrease quantity", async () => {
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");
		assert(product, "product not created");

		const updatedCart = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
						quantity: 2,
					},
				],
			});
		const lineItem = updatedCart.body.lineItems[0];
		assert(lineItem, "lineItem not created");

		expect(updatedCart.body.lineItems).toHaveLength(1);
		expect(updatedCart.body.lineItems[0].quantity).toBe(2);

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: updatedCart.body.version,
				actions: [
					{ action: "removeLineItem", lineItemId: lineItem.id, quantity: 1 },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.lineItems).toHaveLength(1);
		expect(response.body.lineItems[0].quantity).toBe(1);
	});

	test("setBillingAddress", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "setBillingAddress", address }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.billingAddress).toEqual(address);
	});

	test("setCountry", async () => {
		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "setCountry", country: "NL" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.country).toBe("NL");
	});

	test("setDirectDiscounts", async () => {
		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
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
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.directDiscounts).toMatchObject([
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

	test("setCustomerEmail", async () => {
		assert(cart, "cart not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "setCustomerEmail", email: "john@doe.com" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.customerEmail).toBe("john@doe.com");
	});

	test("setShippingAddress", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [{ action: "setShippingAddress", address }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.shippingAddress).toEqual(address);
	});

	test("setBillingAddressCustomType", async () => {
		assert(cart, "cart not created");

		const address: Address = {
			streetName: "Street name",
			city: "Utrecht",
			country: "NL",
		};

		const type = await supertest(ctMock.app)
			.post(`/dummy/types`)
			.send({
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
			})
			.then((x) => x.body);

		assert(type, "type not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
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
			});

		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.billingAddress).toEqual({
			...address,
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

		const type = await supertest(ctMock.app)
			.post(`/dummy/types`)
			.send({
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
			})
			.then((x) => x.body);

		assert(type, "type not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
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
			});

		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.shippingAddress).toEqual({
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
					await supertest(ctMock.app)
						.post(`/dummy/carts/${cart.id}`)
						.send({
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
						})
				).status,
			).toBe(200);
		});

		test("correctly sets shipping method", async () => {
			assert(cart, "cart not created");

			const shippingMethod: ShippingMethodResourceIdentifier = {
				typeId: "shipping-method",
				id: standardShippingMethod.id,
			};

			const response = await supertest(ctMock.app)
				.post(`/dummy/carts/${cart.id}`)
				.send({
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				});
			expect(response.status).toBe(200);
			expect(response.body.version).toBe(3);
			expect(response.body.shippingInfo.shippingMethod.id).toEqual(
				standardShippingMethod.id,
			);
		});

		test("correctly sets shippingInfo rates + tax when includedInPrice: true", async () => {
			assert(cart, "cart not created");
			assert(standardShippingMethod, "shipping method not created");

			const shippingMethod: ShippingMethodResourceIdentifier = {
				typeId: "shipping-method",
				id: standardShippingMethod.id,
			};

			const response = await supertest(ctMock.app)
				.post(`/dummy/carts/${cart.id}`)
				.send({
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				});
			expect(response.status).toBe(200);
			expect(response.body.version).toBe(3);
			expect(response.body.shippingInfo.shippingRate.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			expect(response.body.shippingInfo.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			expect(response.body.shippingInfo.taxRate).toMatchObject({
				name: "NL standard tax rate",
				amount: 0.21,
				includedInPrice: true,
				country: "NL",
			});
			expect(response.body.shippingInfo.taxedPrice).toMatchObject({
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

			const response = await supertest(ctMock.app)
				.post(`/dummy/carts/${cart.id}`)
				.send({
					version: 2,
					actions: [{ action: "setShippingMethod", shippingMethod }],
				});
			expect(response.status).toBe(200);
			expect(response.body.version).toBe(3);
			expect(response.body.shippingInfo.shippingRate.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			// TODO: should this be gross or net? docs unclear (currently always just returns the shipping rate (tier) price)
			expect(response.body.shippingInfo.price).toMatchObject({
				centAmount: 499,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			});
			expect(response.body.shippingInfo.taxRate).toMatchObject({
				name: "NL standard-excluded tax rate",
				amount: 0.21,
				includedInPrice: false,
				country: "NL",
			});
			expect(response.body.shippingInfo.taxedPrice).toMatchObject({
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
		const product = await supertest(ctMock.app)
			.post(`/dummy/products`)
			.send(productDraft)
			.then((x) => x.body);

		assert(cart, "cart not created");
		assert(product, "product not created");

		const updatedCart = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: product.masterData.current.variants[0].id,
					},
				],
			});
		const lineItem = updatedCart.body.lineItems[0];
		assert(lineItem, "lineItem not created");

		expect(updatedCart.body.version).toBe(2);
		expect(updatedCart.body.lineItems).toHaveLength(1);

		const response = await supertest(ctMock.app)
			.post(`/dummy/carts/${cart.id}`)
			.send({
				version: updatedCart.body.version,
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
			});

		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.lineItems).toHaveLength(1);

		const updatedLineItem = response.body.lineItems[0];
		expect(updatedLineItem.shippingDetails).toBeDefined();
		expect(updatedLineItem.shippingDetails.targets).toHaveLength(1);
	});
});
