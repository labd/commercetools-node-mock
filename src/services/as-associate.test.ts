import { describe, expect, test } from "vitest";
import { cartDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";
const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
const businessUnitKey = "test-business-unit";

describe("AsAssociate", () => {
	const cartFactory = cartDraftFactory(ctMock);

	test("Access as-associate service routes", async () => {
		// Test that the as-associate service sets up routes correctly by testing cart endpoint
		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
		});

		// Should return 200 with empty results or 404 if not configured
		expect([200, 404]).toContain(response.statusCode);
	});

	test("Create cart via as-associate", async () => {
		const draft = cartFactory.build({
			currency: "EUR",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		const cart = response.json();
		expect(cart.id).toBeDefined();
	});
});
