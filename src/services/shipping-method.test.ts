import type {
	Cart,
	CartDraft,
	ShippingMethodDraft,
	TaxCategoryDraft,
	ZoneDraft,
} from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";
import { isType } from "../types.ts";

const ctMock = new CommercetoolsMock();

describe("Shipping method", () => {
	beforeEach(async () => {
		const taxCatResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/tax-categories",
			payload: isType<TaxCategoryDraft>({
				name: "foo",
				key: "standard",
				rates: [],
			}),
		});
		expect(taxCatResponse.statusCode).toEqual(201);

		const zoneResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/zones",
			payload: isType<ZoneDraft>({
				name: "The Netherlands",
				key: "NL",
				locations: [
					{
						country: "NL",
					},
				],
			}),
		});
		expect(zoneResponse.statusCode).toEqual(201);
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
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/shipping-methods",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
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
			active: true,
		});
	});

	test("Get shipping method", async () => {
		const draft: ShippingMethodDraft = {
			name: "foo",
			taxCategory: { typeId: "tax-category", key: "standard" },
			isDefault: true,
			zoneRates: [],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/shipping-methods",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/shipping-methods/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get shipping methods matching cart", async () => {
		const cartResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: isType<CartDraft>({
				currency: "EUR",
				shippingAddress: {
					country: "NL",
				},
			}),
		});
		const cart = cartResponse.json() as Cart;

		const smResponse1 = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/shipping-methods",
			payload: isType<ShippingMethodDraft>({
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
		});
		expect(smResponse1.statusCode).toEqual(201);

		const smResponse2 = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/shipping-methods",
			payload: isType<ShippingMethodDraft>({
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
		});
		expect(smResponse2.statusCode).toEqual(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/shipping-methods/matching-cart?cartId=${cart.id}`,
		});

		const body = response.json();
		expect(response.statusCode, JSON.stringify(body)).toBe(200);
		expect(body).toMatchObject({
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
