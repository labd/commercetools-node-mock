import type {
	ProductPagedSearchResponse,
	ProductSearchRequest,
} from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { channelDraftFactory } from "#src/testing/channel.ts";
import { inventoryEntryDraftFactory } from "#src/testing/inventory-entry.ts";
import { productDraftFactory } from "#src/testing/product.ts";
import { productTypeDraftFactory } from "#src/testing/product-type.ts";
import { CommercetoolsMock } from "./index.ts";

describe("Product Search - Availability Filtering", () => {
	const ctMock = new CommercetoolsMock();
	let productId: string;

	beforeEach(async () => {
		const productType = await productTypeDraftFactory(ctMock).create();

		const product = await productDraftFactory(ctMock).create({
			productType: {
				typeId: "product-type",
				id: productType.id,
			},
			masterVariant: {
				sku: "TEST-SKU-001",
			},
			variants: [
				{
					sku: "TEST-SKU-002",
				},
			],
		});

		productId = product.id;

		// Publish the product
		await ctMock.app.inject({
			method: "POST",
			url: `/dummy/products/${productId}`,
			payload: {
				version: product.version,
				actions: [{ action: "publish" }],
			},
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
		await inventoryEntryDraftFactory(ctMock).create({
			sku,
			quantityOnStock,
			...(channelId && {
				supplyChannel: {
					typeId: "channel",
					id: channelId,
				},
			}),
		});
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/products/search",
			payload: searchRequest,
		});

		return response.json();
	}

	test("should filter products by variants.availability.isOnStock = true", async () => {
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
		await createInventoryEntry("TEST-SKU-001", 0);

		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStock",
				value: false,
			},
		});

		expect(result.results).toHaveLength(1);
		expect(
			result.results[0].productProjection?.masterVariant?.availability
				?.isOnStock,
		).toBe(false);
	});

	test("should filter products by variants.availability.isOnStockForChannel", async () => {
		const channel = await channelDraftFactory(ctMock).create();
		const channelId = channel.id;

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
		const channel = await channelDraftFactory(ctMock).create();
		const channelId = channel.id;
		const otherChannelId = "non-existent-channel-id";

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
		const result = await searchProducts({
			exact: {
				field: "variants.availability.isOnStock",
				value: false,
			},
		});

		expect(result.results).toHaveLength(1);
		expect(
			result.results[0].productProjection?.masterVariant?.availability
				?.isOnStock,
		).toBe(false);
	});

	test("should work with OR queries for availability", async () => {
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
