import supertest from "supertest";
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
		const response = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
			)
			.send(draft);

		expect(response.status).toBe(201);
		expect(response.body.id).toBeDefined();
	});

	test("Get shopping list", async () => {
		const createResponse = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
			)
			.send({ name: { en: "Groceries" } });

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query shopping lists", async () => {
		const createResponse = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
			)
			.send({ name: { en: "Errands" } });

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/shopping-lists`,
		);

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
	});
});
