import type {
	CartDraft,
	RecurringOrderDraft,
} from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("RecurringOrder", () => {
	const createTestCart = async () => {
		await supertest(ctMock.app).post("/dummy/product-types").send({
			key: "test-product-type",
			name: "Test Product Type",
			description: "A test product type",
		});

		const productResponse = await supertest(ctMock.app)
			.post("/dummy/products")
			.send({
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
			});

		const cartDraft: CartDraft = {
			currency: "EUR",
			country: "NL",
		};

		const cartResponse = await supertest(ctMock.app)
			.post("/dummy/carts")
			.send(cartDraft);

		await supertest(ctMock.app)
			.post(`/dummy/carts/${cartResponse.body.id}`)
			.send({
				version: cartResponse.body.version,
				actions: [
					{
						action: "addLineItem",
						productId: productResponse.body.id,
						variantId: 1,
						quantity: 2,
					},
				],
			});

		const updatedCartResponse = await supertest(ctMock.app).get(
			`/dummy/carts/${cartResponse.body.id}`,
		);

		return updatedCartResponse.body;
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

		const response = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/recurring-orders/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/recurring-orders/key=key-test-order",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/recurring-orders");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurring-orders/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setKey",
						key: "updated-key",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.key).toBe("updated-key");
		expect(updateResponse.body.version).toBe(2);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurring-orders/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setStartsAt",
						startsAt: "2025-02-01T10:00:00.000Z",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.startsAt).toBe("2025-02-01T10:00:00.000Z");
		expect(updateResponse.body.version).toBe(2);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurring-orders/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setExpiresAt",
						expiresAt: "2026-01-01T00:00:00.000Z",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.expiresAt).toBe("2026-01-01T00:00:00.000Z");
		expect(updateResponse.body.version).toBe(2);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurring-orders/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setRecurringOrderState",
						recurringOrderState: {
							type: "paused",
						},
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.recurringOrderState).toBe("Paused");
		expect(updateResponse.body.version).toBe(2);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/recurring-orders/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
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
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.skipConfiguration).toEqual({
			type: "totalSkip",
			totalToSkip: 2,
			skipped: 0,
			lastSkippedAt: undefined,
		});
		expect(updateResponse.body.expiresAt).toBe("2025-06-01T00:00:00.000Z");
		expect(updateResponse.body.version).toBe(2);
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

		const createResponse = await supertest(ctMock.app)
			.post("/dummy/recurring-orders")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const deleteResponse = await supertest(ctMock.app)
			.delete(`/dummy/recurring-orders/${createResponse.body.id}`)
			.query({ version: createResponse.body.version });

		expect(deleteResponse.status).toBe(200);
		expect(deleteResponse.body).toEqual(createResponse.body);

		const getResponse = await supertest(ctMock.app).get(
			`/dummy/recurring-orders/${createResponse.body.id}`,
		);

		expect(getResponse.status).toBe(404);
	});
});
