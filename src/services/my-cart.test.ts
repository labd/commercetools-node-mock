import type { Cart, MyCartDraft } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyCart", () => {
	beforeEach(async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "custom-payment",
				name: {
					"nl-NL": "custom-payment",
				},
				resourceTypeIds: ["payment"],
			},
		});
		expect(response.statusCode).toBe(201);
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("Create my cart", async () => {
		const draft: MyCartDraft = {
			currency: "EUR",
		};

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/carts",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			id: expect.anything(),
			createdAt: expect.anything(),
			lastModifiedAt: expect.anything(),
			version: 1,
			cartState: "Active",
			discountCodes: [],
			directDiscounts: [],
			inventoryMode: "None",
			itemShippingAddresses: [],
			lineItems: [],
			customLineItems: [],
			shipping: [],
			priceRoundingMode: "HalfEven",
			shippingMode: "Single",
			totalPrice: {
				type: "centPrecision",
				centAmount: 0,
				currencyCode: "EUR",
				fractionDigits: 0,
			},
			taxMode: "Platform",
			taxRoundingMode: "HalfEven",
			taxCalculationMode: "LineItemLevel",
			refusedGifts: [],
			origin: "Customer",
		} as Cart);
	});

	test("Get my cart by ID", async () => {
		const draft: MyCartDraft = {
			currency: "EUR",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/carts",
			payload: draft,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/carts/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get my active cart", async () => {
		const draft: MyCartDraft = {
			currency: "EUR",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/carts",
			payload: draft,
		});

		const response = await ctMock.app.inject({ method: "GET", url: "/dummy/me/active-cart" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get my active cart which doesnt exists", async () => {
		const response = await ctMock.app.inject({ method: "GET", url: "/dummy/me/active-cart" });

		expect(response.statusCode).toBe(404);
	});
});
