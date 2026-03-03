import assert from "node:assert";
import type { Order } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { cartDraftFactory, orderDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Order Query", () => {
	const ctMock = new CommercetoolsMock();
	const cartFactory = cartDraftFactory(ctMock);
	const orderFactory = orderDraftFactory(ctMock);
	let order: Order | undefined;
	const projectKey = "dummy";
	const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
	const businessUnitKey = "business-unit";

	beforeEach(async () => {
		const cart = await cartFactory.create({
			currency: "EUR",
			custom: {
				type: {
					key: "my-cart",
				},
				fields: {
					description: "example description",
				},
			},
		});

		order = await orderFactory.create({
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			version: cart.version,
			orderNumber: "foobar",
		});
	});

	afterEach(async () => {
		await ctMock.clear();
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
