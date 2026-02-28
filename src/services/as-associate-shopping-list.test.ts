import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";
const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
const businessUnitKey = "test-business-unit";

describe("AsAssociateShoppingList", () => {
	test("Create shopping list", async () => {
		const draft = {
			name: { en: "My list" },
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().id).toBeDefined();
	});

	test("Get shopping list", async () => {
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
			payload: { name: { en: "Groceries" } },
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists/${createBody.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Query shopping lists", async () => {
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
			payload: { name: { en: "Errands" } },
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
	});
});
