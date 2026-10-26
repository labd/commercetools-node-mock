import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

describe("Draft validation (strict mode)", () => {
	const ctMock = new CommercetoolsMock({ strict: true });

	describe("ZoneDraft", () => {
		test("accepts valid draft", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/zones",
				payload: {
					name: "Europe",
					key: "europe",
					locations: [{ country: "DE" }, { country: "NL" }],
				},
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().name).toBe("Europe");
		});

		test("rejects draft without required 'name' field", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/zones",
				payload: {
					key: "missing-name",
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"name: Missing required value",
			);
		});

		test("rejects draft with wrong type for 'name'", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/zones",
				payload: {
					name: 123,
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"name: JSON String expected.",
			);
		});

		test("accepts draft with extra fields (looseObject)", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/zones",
				payload: {
					name: "Test",
					someExtraField: "should be ignored",
				},
			});
			expect(response.statusCode).toBe(201);
		});
	});

	describe("ChannelDraft", () => {
		test("accepts valid draft", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/channels",
				payload: {
					key: "my-channel",
					roles: ["InventorySupply"],
				},
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().key).toBe("my-channel");
		});

		test("rejects draft without required 'key' field", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/channels",
				payload: {
					roles: ["InventorySupply"],
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"key: Missing required value",
			);
		});

		test("rejects draft with invalid role enum value", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/channels",
				payload: {
					key: "bad-roles",
					roles: ["InvalidRole"],
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toContain(
				"Invalid enum value",
			);
		});

		test("accepts draft with localized name", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/channels",
				payload: {
					key: "localized-channel",
					name: { en: "English", de: "Deutsch" },
				},
			});
			expect(response.statusCode).toBe(201);
		});
	});

	describe("InventoryEntryDraft", () => {
		test("accepts valid draft", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/inventory",
				payload: {
					key: "ie-key-1",
					sku: "sku_variant1",
					quantityOnStock: 4,
				},
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().sku).toBe("sku_variant1");
		});

		test("rejects draft with typo in required field name (quantityOnStxock)", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/inventory",
				payload: {
					key: "ie-key-1",
					sku: "sku_variant1",
					quantityOnStxock: 4, // typo — real field is quantityOnStock
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"quantityOnStock: Missing required value",
			);
		});

		test("rejects draft without required 'sku' field", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/inventory",
				payload: {
					quantityOnStock: 10,
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"sku: Missing required value",
			);
		});
	});

	describe("CustomerDraft", () => {
		test("accepts valid draft", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/customers",
				payload: {
					email: "test@example.com",
					password: "secret123",
				},
			});
			expect(response.statusCode).toBe(201);
		});

		test("rejects draft without required 'email' field", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/customers",
				payload: {
					password: "secret123",
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"email: Missing required value",
			);
		});

		test("accepts draft with addresses", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/customers",
				payload: {
					email: "address@example.com",
					password: "secret123",
					addresses: [
						{
							country: "DE",
							city: "Berlin",
							streetName: "Main Street",
						},
					],
				},
			});
			expect(response.statusCode).toBe(201);
		});

		test("accepts draft with custom fields on an address", async () => {
			await ctMock.app.inject({
				method: "POST",
				url: "/dummy/types",
				payload: {
					key: "address-type",
					name: { en: "Address type" },
					resourceTypeIds: ["address"],
					fieldDefinitions: [],
				},
			});

			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/customers",
				payload: {
					email: "address-custom@example.com",
					password: "secret123",
					addresses: [
						{
							country: "DE",
							custom: {
								type: { typeId: "type", key: "address-type" },
								fields: { deliveryInstructions: "Leave at the door" },
							},
						},
					],
				},
			});
			expect(response.statusCode, JSON.stringify(response.json())).toBe(201);
			expect(response.json().customer.addresses[0].custom.type).toEqual({
				typeId: "type",
				id: expect.any(String),
			});
		});

		test("rejects address custom fields without a type", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/customers",
				payload: {
					email: "address-custom-invalid@example.com",
					password: "secret123",
					addresses: [
						{
							country: "DE",
							custom: { fields: { deliveryInstructions: "Leave at the door" } },
						},
					],
				},
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toBe(
				"addresses.0.custom.type: Missing required value",
			);
		});
	});
	// The API accepts a plain Money wherever a TypedMoneyDraft is expected and
	// treats it as centPrecision.
	describe("TypedMoneyDraft", () => {
		const cartDiscountDraft = (value: unknown) => ({
			cartPredicate: "1=1",
			description: {},
			isActive: true,
			name: { en: "fixed name" },
			requiresDiscountCode: false,
			sortOrder: "0.9",
			stackingMode: "Stacking",
			stores: [],
			target: { type: "shipping" },
			value,
		});

		test("accepts a fixed cart discount value with plain money", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/cart-discounts",
				payload: cartDiscountDraft({
					type: "fixed",
					money: [
						{ centAmount: 1000, currencyCode: "USD" },
						{ centAmount: 2000, currencyCode: "EUR" },
					],
				}),
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().value).toEqual({
				type: "fixed",
				money: [
					{
						type: "centPrecision",
						centAmount: 1000,
						currencyCode: "USD",
						fractionDigits: 2,
					},
					{
						type: "centPrecision",
						centAmount: 2000,
						currencyCode: "EUR",
						fractionDigits: 2,
					},
				],
			});
		});

		test("accepts an absolute cart discount value with plain money", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/cart-discounts",
				payload: cartDiscountDraft({
					type: "absolute",
					money: [{ centAmount: 500, currencyCode: "JPY" }],
				}),
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().value).toEqual({
				type: "absolute",
				money: [
					{
						type: "centPrecision",
						centAmount: 500,
						currencyCode: "JPY",
						fractionDigits: 0,
					},
				],
			});
		});

		test("still accepts typed money on a fixed cart discount value", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/cart-discounts",
				payload: cartDiscountDraft({
					type: "fixed",
					money: [
						{
							type: "highPrecision",
							centAmount: 1235,
							currencyCode: "EUR",
							preciseAmount: 12345,
							fractionDigits: 3,
						},
					],
				}),
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().value.money).toEqual([
				{
					type: "highPrecision",
					centAmount: 1235,
					currencyCode: "EUR",
					fractionDigits: 3,
					preciseAmount: 12345,
				},
			]);
		});

		test("rejects an unknown money type", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/cart-discounts",
				payload: cartDiscountDraft({
					type: "fixed",
					money: [{ type: "foo", centAmount: 1000, currencyCode: "USD" }],
				}),
			});
			expect(response.statusCode).toBe(400);
			const body = response.json();
			expect(body.errors[0].code).toBe("InvalidJsonInput");
			expect(body.errors[0].detailedErrorMessage).toContain(
				"value.money.0.type",
			);
		});

		test("accepts a staged standalone price with plain money", async () => {
			const response = await ctMock.app.inject({
				method: "POST",
				url: "/dummy/standalone-prices",
				payload: {
					sku: "typed-money-draft",
					value: { centAmount: 100, currencyCode: "EUR" },
					staged: { value: { centAmount: 90, currencyCode: "EUR" } },
				},
			});
			expect(response.statusCode).toBe(201);
			expect(response.json().staged).toEqual({
				value: {
					type: "centPrecision",
					centAmount: 90,
					currencyCode: "EUR",
					fractionDigits: 2,
				},
			});
		});
	});
});

describe("Draft validation (non-strict mode - default)", () => {
	const ctMock = new CommercetoolsMock();

	test("allows invalid zone draft when strict is false", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: {
				// missing required 'name' field
				key: "no-name-zone",
			},
		});
		// Without strict mode, validation is skipped and the
		// repository creates the resource (name will be undefined)
		expect(response.statusCode).toBe(201);
	});

	test("allows invalid channel draft when strict is false", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/channels",
			payload: {
				// missing required 'key' field
				roles: ["InventorySupply"],
			},
		});
		expect(response.statusCode).toBe(201);
	});
});
