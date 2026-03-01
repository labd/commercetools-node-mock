import { describe, expect, test } from "vitest";
import { productDiscountDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("ProductDiscount", () => {
	const productDiscountDraft = productDiscountDraftFactory(ctMock);

	test("Create product discount", async () => {
		const draft = productDiscountDraft.build({
			key: "summer-sale",
			name: {
				en: "Summer Sale",
			},
			description: {
				en: "20% off all products",
			},
			value: {
				type: "relative",
				permyriad: 2000,
			},
			predicate: "1=1",
			sortOrder: "0.1",
			isActive: true,
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-discounts",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			description: {
				en: "20% off all products",
			},
			id: expect.anything(),
			isActive: true,
			key: "summer-sale",
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			name: {
				en: "Summer Sale",
			},
			predicate: "1=1",
			references: [],
			sortOrder: "0.1",
			validFrom: undefined,
			validUntil: undefined,
			value: {
				permyriad: 2000,
				type: "relative",
			},
			version: 1,
		});
	});

	test("Get product discount", async () => {
		const productDiscount = await productDiscountDraft.create({
			key: "test-discount",
			name: {
				en: "Test Discount",
			},
			value: {
				type: "absolute",
				money: [
					{
						currencyCode: "EUR",
						centAmount: 1000,
					},
				],
			},
			predicate: "1=1",
			sortOrder: "0.2",
			isActive: true,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-discounts/${productDiscount.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(productDiscount);
	});

	test("Get product discount by key", async () => {
		const productDiscount = await productDiscountDraft.create({
			key: "key-discount",
			name: {
				en: "Key Discount",
			},
			value: {
				type: "relative",
				permyriad: 1500,
			},
			predicate: "1=1",
			sortOrder: "0.3",
			isActive: false,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-discounts/key=key-discount",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(productDiscount);
	});

	test("Query product discounts", async () => {
		const productDiscount = await productDiscountDraft.create({
			key: "query-discount",
			name: {
				en: "Query Discount",
			},
			value: {
				type: "relative",
				permyriad: 500,
			},
			predicate: "1=1",
			sortOrder: "0.4",
			isActive: true,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-discounts",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(productDiscount);
	});
});
