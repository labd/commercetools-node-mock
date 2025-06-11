import type { ProductDiscountDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

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
		const response = await supertest(ctMock.app)
			.post("/dummy/product-discounts")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/product-discounts")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/product-discounts/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/product-discounts")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/product-discounts/key=key-discount",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/product-discounts")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/product-discounts",
		);

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});
