import assert from "node:assert";
import type { Order } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

describe("Order Query", () => {
	const ctMock = new CommercetoolsMock();
	let order: Order | undefined;
	const projectKey = "dummy";
	const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
	const businessUnitKey = "business-unit";

	beforeEach(async () => {
		const cartResponse = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			payload: {
				currency: "EUR",
				custom: {
					type: {
						key: "my-cart",
					},
					fields: {
						description: "example description",
					},
				},
			},
		});
		expect(cartResponse.statusCode).toBe(201);
		const cart = cartResponse.json();

		const orderResponse = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/orders`,
			payload: {
				cart: {
					typeId: "cart",
					id: cart.id,
				},
				orderNumber: "foobar",
			},
		});
		expect(orderResponse.statusCode).toBe(201);
		order = orderResponse.json();
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no filter", async () => {
		assert(order, "order not created");

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/orders`,
		});
		expect(response.statusCode).toBe(200);
		const body = response.json();
		expect(body.count).toBe(1);
		expect(body.total).toBe(1);
		expect(body.offset).toBe(0);
		expect(body.limit).toBe(20);
	});
});
