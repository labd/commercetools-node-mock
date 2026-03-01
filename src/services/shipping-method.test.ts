import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	cartDraftFactory,
	shippingMethodDraftFactory,
	taxCategoryDraftFactory,
	zoneDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Shipping method", () => {
	const taxCategoryDraft = taxCategoryDraftFactory(ctMock);
	const zoneDraft = zoneDraftFactory(ctMock);
	const shippingMethodDraft = shippingMethodDraftFactory(ctMock);
	const cartDraft = cartDraftFactory(ctMock);

	beforeEach(async () => {
		await taxCategoryDraft.create({
			name: "foo",
			key: "standard",
			rates: [],
		});

		await zoneDraft.create({
			name: "The Netherlands",
			key: "NL",
			locations: [
				{
					country: "NL",
				},
			],
		});
	});

	afterEach(async () => {
		ctMock.clear();
	});

	test("Create shipping method", async () => {
		const draft = shippingMethodDraft.build({
			name: "foo",
			taxCategory: { typeId: "tax-category", key: "standard" },
			isDefault: true,
			zoneRates: [],
		});

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
		const shippingMethod = await shippingMethodDraft.create({
			name: "foo",
			taxCategory: { typeId: "tax-category", key: "standard" },
			isDefault: true,
			zoneRates: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/shipping-methods/${shippingMethod.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(shippingMethod);
	});

	test("Get shipping methods matching cart", async () => {
		const cart = await cartDraft.create({
			currency: "EUR",
			shippingAddress: {
				country: "NL",
			},
		});

		await shippingMethodDraft.create({
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
		});

		await shippingMethodDraft.create({
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
		});

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
