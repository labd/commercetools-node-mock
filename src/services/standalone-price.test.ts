import type { StandalonePriceDraft } from "@commercetools/platform-sdk";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
} from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Standalone price Query", () => {
	beforeAll(async () => {
		const draft: StandalonePriceDraft = {
			value: {
				centAmount: 100,
				currencyCode: "EUR",
			},
			country: "DE",
			sku: "foo",
			active: true,
			channel: {
				typeId: "channel",
				id: "bar",
			},
			discounted: {
				value: {
					centAmount: 80,
					currencyCode: "EUR",
				},
				discount: {
					typeId: "product-discount",
					id: "baz",
				},
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/standalone-prices",
			payload: draft,
		});
		expect(createResponse.statusCode).toEqual(201);
	});

	afterAll(async () => {
		ctMock.clear();
	});

	test("Get standalone price", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/standalone-prices?sku=foo",
		});

		expect(response.statusCode).toBe(200);

		expect(response.json().results).toEqual([
			{
				active: true,
				channel: {
					id: "bar",
					typeId: "channel",
				},
				country: "DE",
				createdAt: expect.anything(),
				discounted: {
					discount: {
						id: "baz",
						typeId: "product-discount",
					},
					value: {
						centAmount: 80,
						currencyCode: "EUR",
						fractionDigits: 2,
						type: "centPrecision",
					},
				},
				id: expect.anything(),
				lastModifiedAt: expect.anything(),
				sku: "foo",
				value: {
					centAmount: 100,
					currencyCode: "EUR",
					fractionDigits: 2,
					type: "centPrecision",
				},
				version: 1,
			},
		]);
	});
});

describe("Standalone price Actions", () => {
	let id: string | undefined;
	beforeEach(async () => {
		const draft: StandalonePriceDraft = {
			value: {
				centAmount: 100,
				currencyCode: "EUR",
			},
			country: "DE",
			sku: "foo",
			active: true,
			channel: {
				typeId: "channel",
				id: "bar",
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/standalone-prices",
			payload: draft,
		});
		expect(createResponse.statusCode).toEqual(201);
		id = createResponse.json().id;
	});

	afterEach(async () => {
		ctMock.clear();
	});

	test("changeValue", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/standalone-prices/${id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "changeValue",
						value: {
							centAmount: 200,
							currencyCode: "EUR",
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);

		expect(response.json()).toEqual({
			active: true,
			channel: {
				id: "bar",
				typeId: "channel",
			},
			country: "DE",
			createdAt: expect.anything(),
			id: id,
			lastModifiedAt: expect.anything(),
			sku: "foo",
			value: {
				centAmount: 200,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			},
			version: 2,
		});
	});

	test("setActive", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/standalone-prices/${id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setActive",
						active: false,
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);

		expect(response.json()).toEqual({
			active: false,
			channel: {
				id: "bar",
				typeId: "channel",
			},
			country: "DE",
			createdAt: expect.anything(),
			id: id,
			lastModifiedAt: expect.anything(),
			sku: "foo",
			value: {
				centAmount: 100,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			},
			version: 2,
		});
	});

	test("setDiscounted", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/standalone-prices/${id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setDiscountedPrice",
						discounted: {
							value: {
								centAmount: 80,
								currencyCode: "EUR",
							},
							discount: {
								typeId: "product-discount",
								id: "baz",
							},
						},
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);

		expect(response.json()).toEqual({
			active: true,
			channel: {
				id: "bar",
				typeId: "channel",
			},
			country: "DE",
			createdAt: expect.anything(),
			discounted: {
				discount: {
					id: "baz",
					typeId: "product-discount",
				},
				value: {
					centAmount: 80,
					currencyCode: "EUR",
					fractionDigits: 2,
					type: "centPrecision",
				},
			},
			id: id,
			lastModifiedAt: expect.anything(),
			sku: "foo",
			value: {
				centAmount: 100,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			},
			version: 2,
		});

		const response2 = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/standalone-prices/${id}`,
			payload: {
				version: 2,
				actions: [
					{
						action: "setDiscountedPrice",
						discounted: null,
					},
				],
			},
		});

		expect(response2.statusCode).toBe(200);

		expect(response2.json()).toEqual({
			active: true,
			channel: {
				id: "bar",
				typeId: "channel",
			},
			country: "DE",
			createdAt: expect.anything(),
			id: id,
			lastModifiedAt: expect.anything(),
			sku: "foo",
			value: {
				centAmount: 100,
				currencyCode: "EUR",
				fractionDigits: 2,
				type: "centPrecision",
			},
			version: 3,
		});
	});
});
