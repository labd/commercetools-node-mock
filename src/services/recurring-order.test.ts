import type {
	CartDraft,
	RecurringOrderDraft,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("RecurringOrder", () => {
	const createTestCart = async () => {
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-types",
			payload: {
				key: "test-product-type",
				name: "Test Product Type",
				description: "A test product type",
			},
		});

		const productResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products",
			payload: {
				key: "test-product",
				name: { en: "Test Product" },
				productType: {
					typeId: "product-type",
					key: "test-product-type",
				},
				slug: { en: "test-product" },
				masterVariant: {
					id: 1,
					sku: "test-sku",
					prices: [
						{
							value: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 1000,
							},
						},
					],
				},
				variants: [],
			},
		});

		const cartDraft: CartDraft = {
			currency: "EUR",
			country: "NL",
		};

		const cartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: cartDraft,
		});

		const cartBody = cartResponse.json();

		await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cartBody.id}`,
			payload: {
				version: cartBody.version,
				actions: [
					{
						action: "addLineItem",
						productId: productResponse.json().id,
						variantId: 1,
						quantity: 2,
					},
				],
			},
		});

		const updatedCartResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/carts/${cartBody.id}`,
		});

		return updatedCartResponse.json();
	};

	test("Create recurring order", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "weekly-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
			expiresAt: "2025-12-31T23:59:59.000Z",
		};

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			key: "weekly-order",
			lastModifiedAt: expect.anything(),
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			originOrder: {
				typeId: "order",
				id: expect.anything(),
			},
			startsAt: "2025-01-01T10:00:00.000Z",
			expiresAt: "2025-12-31T23:59:59.000Z",
			recurringOrderState: "Active",
			schedule: {
				type: "standard",
				intervalUnit: "month",
				value: 1,
			},
			version: 1,
		});
	});

	test("Get recurring order", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "get-test-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get recurring order by key", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "key-test-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/recurring-orders/key=key-test-order",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query recurring orders", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "query-test-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/recurring-orders",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});

	test("Update recurring order - setKey", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "original-key",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setKey",
						key: "updated-key",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().key).toBe("updated-key");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurring order - setStartsAt", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "starts-at-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setStartsAt",
						startsAt: "2025-02-01T10:00:00.000Z",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().startsAt).toBe("2025-02-01T10:00:00.000Z");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurring order - setExpiresAt", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "expires-at-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setExpiresAt",
						expiresAt: "2026-01-01T00:00:00.000Z",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().expiresAt).toBe("2026-01-01T00:00:00.000Z");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurring order - setRecurringOrderState to paused", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "state-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setRecurringOrderState",
						recurringOrderState: {
							type: "paused",
						},
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().recurringOrderState).toBe("Paused");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update recurring order - setOrderSkipConfiguration", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "skip-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setOrderSkipConfiguration",
						skipConfiguration: {
							type: "totalSkip",
							totalToSkip: 2,
						},
						updatedExpiresAt: "2025-06-01T00:00:00.000Z",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().skipConfiguration).toEqual({
			type: "totalSkip",
			totalToSkip: 2,
			skipped: 0,
			lastSkippedAt: undefined,
		});
		expect(updateResponse.json().expiresAt).toBe("2025-06-01T00:00:00.000Z");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Delete recurring order", async () => {
		const cart = await createTestCart();

		const draft: RecurringOrderDraft = {
			key: "delete-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		};

		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/recurring-orders/${createResponse.json().id}?version=${createResponse.json().version}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(createResponse.json());

		const getResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/recurring-orders/${createResponse.json().id}`,
		});

		expect(getResponse.statusCode).toBe(404);
	});
});
