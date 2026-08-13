import { afterEach, describe, expect, it } from "vitest";
import {
	cartDraftFactory,
	customerDraftFactory,
	quoteRequestDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Quote Request Create", () => {
	const ctMock = new CommercetoolsMock();
	const customerFactory = customerDraftFactory(ctMock);
	const cartFactory = cartDraftFactory(ctMock);
	const quoteRequestFactory = quoteRequestDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	it("should create a quote request", async () => {
		const customer = await customerFactory.create();
		const cart = await cartFactory.create({
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

		const draft = quoteRequestFactory.build({
			cart: {
				typeId: "cart",
				id: cart.id,
			},
			cartVersion: cart.version,
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/quote-requests",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		const quote = response.json();
		expect(quote.cart).toEqual({
			typeId: "cart",
			id: cart.id,
		});
	});
});

describe("Quote Request Update", () => {
	const ctMock = new CommercetoolsMock();
	const customerFactory = customerDraftFactory(ctMock);
	const cartFactory = cartDraftFactory(ctMock);
	const quoteRequestFactory = quoteRequestDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	const createQuoteRequest = async () => {
		const customer = await customerFactory.create();
		const cart = await cartFactory.create({
			currency: "EUR",
			customerId: customer.id,
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/quote-requests",
			payload: quoteRequestFactory.build({
				cart: { typeId: "cart", id: cart.id },
				cartVersion: cart.version,
			}),
		});

		expect(response.statusCode).toBe(201);
		return response.json();
	};

	it("should change the quote request state", async () => {
		const quoteRequest = await createQuoteRequest();
		expect(quoteRequest.quoteRequestState).toBe("Submitted");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/quote-requests/${quoteRequest.id}`,
			payload: {
				version: quoteRequest.version,
				actions: [
					{ action: "changeQuoteRequestState", quoteRequestState: "Cancelled" },
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().quoteRequestState).toBe("Cancelled");
		expect(response.json().version).toBe(quoteRequest.version + 1);
	});
});
