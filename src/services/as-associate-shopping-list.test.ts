import { describe, expect, test } from "vitest";
import { shoppingListDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";
const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
const businessUnitKey = "test-business-unit";

describe("AsAssociateShoppingList", () => {
	const factory = shoppingListDraftFactory(ctMock);

	test("Create shopping list", async () => {
		const shoppingList = await factory.create({
			name: { en: "My list" },
		});

		expect(shoppingList.id).toBeDefined();
	});

	test("Get shopping list", async () => {
		const shoppingList = await factory.create({
			name: { en: "Groceries" },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists/${shoppingList.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(shoppingList);
	});

	test("Query shopping lists", async () => {
		await factory.create({
			name: { en: "Errands" },
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
	});
});
