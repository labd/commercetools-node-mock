import supertest from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { customerDraftFactory } from "~src/testing/customer";
import { CommercetoolsMock } from "../index";

describe("Quote Request Create", () => {
	const ctMock = new CommercetoolsMock();

	afterEach(() => {
		ctMock.clear();
	});

	it("should create a quote request", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		let response = await supertest(ctMock.app)
			.post("/dummy/carts")
			.send({
				currency: "EUR",
				customerId: customer.id,
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
			.post("/dummy/quote-requests")
			.send({
				cart: {
					typeId: "cart",
					id: cart.id,
				},
				cartVersion: cart.version,
			});
		expect(response.status).toBe(201);
		const quote = response.body;

		expect(quote.cart).toEqual({
			typeId: "cart",
			id: cart.id,
		});

		response = await supertest(ctMock.app)
			.get(`/dummy/quote-requests/${quote.id}`)
			.send();

		const quoteResult = response.body;
		expect(quoteResult.cart).toEqual({
			typeId: "cart",
			id: cart.id,
		});
	});
});
