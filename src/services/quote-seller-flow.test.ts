import type {
	Quote,
	QuoteRequest,
	StagedQuote,
} from "@commercetools/platform-sdk";
import { afterEach, describe, expect, it } from "vitest";
import {
	cartDraftFactory,
	customerDraftFactory,
	quoteRequestDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

describe("Answering a quote request", () => {
	const ctMock = new CommercetoolsMock();
	const customerFactory = customerDraftFactory(ctMock);
	const cartFactory = cartDraftFactory(ctMock);
	const quoteRequestFactory = quoteRequestDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	const inject = async <T>(
		method: "GET" | "POST",
		url: string,
		payload?: object,
	): Promise<{ statusCode: number; body: T }> => {
		const response = await ctMock.app.inject({ method, url, payload });
		return { statusCode: response.statusCode, body: response.json() as T };
	};

	const submitQuoteRequest = async (): Promise<QuoteRequest> => {
		const customer = await customerFactory.create();
		const cart = await cartFactory.create({
			currency: "EUR",
			customerId: customer.id,
		});

		const { body } = await inject<QuoteRequest>(
			"POST",
			"/dummy/quote-requests",
			quoteRequestFactory.build({
				cart: { typeId: "cart", id: cart.id },
				cartVersion: cart.version,
			}),
		);
		return body;
	};

	const stage = (quoteRequest: QuoteRequest) =>
		inject<StagedQuote>("POST", "/dummy/staged-quotes", {
			quoteRequest: { typeId: "quote-request", id: quoteRequest.id },
			quoteRequestVersion: quoteRequest.version,
			quoteRequestStateToAccepted: true,
		});

	const send = (staged: StagedQuote) =>
		inject<Quote>("POST", "/dummy/quotes", {
			stagedQuote: { typeId: "staged-quote", id: staged.id },
			stagedQuoteVersion: staged.version,
			stagedQuoteStateToSent: true,
		});

	const updateStaged = (staged: StagedQuote, actions: object[]) =>
		inject<StagedQuote>("POST", `/dummy/staged-quotes/${staged.id}`, {
			version: staged.version,
			actions,
		});

	const updateQuote = (quote: Quote, actions: object[]) =>
		inject<Quote>("POST", `/dummy/quotes/${quote.id}`, {
			version: quote.version,
			actions,
		});

	it("stages a quote and accepts the request", async () => {
		const quoteRequest = await submitQuoteRequest();

		const { statusCode, body: staged } = await stage(quoteRequest);

		expect(statusCode).toBe(201);
		expect(staged.stagedQuoteState).toBe("InProgress");
		expect(staged.customer).toEqual(quoteRequest.customer);

		const reread = await inject<QuoteRequest>(
			"GET",
			`/dummy/quote-requests/${quoteRequest.id}`,
		);
		expect(reread.body.quoteRequestState).toBe("Accepted");

		const stored = await inject<StagedQuote>(
			"GET",
			`/dummy/staged-quotes/${staged.id}`,
		);
		expect(stored.statusCode).toBe(200);
	});

	it("prices the offer in a cart of its own", async () => {
		const quoteRequest = await submitQuoteRequest();

		const { body: staged } = await stage(quoteRequest);

		expect(staged.quotationCart.id).not.toBe(quoteRequest.cart?.id);
	});

	it("refuses to stage a request that is no longer submitted", async () => {
		const quoteRequest = await submitQuoteRequest();
		const { body: staged } = await stage(quoteRequest);
		expect(staged.id).toBeDefined();

		const reread = await inject<QuoteRequest>(
			"GET",
			`/dummy/quote-requests/${quoteRequest.id}`,
		);
		const { statusCode } = await stage(reread.body);

		expect(statusCode).toBe(400);
	});

	it("refuses a stale quote request version", async () => {
		const quoteRequest = await submitQuoteRequest();

		const { statusCode } = await stage({
			...quoteRequest,
			version: quoteRequest.version + 1,
		});

		expect(statusCode).toBe(409);
	});

	it("sends a pending quote carrying the seller's terms", async () => {
		const quoteRequest = await submitQuoteRequest();
		const { body: staged } = await stage(quoteRequest);
		const { body: edited } = await updateStaged(staged, [
			{ action: "setValidTo", validTo: "2099-01-01T00:00:00.000Z" },
			{ action: "setSellerComment", sellerComment: "Volume price" },
		]);

		const { statusCode, body: quote } = await send(edited);

		expect(statusCode).toBe(201);
		expect(quote.quoteState).toBe("Pending");
		expect(quote.validTo).toBe("2099-01-01T00:00:00.000Z");
		expect(quote.sellerComment).toBe("Volume price");
		expect(quote.quoteRequest.id).toBe(quoteRequest.id);

		const stored = await inject<Quote>("GET", `/dummy/quotes/${quote.id}`);
		expect(stored.statusCode).toBe(200);

		const sent = await inject<StagedQuote>(
			"GET",
			`/dummy/staged-quotes/${staged.id}`,
		);
		expect(sent.body.stagedQuoteState).toBe("Sent");
	});

	it("refuses to send a staged quote that was already sent", async () => {
		const quoteRequest = await submitQuoteRequest();
		const { body: staged } = await stage(quoteRequest);
		await send(staged);

		const reread = await inject<StagedQuote>(
			"GET",
			`/dummy/staged-quotes/${staged.id}`,
		);
		const { statusCode } = await send(reread.body);

		expect(statusCode).toBe(400);
	});

	it("withdraws a quote", async () => {
		const { body: staged } = await stage(await submitQuoteRequest());
		const { body: quote } = await send(staged);

		const { body } = await updateQuote(quote, [
			{ action: "changeQuoteState", quoteState: "Withdrawn" },
		]);

		expect(body.quoteState).toBe("Withdrawn");
	});

	it("declines for renegotiation only through a renegotiation request", async () => {
		const { body: staged } = await stage(await submitQuoteRequest());
		const { body: quote } = await send(staged);

		const refused = await updateQuote(quote, [
			{ action: "changeQuoteState", quoteState: "DeclinedForRenegotiation" },
		]);
		expect(refused.statusCode).toBe(400);

		const { body } = await updateQuote(quote, [
			{ action: "requestQuoteRenegotiation", buyerComment: "Too expensive" },
		]);
		expect(body.quoteState).toBe("DeclinedForRenegotiation");
		expect(body.buyerComment).toBe("Too expensive");
	});

	it("answers a renegotiation with a new quote from the same staged quote", async () => {
		const { body: staged } = await stage(await submitQuoteRequest());
		const { body: first } = await send(staged);
		const { body: declined } = await updateQuote(first, [
			{ action: "requestQuoteRenegotiation", buyerComment: "Too expensive" },
		]);

		const sent = await inject<StagedQuote>(
			"GET",
			`/dummy/staged-quotes/${staged.id}`,
		);
		const { body: reopened } = await updateStaged(sent.body, [
			{ action: "changeStagedQuoteState", stagedQuoteState: "InProgress" },
		]);
		const { body: second } = await send(reopened);
		const { body: addressed } = await updateQuote(declined, [
			{ action: "changeQuoteState", quoteState: "RenegotiationAddressed" },
		]);

		expect(second.id).not.toBe(first.id);
		expect(second.quoteState).toBe("Pending");
		expect(addressed.quoteState).toBe("RenegotiationAddressed");
	});
});
