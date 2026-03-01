import { describe, expect, test } from "vitest";
import {
	cartDiscountDraftFactory,
	discountCodeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("DiscountCode", () => {
	const cartDiscountFactory = cartDiscountDraftFactory(ctMock);
	const discountCodeFactory = discountCodeDraftFactory(ctMock);

	test("Create discount code", async () => {
		const cartDiscount = await cartDiscountFactory.create({
			key: "test-cart-discount",
			name: { en: "Test Cart Discount" },
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

		const draft = discountCodeFactory.build({
			key: "SAVE10",
			code: "SAVE10",
			name: { en: "Save 10% Discount" },
			cartDiscounts: [
				{
					typeId: "cart-discount",
					id: cartDiscount.id,
				},
			],
			isActive: true,
		});

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
					id: cartDiscount.id,
					typeId: "cart-discount",
				},
			],
			code: "SAVE10",
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			groups: [],
			id: expect.anything(),
			isActive: true,
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			name: {
				en: "Save 10% Discount",
			},
			references: [],
			version: 1,
		});
	});

	test("Get discount code", async () => {
		const cartDiscount = await cartDiscountFactory.create({
			key: "test-cart-discount-2",
			name: { en: "Test Cart Discount 2" },
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

		const discountCode = await discountCodeFactory.create({
			key: "TEST10",
			code: "TEST10",
			name: { en: "Test Discount" },
			cartDiscounts: [
				{
					typeId: "cart-discount",
					id: cartDiscount.id,
				},
			],
			isActive: true,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/discount-codes/${discountCode.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(discountCode);
	});
});
