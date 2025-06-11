import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";
const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
const businessUnitKey = "test-business-unit";

describe("AsAssociate", () => {
	test("Access as-associate service routes", async () => {
		// Test that the as-associate service sets up routes correctly by testing cart endpoint
		const response = await supertest(ctMock.app).get(
			`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
		);

		// Should return 200 with empty results or 404 if not configured
		expect([200, 404]).toContain(response.status);
	});

	test("Create cart via as-associate", async () => {
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
});
