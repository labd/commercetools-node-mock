import type { DiscountCodeDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("DiscountCode", () => {
	test("Create discount code", async () => {
		// First create a cart discount to reference
		const cartDiscountResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/cart-discounts",
			payload: {
				key: "test-cart-discount",
				name: {
					en: "Test Cart Discount",
				},
				value: {
					type: "relative",
					permyriad: 1000,
				},
				cartPredicate: "1 = 1",
				target: {
					type: "totalPrice",
				},
				sortOrder: "0.1",
			},
		});

		expect(cartDiscountResponse.statusCode).toBe(201);

		const draft: DiscountCodeDraft = {
			key: "SAVE10",
			code: "SAVE10",
			name: {
				en: "Save 10% Discount",
			},
			cartDiscounts: [
				{
					typeId: "cart-discount",
					id: cartDiscountResponse.json().id,
				},
			],
			isActive: true,
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-codes",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			applicationVersion: 1,
			cartDiscounts: [
				{
					id: cartDiscountResponse.json().id,
					typeId: "cart-discount",
				},
			],
			code: "SAVE10",
			createdAt: expect.anything(),
			groups: [],
			id: expect.anything(),
			isActive: true,
			lastModifiedAt: expect.anything(),
			name: {
				en: "Save 10% Discount",
			},
			references: [],
			version: 1,
		});
	});

	test("Get discount code", async () => {
		// First create a cart discount to reference
		const cartDiscountResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/cart-discounts",
			payload: {
				key: "test-cart-discount-2",
				name: {
					en: "Test Cart Discount 2",
				},
				value: {
					type: "relative",
					permyriad: 500,
				},
				cartPredicate: "1 = 1",
				target: {
					type: "totalPrice",
				},
				sortOrder: "0.1",
			},
		});

		const draft: DiscountCodeDraft = {
			key: "TEST10",
			code: "TEST10",
			name: {
				en: "Test Discount",
			},
			cartDiscounts: [
				{
					typeId: "cart-discount",
					id: cartDiscountResponse.json().id,
				},
			],
			isActive: true,
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-codes",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/discount-codes/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});
});
