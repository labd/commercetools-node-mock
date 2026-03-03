import assert from "node:assert";
import type { InventoryEntry, Type } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	inventoryEntryDraftFactory,
	typeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Inventory Entry Query", () => {
	const ctMock = new CommercetoolsMock();
	const inventoryEntryDraft = inventoryEntryDraftFactory(ctMock);
	let inventoryEntry: InventoryEntry | undefined;

	beforeEach(async () => {
		inventoryEntry = await inventoryEntryDraft.create({
			sku: "1337",
			quantityOnStock: 100,
		});
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("no filter", async () => {
		assert(inventoryEntry, "inventory entry not created");

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/inventory",
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBe(1);
		expect(response.json().total).toBe(1);
		expect(response.json().offset).toBe(0);
		expect(response.json().limit).toBe(20);
	});

	test("filter sku", async () => {
		assert(inventoryEntry, "inventory entry not created");

		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/inventory",
				query: { where: 'sku="unknown"' },
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().count).toBe(0);
		}
		{
			const response = await ctMock.app.inject({
				method: "GET",
				url: "/dummy/inventory",
				query: { where: 'sku="1337"' },
			});
			expect(response.statusCode).toBe(200);
			expect(response.json().count).toBe(1);
		}
	});
});

describe("Inventory Entry Update Actions", () => {
	const ctMock = new CommercetoolsMock();
	const inventoryEntryDraft = inventoryEntryDraftFactory(ctMock);
	const typeDraft = typeDraftFactory(ctMock);
	let inventoryEntry: InventoryEntry | undefined;
	let customType: Type | undefined;

	beforeEach(async () => {
		inventoryEntry = await inventoryEntryDraft.create({
			sku: "1337",
			quantityOnStock: 100,
		});

		customType = await typeDraft.create({
			key: "custom-inventory",
			name: {
				"nl-NL": "custom-inventory",
			},
			resourceTypeIds: ["inventory-entry"],
		});
	});

	test("changeQuantity", async () => {
		assert(inventoryEntry, "inventory entry not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 1,
				actions: [{ action: "changeQuantity", quantity: 300 }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().availableQuantity).toBe(300);
		expect(response.json().quantityOnStock).toBe(300);
	});

	test("removeQuantity", async () => {
		assert(inventoryEntry, "inventory entry not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 1,
				actions: [{ action: "removeQuantity", quantity: 15 }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().availableQuantity).toBe(85);
		expect(response.json().quantityOnStock).toBe(85);
	});

	test("set custom type", async () => {
		assert(inventoryEntry, "inventory entry not created");
		assert(customType, "custom type not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setCustomType",
						type: { typeId: "type", id: customType.id },
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().custom.type.id).toBe(customType.id);
	});

	test("set expected delivery", async () => {
		assert(inventoryEntry, "inventory entry not created");
		const expectedDelivery = "2021-04-02T15:06:19.700Z";
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setExpectedDelivery", expectedDelivery }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().expectedDelivery).toBe(expectedDelivery);
	});

	test("set custom field", async () => {
		assert(inventoryEntry, "inventory entry not created");
		assert(customType, "custom type not created");

		const setCustomTypeResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setCustomType",
						type: { typeId: "type", id: customType.id },
						fields: { lol: "bar" },
					},
				],
			},
		});
		expect(setCustomTypeResponse.statusCode).toBe(200);
		expect(setCustomTypeResponse.json().custom.type.id).toBe(customType.id);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 2,
				actions: [{ action: "setCustomField", name: "foo", value: "bar" }],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().custom.fields.foo).toBe("bar");
	});

	test("set restockable in days", async () => {
		assert(inventoryEntry, "inventory entry not created");
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/inventory/${inventoryEntry.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setRestockableInDays", restockableInDays: 0 }],
			},
		});
		expect(response.statusCode).toEqual(200);
		expect(response.json().version).toEqual(2);
		expect(response.json().restockableInDays).toEqual(0);
	});
});
