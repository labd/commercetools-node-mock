import type { Cart } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	cartDraftFactory,
	customerDraftFactory,
	loginCustomer,
	typeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyCart", () => {
	const cartDraft = cartDraftFactory(ctMock);
	const typeDraft = typeDraftFactory(ctMock);

	let customerId: string;
	let headers: { authorization: string };

	beforeEach(async () => {
		const customer = await customerDraftFactory(ctMock).create({
			email: "my-cart@example.com",
			password: "secret",
		});
		customerId = customer.id;
		headers = (
			await loginCustomer(ctMock, {
				email: "my-cart@example.com",
				password: "secret",
			})
		).headers;

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
			headers,
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
			customerId,
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
		const cart = await cartDraft.create({ currency: "EUR", customerId });

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/carts/${cart.id}`,
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(cart);
	});

	test("Get a cart of another customer by ID", async () => {
		const other = await customerDraftFactory(ctMock).create({
			email: "someone-else@example.com",
		});
		const cart = await cartDraft.create({
			currency: "EUR",
			customerId: other.id,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/carts/${cart.id}`,
			headers,
		});

		// Not visible, and indistinguishable from a cart that does not exist
		expect(response.statusCode).toBe(404);
	});

	test("Query my carts", async () => {
		const other = await customerDraftFactory(ctMock).create({
			email: "someone-else@example.com",
		});
		const mine = await cartDraft.create({ currency: "EUR", customerId });
		await cartDraft.create({ currency: "EUR", customerId: other.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/carts",
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].id).toBe(mine.id);
	});

	test("Without a customer token", async () => {
		await cartDraft.create({ currency: "EUR", customerId });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/carts",
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("insufficient_scope");
	});

	test("Get my active cart", async () => {
		const cart = await cartDraft.create({ currency: "EUR", customerId });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/active-cart",
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(cart);
	});

	test("Get my active cart when only another customer has one", async () => {
		const other = await customerDraftFactory(ctMock).create({
			email: "someone-else@example.com",
		});
		await cartDraft.create({ currency: "EUR", customerId: other.id });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/active-cart",
			headers,
		});

		expect(response.statusCode).toBe(404);
	});

	test("Get my active cart which doesnt exists", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/active-cart",
			headers,
		});

		expect(response.statusCode).toBe(404);
	});
});
