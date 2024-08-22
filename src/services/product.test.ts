import {
	Category,
	CategoryDraft,
	Image,
	PriceDraft,
	Product,
	ProductData,
	ProductDraft,
	ProductPagedSearchResponse,
	ProductSearchRequest,
	ProductSearchResult,
	ProductType,
	ProductTypeDraft,
	State,
	StateDraft,
	TaxCategory,
	TaxCategoryDraft,
	Type,
	TypeDraft,
} from "@commercetools/platform-sdk";
import assert from "assert";
import supertest from "supertest";
import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const productTypeDraft: ProductTypeDraft = {
	key: "test-product-type",
	name: "Test Product Type",
	description: "Test Product Type description",
};

const categoryDraft1: CategoryDraft = {
	key: "category-1",
	name: {
		"nl-NL": "Category One",
	},
	slug: {
		"nl-NL": "category_1",
	},
};

const categoryDraft2: CategoryDraft = {
	key: "category-2",
	name: {
		"nl-NL": "Category Two",
	},
	slug: {
		"nl-NL": "category_2",
	},
};

const taxcategoryDraft1: TaxCategoryDraft = {
	name: "Tax category 1",
	key: "tax-category-1",
};

const taxcategoryDraft2: TaxCategoryDraft = {
	name: "Tax category 2",
	key: "tax-category-2",
};

const productState1Draft: StateDraft = {
	key: "initial-state",
	type: "ProductState",
	initial: true,
	name: {
		"nl-NL": "Initial state",
	},
	description: {
		"nl-NL": "Product initial state",
	},
};

const productState2Draft: StateDraft = {
	key: "another-state",
	type: "ProductState",
	initial: true,
	name: {
		"nl-NL": "Another state",
	},
	description: {
		"nl-NL": "Product another state",
	},
};

const productPriceTypeDraft: TypeDraft = {
	key: "product-price",
	name: {
		en: "ProductPriceType",
	},
	description: {
		en: "Product Price Type",
	},
	resourceTypeIds: ["product-price"],
	fieldDefinitions: [
		{
			name: "lastModifiedAt",
			label: {
				en: "Last modified at",
			},
			required: false,
			type: {
				name: "DateTime",
			},
			inputHint: "SingleLine",
		},
	],
};

const publishedProductDraft: ProductDraft = {
	name: {
		"nl-NL": "test published product",
	},
	description: {
		"nl-NL": "Test published product description",
	},
	productType: {
		typeId: "product-type",
		key: "test-product-type",
	},
	categories: [
		{
			typeId: "category",
			key: "category-1",
		},
	],
	taxCategory: {
		typeId: "tax-category",
		key: taxcategoryDraft1.key,
	},
	state: {
		typeId: "state",
		key: "initial-state",
	},
	masterVariant: {
		key: "master-variant-key",
		sku: "1337",
		attributes: [
			{
				name: "test",
				value: "test",
			},
		],
		prices: [
			{
				key: "base_price_eur",
				country: "NL",
				value: {
					currencyCode: "EUR",
					centAmount: 1000,
				},
			},
		],
	},
	variants: [
		{
			key: "variant-1-key",
			sku: "1338",
			attributes: [
				{
					name: "test2",
					value: "test2",
				},
			],
			prices: [
				{
					key: "base_price_eur",
					country: "NL",
					value: {
						currencyCode: "EUR",
						centAmount: 2000,
					},
				},
			],
		},
	],
	slug: {
		"nl-NL": "test-published-product",
	},
	metaTitle: {
		"nl-NL": "Unpublished product (meta title)",
	},
	metaDescription: {
		"nl-NL": "Unpublished product description (meta description)",
	},
	metaKeywords: {
		"nl-NL": "Test product (meta Keywords)",
	},
	publish: true,
};

const unpublishedProductDraft: ProductDraft = {
	key: "test-unpublished-product",
	name: {
		"nl-NL": "test unpublished product",
	},
	description: {
		"nl-NL": "Test published product description",
	},
	productType: {
		typeId: "product-type",
		key: "test-product-type",
	},
	categories: [
		{
			typeId: "category",
			key: "category-1",
		},
	],
	taxCategory: {
		typeId: "tax-category",
		key: taxcategoryDraft1.key,
	},
	state: {
		typeId: "state",
		key: "initial-state",
	},
	masterVariant: {
		key: "master-variant-key",
		sku: "2337",
		attributes: [
			{
				name: "test",
				value: "test",
			},
		],
		prices: [
			{
				key: "base_price_eur",
				country: "NL",
				value: {
					currencyCode: "EUR",
					centAmount: 1000,
				},
			},
		],
	},
	variants: [
		{
			key: "variant-1-key",
			sku: "2338",
			attributes: [
				{
					name: "test2",
					value: "test2",
				},
			],
			prices: [
				{
					key: "base_price_eur",
					country: "NL",
					value: {
						currencyCode: "EUR",
						centAmount: 2000,
					},
				},
			],
		},
	],
	slug: {
		"nl-NL": "test-unpublished-product",
	},
	metaTitle: {
		"nl-NL": "Unpublished product (meta title)",
	},
	metaDescription: {
		"nl-NL": "Unpublished product description (meta description)",
	},
	metaKeywords: {
		"nl-NL": "Test product (meta Keywords)",
	},
	publish: false,
};

let productType: ProductType;
let category1: Category;
let category2: Category;
let taxCategory1: TaxCategory;
let taxCategory2: TaxCategory;
let productState1: State;
let productState2: State;
let productPriceType: Type;

async function beforeAllProductTests(mock: CommercetoolsMock) {
	let response;
	// Create Product Type
	response = await supertest(mock.app)
		.post("/dummy/product-types")
		.send(productTypeDraft);

	expect(response.status).toBe(201);
	productType = response.body;

	// Create Category 1
	response = await supertest(mock.app)
		.post("/dummy/categories")
		.send(categoryDraft1);

	expect(response.status).toBe(201);
	category1 = response.body;

	// Create Category 2
	response = await supertest(mock.app)
		.post("/dummy/categories")
		.send(categoryDraft2);

	expect(response.status).toBe(201);
	category2 = response.body;

	// Create Tax Category 1
	response = await supertest(mock.app)
		.post("/dummy/tax-categories")
		.send(taxcategoryDraft1);

	expect(response.status).toBe(201);
	taxCategory1 = response.body;

	// Create Tax Category 2
	response = await supertest(mock.app)
		.post("/dummy/tax-categories")
		.send(taxcategoryDraft2);

	expect(response.status).toBe(201);
	taxCategory2 = response.body;

	// Create Product State 1
	response = await supertest(mock.app)
		.post("/dummy/states")
		.send(productState1Draft);

	expect(response.status).toBe(201);
	productState1 = response.body;

	// Create Product State 2
	response = await supertest(mock.app)
		.post("/dummy/states")
		.send(productState2Draft);

	expect(response.status).toBe(201);
	productState2 = response.body;

	response = await supertest(mock.app)
		.post("/dummy/types")
		.send(productPriceTypeDraft);
	expect(response.status).toBe(201);
	productPriceType = response.body;
}

describe("Product", () => {
	const ctMock = new CommercetoolsMock();
	beforeAll(async () => {
		await beforeAllProductTests(ctMock);
	});

	test("Create product", async () => {
		assert(productType, "product type not created");

		const response = await supertest(ctMock.app)
			.post("/dummy/products")
			.send(unpublishedProductDraft);

		const productData: ProductData = {
			name: {
				"nl-NL": "test unpublished product",
			},
			description: {
				"nl-NL": "Test published product description",
			},
			slug: {
				"nl-NL": "test-unpublished-product",
			},
			categories: [
				{
					id: category1.id,
					typeId: "category",
				},
			],
			metaTitle: {
				"nl-NL": "Unpublished product (meta title)",
			},
			metaDescription: {
				"nl-NL": "Unpublished product description (meta description)",
			},
			metaKeywords: {
				"nl-NL": "Test product (meta Keywords)",
			},
			masterVariant: {
				id: 1,
				key: "master-variant-key",
				sku: "2337",
				assets: [],
				attributes: [
					{
						name: "test",
						value: "test",
					},
				],
				prices: [
					{
						id: expect.anything(),
						key: "base_price_eur",
						country: "NL",
						value: {
							type: "centPrecision",
							centAmount: 1000,
							currencyCode: "EUR",
							fractionDigits: 2,
						},
					},
				],
				images: [],
			},
			variants: [
				{
					key: "variant-1-key",
					sku: "2338",
					assets: [],
					id: 2,
					images: [],
					attributes: [
						{
							name: "test2",
							value: "test2",
						},
					],
					prices: [
						{
							id: expect.anything(),
							key: "base_price_eur",
							country: "NL",
							value: {
								type: "centPrecision",
								centAmount: 2000,
								currencyCode: "EUR",
								fractionDigits: 2,
							},
						},
					],
				},
			],
			searchKeywords: {},
		};

		expect(response.body).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			lastModifiedAt: expect.anything(),
			key: "test-unpublished-product",
			taxCategory: {
				typeId: "tax-category",
				id: taxCategory1.id,
			},
			masterData: {
				staged: productData,
				current: productData,
				hasStagedChanges: false,
				published: false,
			},
			productType: {
				typeId: "product-type",
				id: productType.id,
			},
			state: {
				typeId: "state",
				id: productState1.id,
			},
			version: 1,
		} as Product);
	});
});

describe("Product update actions", () => {
	const ctMock = new CommercetoolsMock();
	let productPublished: Product | undefined;
	beforeAll(async () => {
		await beforeAllProductTests(ctMock);
	});

	beforeEach(async () => {
		let response;
		response = await supertest(ctMock.app)
			.post("/dummy/products")
			.send(publishedProductDraft);

		expect(response.status).toBe(201);
		productPublished = response.body;

		response = await supertest(ctMock.app)
			.post("/dummy/products")
			.send(unpublishedProductDraft);

		expect(response.status).toBe(201);
	});

	test("setAttribute masterVariant (staged)", async () => {
		assert(productPublished, "product not created");

		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 1,
					actions: [
						{ action: "setAttribute", sku: "1337", name: "foo", value: "bar" },
					],
				});

			expect(response.status).toBe(200);
			const product: Product = response.body;
			expect(product.version).toBe(2);
			expect(product.masterData.hasStagedChanges).toBeTruthy();
			expect(product.masterData.current.masterVariant.attributes).toHaveLength(
				1,
			);
			expect(product.masterData.staged.masterVariant.attributes).toHaveLength(
				2,
			);

			const attr = response.body.masterData.staged.masterVariant.attributes[1];
			expect(attr).toEqual({ name: "foo", value: "bar" });
		}

		// Publish
		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 2,
					actions: [{ action: "publish", scope: "All" }],
				});

			expect(response.status).toBe(200);
			const product: Product = response.body;
			expect(product.version).toBe(3);
			expect(product.masterData.hasStagedChanges).toBeFalsy();
			expect(product.masterData.current.masterVariant.attributes).toHaveLength(
				2,
			);
		}
	});

	test("setAttribute masterVariant (published)", async () => {
		assert(productPublished, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAttribute",
						sku: "1337",
						name: "foo",
						value: "bar",
						staged: false,
					},
				],
			});

		expect(response.status).toBe(200);
		const product: Product = response.body;

		// TODO: Since we auto publish it actually does two version updates. So the
		// version should be 3
		expect(product.version).toBe(2);
		expect(product.masterData.hasStagedChanges).toBeFalsy();
		expect(product.masterData.current.masterVariant.attributes).toHaveLength(2);
		expect(product.masterData.staged.masterVariant.attributes).toHaveLength(2);

		const attr = response.body.masterData.staged.masterVariant.attributes[1];
		expect(attr).toEqual({ name: "foo", value: "bar" });
	});

	test("setAttribute variant", async () => {
		assert(productPublished, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setAttribute", sku: "1338", name: "foo", value: "bar" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.variants[0].attributes).toHaveLength(
			2,
		);
		const attr = response.body.masterData.staged.variants[0].attributes[1];
		expect(attr).toEqual({ name: "foo", value: "bar" });
	});

	test("setAttribute variant and publish", async () => {
		assert(productPublished, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setAttribute", sku: "1338", name: "foo", value: "bar" },
					{ action: "publish" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(
			response.body.masterData.current.variants[0].attributes,
		).toHaveLength(2);
		const attr = response.body.masterData.current.variants[0].attributes[1];
		expect(attr).toEqual({ name: "foo", value: "bar" });
	});

	test("setAttribute overwrite", async () => {
		assert(productPublished, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setAttribute", sku: "1337", name: "test", value: "foo" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(
			response.body.masterData.staged.masterVariant.attributes,
		).toHaveLength(1);
		const attr = response.body.masterData.staged.masterVariant.attributes[0];
		expect(attr).toEqual({ name: "test", value: "foo" });
	});

	test("setAttributeInAllVariants overwrite", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAttributeInAllVariants",
						name: "test",
						value: "foo",
					},
				],
			});
		expect(response.status).toBe(200);
		const product = response.body as Product;
		expect(product.version).toBe(2);
		expect(product.masterData.staged.masterVariant.attributes).toHaveLength(1);

		const masterVariantAttr1 =
			product.masterData.staged.masterVariant.attributes?.[0];
		expect(masterVariantAttr1).toEqual({ name: "test", value: "foo" });

		product.masterData.staged.variants.forEach((variant) => {
			expect(variant.attributes).toHaveLength(2);
			expect(variant.attributes?.[1]).toEqual({
				name: "test",
				value: "foo",
			});
		});
	});

	test("setAttributeInAllVariants product staged", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAttributeInAllVariants",
						name: "foo",
						value: "bar",
					},
				],
			});
		expect(response.status).toBe(200);
		const product = response.body as Product;
		expect(product.version).toBe(2);
		expect(product.masterData.staged.masterVariant.attributes).toHaveLength(2);
		const masterVariantAttr1 =
			product.masterData.staged.masterVariant.attributes?.[0];
		expect(masterVariantAttr1).toEqual({ name: "test", value: "test" });

		const masterVariantAttr2 =
			product.masterData.staged.masterVariant.attributes?.[1];
		expect(masterVariantAttr2).toEqual({
			name: "foo",
			value: "bar",
		});
		product.masterData.staged.variants.forEach((variant) => {
			expect(variant.attributes).toHaveLength(2);
			expect(variant.attributes?.[1]).toEqual({
				name: "foo",
				value: "bar",
			});
		});
	});

	test("setAttributeInAllVariants and publish", async () => {
		assert(productPublished, "product not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setAttributeInAllVariants", name: "foo", value: "bar" },
					{ action: "publish" },
				],
			});

		const product = response.body as Product;
		expect(response.status).toBe(200);
		expect(product.version).toBe(3);
		expect(product.masterData.current.masterVariant.attributes).toHaveLength(2);
		const attr = product.masterData.current.masterVariant.attributes?.[1];
		expect(attr).toEqual({ name: "foo", value: "bar" });

		product.masterData.current.variants.forEach((variant) => {
			expect(variant.attributes).toHaveLength(2);
			expect(variant.attributes?.[1]).toEqual({
				name: "foo",
				value: "bar",
			});
		});
	});

	test("addExternalImage variant", async () => {
		assert(productPublished, "product not created");

		const image: Image = {
			url: "http://example.com/image",
			dimensions: { w: 100, h: 100 },
		};
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [{ action: "addExternalImage", sku: "1338", image }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.variants[0].images).toHaveLength(1);
		const attr = response.body.masterData.staged.variants[0].images[0];
		expect(attr).toEqual(image);
	});

	test("removeImage variant", async () => {
		assert(productPublished, "product not created");

		const image: Image = {
			url: "http://example.com/image",
			dimensions: { w: 100, h: 100 },
		};

		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 1,
					actions: [{ action: "addExternalImage", sku: "1338", image }],
				});
			expect(response.status).toBe(200);
			expect(response.body.version).toBe(2);
		}

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 2,
				actions: [
					{
						action: "removeImage",
						sku: "1338",
						imageUrl: image.url,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.masterData.staged.variants[0].images).toHaveLength(0);
	});

	test("moveImageToPosition variant", async () => {
		assert(productPublished, "product not created");

		const image1: Image = {
			url: "http://example.com/image1",
			dimensions: { w: 100, h: 100 },
		};
		const image2: Image = {
			url: "http://example.com/image2",
			dimensions: { w: 100, h: 100 },
		};

		{
			const response = await supertest(ctMock.app)
				.post(`/dummy/products/${productPublished.id}`)
				.send({
					version: 1,
					actions: [
						{ action: "addExternalImage", sku: "1338", image: image1 },
						{ action: "addExternalImage", sku: "1338", image: image2 },
					],
				});
			expect(response.status).toBe(200);
			expect(response.body.version).toBe(3);
		}

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 3,
				actions: [
					{
						action: "moveImageToPosition",
						sku: "1338",
						imageUrl: image2.url,
						position: 0,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(4);
		expect(response.body.masterData.staged.variants[0].images).toEqual([
			{ url: "http://example.com/image2", dimensions: { w: 100, h: 100 } },
			{ url: "http://example.com/image1", dimensions: { w: 100, h: 100 } },
		]);
	});

	test("addPrice variant", async () => {
		assert(productPublished, "product not created");

		const priceDraft: PriceDraft = {
			country: "BE",
			value: {
				currencyCode: "EUR",
				centAmount: 3000,
			},
		};

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addPrice",
						price: priceDraft,
						variantId: 1,
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.masterVariant.prices).toMatchObject([
			{
				country: "NL",
				value: {
					currencyCode: "EUR",
					centAmount: 1000,
				},
			},
			{
				country: "BE",
				value: {
					currencyCode: "EUR",
					centAmount: 3000,
				},
			},
		]);
		expect(response.body.masterData.staged.masterVariant.prices[1].id).toBe(
			response.body.masterData.current.masterVariant.prices[1].id,
		);
	});

	test("changePrice variant", async () => {
		assert(productPublished, "product not created");
		const priceId =
			productPublished?.masterData.current.masterVariant.prices?.[0].id;
		assert(priceId);

		const priceDraft: PriceDraft = {
			country: "BE",
			value: {
				currencyCode: "EUR",
				centAmount: 3000,
			},
		};

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changePrice",
						priceId,
						price: priceDraft,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.masterVariant.prices).toMatchObject([
			{
				id: priceId,
				country: "BE",
				value: {
					currencyCode: "EUR",
					centAmount: 3000,
				},
			},
		]);
	});

	test("removePrice variant", async () => {
		assert(productPublished, "product not created");
		const priceId =
			productPublished?.masterData.current.masterVariant.prices?.[0].id;
		assert(priceId);

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removePrice",
						priceId,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.masterVariant.prices).toHaveLength(
			0,
		);
	});

	test("changeName product", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeName",
						name: "new test published product",
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.name).toBe(
			"new test published product",
		);
		expect(response.body.masterData.current.name).toBe(
			"new test published product",
		);
	});

	test("changeSlug product", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeSlug",
						slug: {
							"nl-NL": "test-published-product-new",
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.slug).toMatchObject({
			"nl-NL": "test-published-product-new",
		});
		expect(response.body.masterData.current.slug).toMatchObject({
			"nl-NL": "test-published-product-new",
		});
	});

	test("setMetaTitle product", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setMetaTitle",
						metaTitle: {
							"nl-NL": "Unpublished product (new meta title)",
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.metaTitle).toMatchObject({
			"nl-NL": "Unpublished product (new meta title)",
		});
		expect(response.body.masterData.current.metaTitle).toMatchObject({
			"nl-NL": "Unpublished product (new meta title)",
		});
	});

	test("setMetaDescription product", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setMetaDescription",
						metaDescription: {
							"nl-NL": "Unpublished product description (new meta description)",
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.metaDescription).toMatchObject({
			"nl-NL": "Unpublished product description (new meta description)",
		});
		expect(response.body.masterData.current.metaDescription).toMatchObject({
			"nl-NL": "Unpublished product description (new meta description)",
		});
	});

	test("setMetaKeywords product", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setMetaKeywords",
						metaKeywords: {
							"nl-NL": "Test product (newmeta Keywords)",
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.metaKeywords).toMatchObject({
			"nl-NL": "Test product (newmeta Keywords)",
		});
		expect(response.body.masterData.current.metaKeywords).toMatchObject({
			"nl-NL": "Test product (newmeta Keywords)",
		});
	});

	test("addVariant product", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addVariant",
						sku: "4567",
						key: "variant-2-key",
						price: [
							{
								key: "base_price_eur",
								country: "NL",
								value: {
									currencyCode: "EUR",
									centAmount: 3000,
								},
							},
						],
						images: [],
						attributes: [
							{
								name: "test3",
								value: "test3",
							},
						],
						assets: [],
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.variants).toHaveLength(2);
		expect(response.body.masterData.current.variants).toHaveLength(2);
		expect(response.body.masterData.staged.variants[1].id).toBe(3);
		expect(response.body.masterData.current.variants[1].id).toBe(3);
	});

	test("removeVariant by id", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeVariant",
						id: 2,
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.variants).toHaveLength(0);
		expect(response.body.masterData.current.variants).toHaveLength(0);
	});

	test("removeVariant by sku", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeVariant",
						sku: "1338",
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.variants).toHaveLength(0);
		expect(response.body.masterData.current.variants).toHaveLength(0);
	});

	test("removeVariant master", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeVariant",
						id: 1,
						staged: false,
					},
				],
			});
		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			`Can not remove the variant [ID:1] for [Product:${productPublished.id}] since it's the master variant`,
		);
	});

	test("changeMasterVariant", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeMasterVariant",
						sku: "1338",
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.masterData.staged.variants).toHaveLength(1);
		expect(response.body.masterData.staged.masterVariant.id).toBe(2);
		expect(response.body.masterData.staged.variants[0].id).toBe(1);

		expect(response.body.masterData.current.variants).toHaveLength(1);
		expect(response.body.masterData.current.masterVariant.id).toBe(2);
		expect(response.body.masterData.current.variants[0].id).toBe(1);
	});

	test("changeMasterVariant same master", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeMasterVariant",
						variantId: 1,
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(1);
		expect(response.body.masterData.staged.variants).toHaveLength(1);
		expect(response.body.masterData.staged.masterVariant.id).toBe(1);
		expect(response.body.masterData.staged.variants[0].id).toBe(2);

		expect(response.body.masterData.current.variants).toHaveLength(1);
		expect(response.body.masterData.current.masterVariant.id).toBe(1);
		expect(response.body.masterData.current.variants[0].id).toBe(2);
	});

	test("setTaxCategory", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setTaxCategory",
						taxCategory: {
							typeId: "tax-category",
							id: taxCategory2.id,
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.taxCategory.id).toBe(taxCategory2.id);
	});

	test("setTaxCategory fail 1", async () => {
		assert(productPublished, "product not created");
		const fakeTaxCategoryId = "00000000-0000-0000-0000-000000000000";
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setTaxCategory",
						taxCategory: {
							typeId: "tax-category",
							id: fakeTaxCategoryId,
						},
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.errors[0].code).toBe("ReferencedResourceNotFound");
	});

	test("setTaxCategory fail 2", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setTaxCategory",
						taxCategory: {
							typeId: "tax-category",
						},
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.errors[0].code).toBe("InvalidJsonInput");
	});

	test("addToCategory by id", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addToCategory",
						category: {
							typeId: "category",
							id: category2.id,
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.masterData.staged.categories).toHaveLength(2);
		expect(response.body.masterData.current.categories).toHaveLength(2);
	});

	test("addToCategory by key", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addToCategory",
						category: {
							typeId: "category",
							key: category2.key,
						},
						staged: true,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.masterData.staged.categories).toHaveLength(2);
		expect(response.body.masterData.current.categories).toHaveLength(1);
	});

	test("addToCategory fail 1", async () => {
		assert(productPublished, "product not created");
		const fakeCategoryId = "00000000-0000-0000-0000-000000000000";
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addToCategory",
						category: {
							typeId: "category",
							id: fakeCategoryId,
						},
						staged: true,
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.errors[0].code).toBe("ReferencedResourceNotFound");
	});

	test("addToCategory fail 2", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addToCategory",
						category: null,
						staged: true,
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.errors[0].code).toBe("InvalidJsonInput");
	});

	test("removeFromCategory", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeFromCategory",
						category: {
							typeId: "category",
							key: category1.key,
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.masterData.staged.categories).toHaveLength(0);
		expect(response.body.masterData.current.categories).toHaveLength(0);
	});

	test("removeFromCategory fail 1", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeFromCategory",
						category: {
							typeId: "category",
							id: "fake-category-id",
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.errors[0].code).toBe("ReferencedResourceNotFound");
	});

	test("removeFromCategory fail 2", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeFromCategory",
						category: {
							typeId: "category",
							id: category2.id,
						},
						staged: false,
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.errors[0].code).toBe("InvalidOperation");
	});

	test("transitionState", async () => {
		assert(productPublished, "product not created");
		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "transitionState",
						state: {
							typeId: "state",
							id: productState2.id,
						},
						force: false,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.state).toMatchObject({
			typeId: "state",
			id: productState2.id,
		});
	});

	test("setProductPriceCustomField", async () => {
		assert(productPublished, "product not created");
		const priceId =
			productPublished?.masterData.current.masterVariant.prices?.[0].id;
		assert(priceId);

		const response = await supertest(ctMock.app)
			.post(`/dummy/products/${productPublished.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setProductPriceCustomType",
						priceId,
						type: {
							typeId: "type",
							key: productPriceType.key,
						},
					},
					{
						action: "setProductPriceCustomField",
						name: "myCustomField",
						value: "MyRandomValue",
						priceId,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(
			response.body.masterData.staged.masterVariant.prices?.[0].custom.fields
				?.myCustomField,
		).toBe("MyRandomValue");
	});

	// Test the general product search implementation
	describe("Product Search - Generic", () => {
		test("Pagination", async () => {
			{
				const body: ProductSearchRequest = {
					limit: 24,
				};
				const response = await supertest(ctMock.app)
					.post("/dummy/products/search")
					.send(body);

				const pagedSearchResponse: ProductPagedSearchResponse = response.body;
				expect(pagedSearchResponse.limit).toBe(24);
				expect(pagedSearchResponse.offset).toBe(0);
				expect(pagedSearchResponse.total).toBeGreaterThan(0);

				// Deliberately not supported fow now
				expect(pagedSearchResponse.facets).toEqual([]);

				const results: ProductSearchResult[] = pagedSearchResponse.results;
				expect(results).toBeDefined();
				expect(results.length).toBeGreaterThan(0);

				// Find product with sku "1337" to be part of the search results
				const productFound = results.find(
					(result) => result?.productProjection?.masterVariant?.sku === "1337",
				);
				expect(productFound).toBeDefined();
			}
			{
				const body: ProductSearchRequest = {
					limit: 88,
					offset: 88,
				};

				const response = await supertest(ctMock.app)
					.post("/dummy/products/search")
					.send(body);

				const pagedSearchResponse: ProductPagedSearchResponse = response.body;
				expect(pagedSearchResponse.limit).toBe(88);
				expect(pagedSearchResponse.offset).toBe(88);
				expect(pagedSearchResponse.total).toBeGreaterThan(0);

				// No results, since we start at offset 2400
				const results: ProductSearchResult[] = pagedSearchResponse.results;
				expect(results).toBeDefined();
				expect(results.length).toBe(0);

				// Product with sku "1337" should not be part of the results
				const productFound = results.find(
					(result) => result?.productProjection?.masterVariant?.sku === "1337",
				);
				expect(productFound).toBeUndefined();
			}
		});
	});
});
