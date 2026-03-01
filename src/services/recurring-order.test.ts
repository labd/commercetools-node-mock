import { describe, expect, test } from "vitest";
import { cartDraftFactory } from "#src/testing/cart.ts";
import { productDraftFactory } from "#src/testing/product.ts";
import { productTypeDraftFactory } from "#src/testing/product-type.ts";
import { recurringOrderDraftFactory } from "#src/testing/recurring-order.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("RecurringOrder", () => {
	const createTestCart = async () => {
		const productType = await productTypeDraftFactory(ctMock).create();

		const product = await productDraftFactory(ctMock).create({
			productType: {
				typeId: "product-type",
				id: productType.id,
			},
			masterVariant: {
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

		const cart = await cartDraftFactory(ctMock).create({
			currency: "EUR",
			country: "NL",
		});

		await ctMock.app.inject({
			method: "POST",
			url: `/dummy/carts/${cart.id}`,
			payload: {
				version: cart.version,
				actions: [
					{
						action: "addLineItem",
						productId: product.id,
						variantId: 1,
						quantity: 2,
					},
				],
			},
		});

		const updatedCartResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/carts/${cart.id}`,
		});

		return updatedCartResponse.json();
	};

	test("Create recurring order", async () => {
		const cart = await createTestCart();

		const draft = recurringOrderDraftFactory(ctMock).build({
			key: "weekly-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
			expiresAt: "2025-12-31T23:59:59.000Z",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/recurring-orders",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			id: expect.anything(),
			key: "weekly-order",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
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

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "get-test-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(recurringOrder);
	});

	test("Get recurring order by key", async () => {
		const cart = await createTestCart();

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "key-test-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/recurring-orders/key=key-test-order",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(recurringOrder);
	});

	test("Query recurring orders", async () => {
		const cart = await createTestCart();

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "query-test-order",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/recurring-orders",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(recurringOrder);
	});

	test("Update recurring order - setKey", async () => {
		const cart = await createTestCart();

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "original-key",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
			payload: {
				version: recurringOrder.version,
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

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "starts-at-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
			payload: {
				version: recurringOrder.version,
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

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "expires-at-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
			payload: {
				version: recurringOrder.version,
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

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "state-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
			payload: {
				version: recurringOrder.version,
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

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "skip-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
			payload: {
				version: recurringOrder.version,
				actions: [
					{
						action: "setOrderSkipConfiguration",
						skipConfigurationInputDraft: {
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

		const recurringOrder = await recurringOrderDraftFactory(ctMock).create({
			key: "delete-test",
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
			startsAt: "2025-01-01T10:00:00.000Z",
		});

		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/recurring-orders/${recurringOrder.id}?version=${recurringOrder.version}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(recurringOrder);

		const getResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/recurring-orders/${recurringOrder.id}`,
		});

		expect(getResponse.statusCode).toBe(404);
	});
});
