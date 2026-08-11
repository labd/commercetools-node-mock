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
	taxCategoryDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

let productType: ProductType;
let productProjection: ProductProjection;
let publishedProduct: Product;
let unpublishedProduct: Product;

const productTypeFactory = productTypeDraftFactory(ctMock);
const productFactory = productDraftFactory(ctMock);
const taxCategoryFactory = taxCategoryDraftFactory(ctMock);

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
			searchKeywords: {},
			productType: {
				typeId: "product-type",
				id: productType.id,
			},
		};
	}
});

afterEach(async () => {
	timekeeper.reset();
	await ctMock.clear();
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

	test("includes the product-level references and meta fields", async () => {
		const taxCategory = await taxCategoryFactory.create({
			key: "standard",
			name: "Standard",
			rates: [
				{ name: "NL 21%", amount: 0.21, includedInPrice: true, country: "NL" },
			],
		});
		const product = await productFactory.create({
			publish: true,
			productType: { typeId: "product-type", id: productType.id },
			taxCategory: { typeId: "tax-category", key: "standard" },
			metaTitle: { "nl-NL": "Meta titel" },
			metaKeywords: { "nl-NL": "cactus, plant" },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-projections/${product.id}`,
		});
		const result: ProductProjection = response.json();

		expect(result.taxCategory).toEqual({
			typeId: "tax-category",
			id: taxCategory.id,
		});
		expect(result.metaTitle).toEqual({ "nl-NL": "Meta titel" });
		expect(result.metaKeywords).toEqual({ "nl-NL": "cactus, plant" });
		expect(result.searchKeywords).toEqual({});
	});

	test("expands the tax category", async () => {
		await taxCategoryFactory.create({
			key: "standard",
			name: "Standard",
			rates: [
				{ name: "NL 21%", amount: 0.21, includedInPrice: true, country: "NL" },
			],
		});
		const product = await productFactory.create({
			publish: true,
			productType: { typeId: "product-type", id: productType.id },
			taxCategory: { typeId: "tax-category", key: "standard" },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/product-projections/${product.id}`,
			query: { expand: "taxCategory" },
		});
		const result: ProductProjection = response.json();

		expect(result.taxCategory?.obj?.rates).toEqual([
			expect.objectContaining({
				country: "NL",
				amount: 0.21,
				includedInPrice: true,
			}),
		]);
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

describe("Product Projection Query - sorting", () => {
	const many = 6;

	beforeEach(async () => {
		for (let index = 0; index < many; index++) {
			await productFactory.create({
				publish: true,
				key: `sortable-${index}`,
				name: { "nl-NL": `sortable ${index}` },
				slug: { "nl-NL": `sortable-${index}` },
				masterVariant: { sku: `sortable-sku-${index}` },
			});
		}
	});

	const query = async (
		params: Record<string, string>,
	): Promise<ProductProjectionPagedSearchResponse> => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/product-projections",
			query: params,
		});
		return response.json();
	};

	test("sorts ascending by id", async () => {
		const result = await query({ sort: "id asc", limit: "50" });
		const ids = result.results.map((entry) => entry.id);

		expect(ids).toEqual([...ids].sort());
	});

	test("sorts descending by id", async () => {
		const result = await query({ sort: "id desc", limit: "50" });
		const ids = result.results.map((entry) => entry.id);

		expect(ids).toEqual([...ids].sort().reverse());
	});

	test("sorts on a localized field", async () => {
		const result = await query({ sort: "name.nl-NL asc", limit: "50" });
		const names = result.results.map((entry) => entry.name["nl-NL"]);

		expect(names).toEqual([...names].sort());
	});

	test("sorts before paging, not within a page", async () => {
		const first = await query({ sort: "id asc", limit: "3" });
		const second = await query({ sort: "id asc", limit: "3", offset: "3" });
		const ids = [...first.results, ...second.results].map((entry) => entry.id);

		expect(ids).toEqual([...ids].sort());
	});

	test("supports cursor paging with a where predicate", async () => {
		// How a consumer walks a catalog larger than one page. It only terminates
		// and only visits each product once if `sort` and `where` agree on the
		// ordering — which is what this repository was missing.
		const seen: string[] = [];
		let lastId: string | undefined;

		for (;;) {
			const page = await query({
				...(lastId ? { where: `id > "${lastId}"` } : {}),
				sort: "id asc",
				limit: "2",
			});

			seen.push(...page.results.map((entry) => entry.id));
			if (page.results.length < 2) {
				break;
			}
			lastId = page.results[page.results.length - 1].id;
		}

		// Every published product exactly once: the ones created here plus the
		// published product from the outer setup.
		expect(seen).toHaveLength(many + 1);
		expect(new Set(seen).size).toBe(many + 1);
		expect(seen).toEqual([...seen].sort());
	});
});
