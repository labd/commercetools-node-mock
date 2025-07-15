import type {
	InventoryEntryDraft,
	ProductDraft,
	ProductPagedSearchResponse,
	ProductSearchRequest,
} from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "./index";

describe("Product Search - Availability Filtering", () => {
	const ctMock = new CommercetoolsMock();
	let productId: string;

	beforeEach(async () => {
		// Create a product type first
		const productTypeDraft = {
			name: "Test Product Type",
			key: "test-type",
			description: "Test Product Type",
		};

		await supertest(ctMock.app)
			.post("/dummy/product-types")
			.send(productTypeDraft);

		// Create a test product
		const productDraft: ProductDraft = {
			name: { "en-US": "Test Product" },
			productType: {
				typeId: "product-type",
				key: "test-type",
			},
			slug: { "en-US": "test-product" },
			masterVariant: {
				sku: "TEST-SKU-001",
			},
			variants: [
				{
					sku: "TEST-SKU-002",
				},
			],
		};

		const productResponse = await supertest(ctMock.app)
			.post("/dummy/products")
			.send(productDraft);

		productId = productResponse.body.id;

		// Publish the product
		await supertest(ctMock.app)
			.post(`/dummy/products/${productId}`)
			.send({
				version: productResponse.body.version,
				actions: [{ action: "publish" }],
			});
	});

	afterEach(() => {
		ctMock.clear();
	});

	async function createInventoryEntry(
		sku: string,
		quantityOnStock: number,
		channelId?: string,
	) {
		const inventoryEntry: InventoryEntryDraft = {
			sku,
			quantityOnStock,
			...(channelId && {
				supplyChannel: {
					typeId: "channel",
					id: channelId,
				},
			}),
		};

		await supertest(ctMock.app).post("/dummy/inventory").send(inventoryEntry);
	}

	async function searchProducts(
		query?: any,
	): Promise<ProductPagedSearchResponse> {
		const searchRequest: ProductSearchRequest = {
			...(query && { query }),
			productProjectionParameters: {
				staged: false,
			},
		};

		const response = await supertest(ctMock.app)
			.post("/dummy/products/search")
			.send(searchRequest);

		return response.body;
	}

	test("should filter products by variants.availability.isOnStock = true", async () => {
		// Create inventory with stock for one variant
		await createInventoryEntry("TEST-SKU-001", 10);

		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStock",
				value: true,
			},
		});

		expect(result.results).toHaveLength(1);
		expect(
			result.results[0].productProjection?.masterVariant?.availability
				?.isOnStock,
		).toBe(true);
	});

	test("should filter products by variants.availability.isOnStock = false", async () => {
		// Create inventory with zero stock
		await createInventoryEntry("TEST-SKU-001", 0);

		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStock",
				value: false,
			},
		});

		// Should find the product because it's not on stock
		expect(result.results).toHaveLength(1);
		expect(
			result.results[0].productProjection?.masterVariant?.availability
				?.isOnStock,
		).toBe(false);
	});

	test("should filter products by variants.availability.isOnStockForChannel", async () => {
		const channelId = "test-channel-1";

		// Create inventory for specific channel
		await createInventoryEntry("TEST-SKU-001", 5, channelId);

		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStockForChannel",
				value: channelId,
			},
		});

		expect(result.results).toHaveLength(1);
		expect(
			(result.results[0].productProjection?.masterVariant?.availability as any)
				?.isOnStockForChannel,
		).toBe(channelId);
	});

	test("should not find products when filtering by non-matching channel", async () => {
		const channelId = "test-channel-1";
		const otherChannelId = "test-channel-2";

		// Create inventory for specific channel
		await createInventoryEntry("TEST-SKU-001", 5, channelId);

		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStockForChannel",
				value: otherChannelId,
			},
		});

		expect(result.results).toHaveLength(0);
	});

	test("should handle products without inventory entries", async () => {
		// Don't create any inventory entries

		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStock",
				value: false,
			},
		});

		// Should find the product because it has no stock
		expect(result.results).toHaveLength(1);
		expect(
			result.results[0].productProjection?.masterVariant?.availability
				?.isOnStock,
		).toBe(false);
	});

	test("should work with OR queries for availability", async () => {
		// Create inventory with stock
		await createInventoryEntry("TEST-SKU-001", 10);

		const result = await searchProducts({
			or: [
				{
					exact: {
						field: "variants.availability.isOnStock",
						value: true,
					},
				},
				{
					exact: {
						field: "variants.availability.isOnStock",
						value: false,
					},
				},
			],
		});

		// Should find the product regardless of stock status
		expect(result.results).toHaveLength(1);
	});

	test("should work with AND queries combining availability and other fields", async () => {
		await createInventoryEntry("TEST-SKU-001", 10);

		const result = await searchProducts({
			and: [
				{
					exact: {
						field: "variants.availability.isOnStock",
						value: true,
					},
				},
				{
					exact: {
						field: "variants.sku",
						value: "TEST-SKU-001",
					},
				},
			],
		});

		expect(result.results).toHaveLength(1);
		expect(result.results[0].productProjection?.masterVariant?.sku).toBe(
			"TEST-SKU-001",
		);
	});
});
