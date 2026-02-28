import { afterEach, describe, expect, it } from "vitest";
import { customerDraftFactory } from "#src/testing/customer.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Quote Request Create", () => {
	const ctMock = new CommercetoolsMock();

	afterEach(() => {
		ctMock.clear();
	});

	it("should create a quote request", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		let response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/carts",
			payload: {
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
			},
		});
		expect(response.statusCode).toBe(201);
		const cart = response.json();

		response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/quote-requests",
			payload: {
				cart: {
					typeId: "cart",
					id: cart.id,
				},
				cartVersion: cart.version,
			},
		});
		expect(response.statusCode).toBe(201);
		const quote = response.json();

		expect(quote.cart).toEqual({
			typeId: "cart",
			id: cart.id,
		});

		response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/quote-requests/${quote.id}`,
		});

		const quoteResult = response.json();
		expect(quoteResult.cart).toEqual({
			typeId: "cart",
			id: cart.id,
		});
	});
});
