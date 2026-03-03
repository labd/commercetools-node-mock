import type { Cart } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { cartDraftFactory, typeDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyCart", () => {
	const cartDraft = cartDraftFactory(ctMock);
	const typeDraft = typeDraftFactory(ctMock);

	beforeEach(async () => {
		await typeDraft.create({
			key: "custom-payment",
			name: {
				"nl-NL": "custom-payment",
			},
			resourceTypeIds: ["payment"],
		});
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Create my cart", async () => {
		const draft = cartDraft.build({
			currency: "EUR",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/carts",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			id: expect.anything(),
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
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
		const cart = await cartDraft.create({
			currency: "EUR",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/carts/${cart.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(cart);
	});

	test("Get my active cart", async () => {
		const cart = await cartDraft.create({
			currency: "EUR",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/active-cart",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(cart);
	});

	test("Get my active cart which doesnt exists", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/active-cart",
		});

		expect(response.statusCode).toBe(404);
	});
});
