import supertest from "supertest";
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
		const response = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			)
			.send(draft);

		expect(response.status).toBe(201);
		expect(response.body.id).toBeDefined();
	});

	test("Get cart", async () => {
		const createResponse = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			)
			.send({ currency: "USD" });

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query carts", async () => {
		const createResponse = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			)
			.send({ currency: "GBP" });

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
		);

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
	});
});
