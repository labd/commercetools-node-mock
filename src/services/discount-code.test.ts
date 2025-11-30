import type { DiscountCodeDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("DiscountCode", () => {
	test("Create discount code", async () => {
		// First create a cart discount to reference
		const cartDiscountResponse = await supertest(ctMock.app)
			.post("/dummy/cart-discounts")
			.send({
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
			});

		expect(cartDiscountResponse.status).toBe(201);

		const draft: DiscountCodeDraft = {
			key: "SAVE10",
			code: "SAVE10",
			name: {
				en: "Save 10% Discount",
			},
			cartDiscounts: [
				{
					typeId: "cart-discount",
					id: cartDiscountResponse.body.id,
				},
			],
			isActive: true,
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/discount-codes")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
			applicationVersion: 1,
			cartDiscounts: [
				{
					id: cartDiscountResponse.body.id,
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
		const cartDiscountResponse = await supertest(ctMock.app)
			.post("/dummy/cart-discounts")
			.send({
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
					id: cartDiscountResponse.body.id,
				},
			],
			isActive: true,
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-codes")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/discount-codes/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});
});
