import type { ProductDiscountDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("ProductDiscount", () => {
	test("Create product discount", async () => {
		const draft: ProductDiscountDraft = {
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
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-discounts",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			description: {
				en: "20% off all products",
			},
			id: expect.anything(),
			isActive: true,
			key: "summer-sale",
			lastModifiedAt: expect.anything(),
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
		const draft: ProductDiscountDraft = {
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
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-discounts",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-discounts/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get product discount by key", async () => {
		const draft: ProductDiscountDraft = {
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
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-discounts",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-discounts/key=key-discount",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query product discounts", async () => {
		const draft: ProductDiscountDraft = {
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
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-discounts",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-discounts",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});
});
