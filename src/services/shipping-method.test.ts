import type {
	Cart,
	CartDraft,
	ShippingMethodDraft,
	TaxCategoryDraft,
	ZoneDraft,
} from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";
import { isType } from "../types";

const ctMock = new CommercetoolsMock();

describe("Shipping method", () => {
	beforeEach(async () => {
		await supertest(ctMock.app)
			.post("/dummy/tax-categories")
			.send(
				isType<TaxCategoryDraft>({
					name: "foo",
					key: "standard",
					rates: [],
				}),
			)
			.then((res) => {
				expect(res.status).toEqual(201);
			});

		await supertest(ctMock.app)
			.post("/dummy/zones")
			.send(
				isType<ZoneDraft>({
					name: "The Netherlands",
					key: "NL",
					locations: [
						{
							country: "NL",
						},
					],
				}),
			)
			.then((res) => {
				expect(res.status).toEqual(201);
			});
	});

	afterEach(async () => {
		ctMock.clear();
	});

	test("Create shipping method", async () => {
		const draft: ShippingMethodDraft = {
			name: "foo",
			taxCategory: { typeId: "tax-category", key: "standard" },
			isDefault: true,
			zoneRates: [],
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/shipping-methods")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			isDefault: true,
			lastModifiedAt: expect.anything(),
			name: "foo",
			taxCategory: {
				id: expect.anything(),
				typeId: "tax-category",
			},
			version: 1,
			zoneRates: [],
		});
	});

	test("Get shipping method", async () => {
		const draft: ShippingMethodDraft = {
			name: "foo",
			taxCategory: { typeId: "tax-category", key: "standard" },
			isDefault: true,
			zoneRates: [],
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/shipping-methods")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/shipping-methods/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Get shipping methods matching cart", async () => {
		const cart = await supertest(ctMock.app)
			.post("/dummy/carts")
			.send(
				isType<CartDraft>({
					currency: "EUR",
					shippingAddress: {
						country: "NL",
					},
				}),
			)
			.then((res) => res.body as Cart);

		await supertest(ctMock.app)
			.post("/dummy/shipping-methods")
			.send(
				isType<ShippingMethodDraft>({
					name: "NL",
					taxCategory: { typeId: "tax-category", key: "standard" },
					isDefault: true,
					zoneRates: [
						{
							zone: {
								typeId: "zone",
								key: "NL",
							},
							shippingRates: [
								{
									price: {
										currencyCode: "EUR",
										centAmount: 495,
									},
								},
							],
						},
					],
				}),
			)
			.then((res) => {
				expect(res.status).toEqual(201);
			});

		await supertest(ctMock.app)
			.post("/dummy/shipping-methods")
			.send(
				isType<ShippingMethodDraft>({
					name: "NL/GBP",
					taxCategory: { typeId: "tax-category", key: "standard" },
					isDefault: true,
					zoneRates: [
						{
							zone: {
								typeId: "zone",
								key: "NL",
							},
							shippingRates: [
								{
									price: {
										currencyCode: "GBP",
										centAmount: 495,
									},
								},
							],
						},
					],
				}),
			)
			.then((res) => {
				expect(res.status).toEqual(201);
			});

		const response = await supertest(ctMock.app).get(
			`/dummy/shipping-methods/matching-cart?cartId=${cart.id}`,
		);

		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body).toMatchObject({
			count: 1,
			limit: 20,
			offset: 0,
			results: [
				{
					name: "NL",
					zoneRates: [
						{
							shippingRates: [
								{
									isMatching: true,
									price: {
										currencyCode: "EUR",
										centAmount: 495,
									},
								},
							],
						},
					],
				},
			],
			total: 1,
		});
	});
});
