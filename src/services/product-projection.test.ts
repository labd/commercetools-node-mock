import type {
	Product,
	ProductProjection,
	ProductProjectionPagedSearchResponse,
	ProductType,
} from "@commercetools/platform-sdk";
import * as timekeeper from "timekeeper";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	productDraftFactory,
	productTypeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

let productType: ProductType;
let productProjection: ProductProjection;
let publishedProduct: Product;
let unpublishedProduct: Product;

const productTypeFactory = productTypeDraftFactory(ctMock);
const productFactory = productDraftFactory(ctMock);

beforeEach(async () => {
	timekeeper.freeze(new Date("2022-07-22T13:31:49.840Z"));

	// Create the product type
	productType = await productTypeFactory.create({
		name: "Default Product Type",
		description: "Product type for testing",
	});

	// Create an unpublished product
	unpublishedProduct = await productFactory.create({
		publish: false,
		key: "my-unpublished-product",
		attributes: [{ name: "number", value: 11 as any }],
		masterVariant: {
			sku: "my-unpub-sku",
			prices: [
				{
					value: {
						currencyCode: "EUR",
						centAmount: 189,
					},
				},
			],
			attributes: [
				{
					name: "number",
					value: 1 as any,
				},
			],
		},
		name: {
			"nl-NL": "test unpublished product",
		},
		productType: {
			typeId: "product-type",
			id: productType.id,
		},
		slug: {
			"nl-NL": "test-unpublished-product",
		},
	});

	// Create a published product
	{
		const productDraft = {
			publish: true,
			key: "my-product-key",
			attributes: [{ name: "number", value: 111 as any }],
			masterVariant: {
				sku: "my-sku",
				prices: [
					{
						value: {
							currencyCode: "EUR",
							centAmount: 1789,
						},
					},
				],
				attributes: [
					{
						name: "number",
						value: 4 as any,
					},
					{
						name: "store",
						value: ["test-store"],
					},
				],
			},
			variants: [
				{
					sku: "my-other-sku",
					prices: [
						{
							value: {
								currencyCode: "EUR",
								centAmount: 91789,
							},
						},
					],
					attributes: [
						{
							name: "number",
							value: 50 as any,
						},
					],
				},
			],
			name: {
				"nl-NL": "test product",
			},
			productType: {
				typeId: "product-type" as const,
				id: productType.id,
			},
			slug: {
				"nl-NL": "test-product",
			},
		};

		const product = await productFactory.create(productDraft);
		publishedProduct = product;

		// Create the expected ProductProjection object
		productProjection = {
			id: product.id,
			createdAt: "2022-07-22T13:31:49.840Z",
			lastModifiedAt: "2022-07-22T13:31:49.840Z",
			version: 1,
			key: "my-product-key",
			published: true,
			hasStagedChanges: false,
			attributes: [{ name: "number", value: 111 as any }],
			masterVariant: {
				id: 1,
				sku: "my-sku",
				prices: [
					{
						id: product.masterData.current.masterVariant.prices![0].id,
						value: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 1789,
							fractionDigits: 2,
						},
					},
				],
				assets: [],
				images: [],
				attributes: productDraft.masterVariant?.attributes,
			},
			variants: [
				{
					id: 2,
					sku: "my-other-sku",
					prices: [
						{
							id: product.masterData.current.variants[0].prices![0].id,
							value: {
								type: "centPrecision",
								currencyCode: "EUR",
								centAmount: 91789,
								fractionDigits: 2,
							},
						},
					],
					assets: [],
					images: [],
					attributes: productDraft.variants?.[0].attributes,
				},
			],
			name: product.masterData.current.name,
			slug: product.masterData.current.slug,
			categories: [],
			productType: {
				typeId: "product-type",
				id: productType.id,
			},
		};
	}
});

afterEach(async () => {
	timekeeper.reset();
	ctMock.clear();
});
// Test the general product projection implementation
describe("Product Projection Get By ID", () => {
	test("Get By ID", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-projections/${publishedProduct.id}`,
		});

		const result: ProductProjection = response.json();

		expect(result).toBeDefined();
		expect(result.id).toBe(publishedProduct.id);
	});
});

// Test the general product projection implementation
describe("Product Projection Query - Generic", () => {
	test("Filter out staged", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections",
			query: {
				limit: "50",
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toEqual({
			count: 1,
			limit: 50,
			offset: 0,
			total: 1,
			results: [productProjection],
		});
	});

	test("Filter on valid slug", async () => {
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/product-projections",
				query: {
					limit: "50",
					where: "slug(nl-NL=:slug)",
					"var.slug": "test-product",
				},
			});

			const result: ProductProjectionPagedSearchResponse = response.json();
			expect(result).toEqual({
				count: 1,
				limit: 50,
				offset: 0,
				total: 1,
				results: [productProjection],
			});
		}
	});

	test("Filter on complex query", async () => {
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/product-projections",
				query: {
					limit: "50",
					where:
						'slug(nl-NL=:slug) and variants(attributes(name="store" and value="test-store"))',
					"var.slug": "test-product",
					"var.store": "test-store",
				},
			});

			const result: ProductProjectionPagedSearchResponse = response.json();
			expect(result).toEqual({
				count: 1,
				limit: 50,
				offset: 0,
				total: 1,
				results: [productProjection],
			});
		}
	});

	test("Filter on invalid slug", async () => {
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/product-projections",
				query: {
					limit: "50",
					where: "slug(nl-NL=:slug)",
					"var.slug": "missing-product",
				},
			});

			const result: ProductProjectionPagedSearchResponse = response.json();
			expect(result).toEqual({
				count: 0,
				limit: 50,
				offset: 0,
				total: 0,
				results: [],
			});
		}
	});
});

// Test the general product projection implementation
describe("Product Projection Search - Generic", () => {
	test("Pagination", async () => {
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/product-projections/search",
				query: {
					limit: "50",
				},
			});

			const result: ProductProjectionPagedSearchResponse = response.json();
			expect(result).toEqual({
				count: 1,
				limit: 50,
				offset: 0,
				total: 1,
				facets: {},
				results: [productProjection],
			});
		}
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/product-projections/search",
				query: {
					limit: "50",
					offset: "50",
				},
			});

			const projection: ProductProjection = response.json();
			expect(projection).toEqual({
				count: 0,
				limit: 50,
				offset: 50,
				total: 1,
				facets: {},
				results: [],
			});
		}
	});

	test("Search - unpublished", async () => {
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/product-projections/search",
				query: {
					limit: "50",
					staged: "true",
				},
			});

			const result: ProductProjectionPagedSearchResponse = response.json();

			expect(result).toMatchObject({
				count: 2,
				limit: 50,
				offset: 0,
				total: 2,
				facets: {},
				results: [
					{ id: unpublishedProduct.id, published: false },
					{ id: publishedProduct.id, published: true },
				],
			});
		}
	});

	test("Get 404 when not found by key with expand", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/key=DOESNOTEXIST",
			query: {
				expand: "categories[*]",
			},
		});

		expect(response.statusCode).toBe(404);
	});
});

describe("Product Projection Search - Filters", () => {
	test("variants.sku", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/search",
			query: {
				filter: 'variants.sku:"my-sku"',
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toMatchObject({
			count: 1,
			results: [
				{
					masterVariant: { sku: "my-sku" },
				},
			],
		});
	});

	test("variants.attributes.range - match", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/search",
			query: {
				filter: "variants.attributes.number:range(0 TO 10)",
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toMatchObject({
			count: 1,
			results: [
				{
					masterVariant: { sku: "my-sku" },
				},
			],
		});
	});

	test("variants.attributes.range - mismatch", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/search",
			query: {
				filter: "variants.attributes.number:range(5 TO 10)",
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toMatchObject({
			count: 0,
			results: [],
		});
	});
});

describe("Product Projection Search - Facets", () => {
	test("termExpr - variants.attributes.number", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/search",
			query: {
				facet: "variants.attributes.number",
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toMatchObject({
			count: 1,
			facets: {
				"variants.attributes.number": {
					type: "terms",
					dataType: "text",
					missing: 0,
					total: 2,
					terms: [
						{
							term: "4.0",
							count: 1,
						},
						{
							term: "50.0",
							count: 1,
						},
					],
				},
			},
			results: [
				{
					masterVariant: { sku: "my-sku" },
				},
			],
		});
	});

	test("filterExpr - variants.attributes.number", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/search",
			query: {
				facet: "variants.attributes.number:3,4",
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toMatchObject({
			count: 1,
			facets: {
				"variants.attributes.number": {
					type: "filter",
					count: 1,
				},
			},
			results: [
				{
					masterVariant: { sku: "my-sku" },
				},
			],
		});
	});

	test("rangeExpr - variants.attributes.number", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections/search",
			query: {
				facet:
					"variants.attributes.number:range(* TO 5), (5 TO 25), (25 TO 100)",
			},
		});

		const result: ProductProjectionPagedSearchResponse = response.json();
		expect(result).toMatchObject({
			count: 1,
			facets: {
				"variants.attributes.number": {
					type: "range",
					dataType: "number",
					ranges: [
						{
							type: "double",
							from: 0.0,
							fromStr: "",
							to: 5.0,
							toStr: "5.0",
							count: 1,
							// totalCount: 1,
							total: 4.0,
							min: 4.0,
							max: 4.0,
							mean: 4.0,
						},
						{
							type: "double",
							from: 5.0,
							fromStr: "5.0",
							to: 25.0,
							toStr: "25.0",
							count: 0,
							// totalCount: 0,
							total: 0.0,
							min: 0.0,
							max: 0.0,
							mean: 0.0,
						},
						{
							type: "double",
							from: 25.0,
							fromStr: "25.0",
							to: 100.0,
							toStr: "100.0",
							count: 1,
							// totalCount: 1,
							total: 50,
							min: 50.0,
							max: 50.0,
							mean: 50.0,
						},
					],
				},
			},
			results: [
				{
					masterVariant: { sku: "my-sku" },
				},
			],
		});
	});
});
