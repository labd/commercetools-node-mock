import type { Order } from "@commercetools/platform-sdk";
import assert from "assert";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

describe("Order Query", () => {
	const ctMock = new CommercetoolsMock();
	let order: Order | undefined;
	const projectKey = "dummy";
	const customerId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
	const businessUnitKey = "business-unit";

	beforeEach(async () => {
		let response = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/carts`,
			)
			.send({
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
		expect(response.status).toBe(201);
		const cart = response.body;

		response = await supertest(ctMock.app)
			.post(
				`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/orders`,
			)
			.send({
				cart: {
					typeId: "cart",
					id: cart.id,
				},
				orderNumber: "foobar",
			});
		expect(response.status).toBe(201);
		order = response.body;
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("no filter", async () => {
		assert(order, "order not created");

		const response = await supertest(ctMock.app).get(
			`/${projectKey}/as-associate/${customerId}/in-business-unit/key=${businessUnitKey}/orders`,
		);
		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);
		expect(response.body.total).toBe(1);
		expect(response.body.offset).toBe(0);
		expect(response.body.limit).toBe(20);
	});
});
