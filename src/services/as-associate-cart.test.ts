import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";
const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
const businessUnitKey = "test-business-unit";

describe("AsAssociateCart", () => {
	test("Create cart", async () => {
		const draft = {
			currency: "EUR",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().id).toBeDefined();
	});

	test("Get cart", async () => {
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			payload: { currency: "USD" },
		});

		expect(createResponse.statusCode).toBe(201);
		const createBody = createResponse.json();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts/${createBody.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createBody);
	});

	test("Query carts", async () => {
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			payload: { currency: "GBP" },
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
	});
});
