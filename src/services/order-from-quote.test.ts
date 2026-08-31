import type { LineItem, Quote } from "@commercetools/platform-sdk";
import { afterEach, describe, expect, test } from "vitest";
import { customerSession } from "#src/testing/index.ts";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";

const ctMock = new CommercetoolsMock({ defaultProjectKey: "dummy" });
const customerId = "8d4d2b1a-6d90-4f0f-9e34-3c1a01e6b3f1";

const lineItem = {
	id: "0a2a1c4e-1e33-4c19-9c6c-27a9c3f0a9d1",
	productId: "3d1f0f7a-6f1c-4f10-9a3c-9a9d0f1b2c33",
	name: { en: "Test product" },
	productType: {
		typeId: "product-type",
		id: "2b3c4d5e-6f70-4819-9a2b-3c4d5e6f7081",
	},
	variant: { id: 1, sku: "1337" },
	price: {
		id: "5f6e7d8c-9b0a-4c1d-8e2f-3a4b5c6d7e8f",
		value: {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 14900,
			fractionDigits: 2,
		},
	},
	quantity: 2,
	totalPrice: {
		type: "centPrecision",
		currencyCode: "EUR",
		centAmount: 29800,
		fractionDigits: 2,
	},
	discountedPricePerQuantity: [],
	taxedPricePortions: [],
	perMethodTaxRate: [],
	state: [],
	priceMode: "Platform",
	lineItemMode: "Standard",
} as unknown as LineItem;

const createQuote = async (overrides: Partial<Quote> = {}) => {
	const quote: Quote = {
		...getBaseResourceProperties(),
		key: "quote-1",
		quoteState: "Pending",
		customer: { typeId: "customer", id: customerId },
		quoteRequest: {
			typeId: "quote-request",
			id: "0f0f0a3b-6a2f-4a4c-9a05-6a6b0a5f7d3e",
		},
		stagedQuote: {
			typeId: "staged-quote",
			id: "1ac6f1a0-6f4b-4a8e-9f9e-2ac4f6a1b7c2",
		},
		lineItems: [lineItem],
		customLineItems: [],
		taxMode: "Platform",
		priceRoundingMode: "HalfEven",
		taxRoundingMode: "HalfEven",
		taxCalculationMode: "LineItemLevel",
		totalPrice: {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 29800,
			fractionDigits: 2,
		},
		...overrides,
	};

	await ctMock.project().unsafeAdd("quote", quote);
	return quote;
};

describe("Order from Quote", () => {
	afterEach(() => {
		ctMock.clear();
	});

	test("create order from quote", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: quote.id },
				version: quote.version,
			},
		});

		expect(response.statusCode).toBe(201);

		const order = response.json();
		expect(order.quote).toEqual({ typeId: "quote", id: quote.id });
		expect(order.origin).toBe("Quote");
		expect(order.orderState).toBe("Open");
		expect(order.customerId).toBe(customerId);
		expect(order.lineItems).toHaveLength(1);
		expect(order.totalPrice.centAmount).toBe(29800);
	});

	test("quoteStateToAccepted transitions the quote", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: quote.id },
				version: quote.version,
				quoteStateToAccepted: true,
			},
		});
		expect(response.statusCode).toBe(201);

		const updated = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/quotes/${quote.id}`,
		});
		expect(updated.json().quoteState).toBe("Accepted");
		expect(updated.json().version).toBe(quote.version + 1);
	});

	test("the quote is left alone without quoteStateToAccepted", async () => {
		const quote = await createQuote();

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: quote.id },
				version: quote.version,
			},
		});

		const updated = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/quotes/${quote.id}`,
		});
		expect(updated.json().quoteState).toBe("Pending");
	});

	test("a quote that is not pending cannot be ordered", async () => {
		const quote = await createQuote({ quoteState: "Declined" });

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: quote.id },
				version: quote.version,
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().errors[0].code).toBe("InvalidOperation");
	});

	test("an expired quote cannot be ordered", async () => {
		const quote = await createQuote({ validTo: "2020-01-01T00:00:00.000Z" });

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: quote.id },
				version: quote.version,
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().errors[0].code).toBe("InvalidOperation");
	});

	test("a stale version is rejected", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: quote.id },
				version: quote.version + 1,
			},
		});

		expect(response.statusCode).toBe(409);
		expect(response.json().errors[0].code).toBe("ConcurrentModification");
	});

	test("an unknown quote is rejected", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: {
				quote: { typeId: "quote", id: "2c4bb2c1-0f4f-4c1e-9d2f-9a1d3e4b5c6a" },
				version: 1,
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().errors[0].code).toBe("ReferencedResourceNotFound");
	});

	test("create order from quote via /me", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/orders/quotes",
			payload: {
				id: quote.id,
				version: quote.version,
				quoteStateToAccepted: true,
			},
			headers: customerSession(ctMock, customerId).headers,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json().quote).toEqual({ typeId: "quote", id: quote.id });

		const updated = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/quotes/${quote.id}`,
		});
		expect(updated.json().quoteState).toBe("Accepted");
	});
});

describe("Order from Quote draft validation", () => {
	const strictMock = new CommercetoolsMock({
		defaultProjectKey: "dummy",
		strict: true,
	});

	test("a draft without a quote reference is rejected", async () => {
		const response = await strictMock.app.inject({
			method: "POST",
			url: "/dummy/orders/quotes",
			payload: { version: 1 },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().errors[0].code).toBe("InvalidJsonInput");
	});

	test("a /me draft without a version is rejected", async () => {
		const response = await strictMock.app.inject({
			method: "POST",
			url: "/dummy/me/orders/quotes",
			payload: { id: "2c4bb2c1-0f4f-4c1e-9d2f-9a1d3e4b5c6a" },
			headers: customerSession(strictMock, customerId).headers,
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().errors[0].detailedErrorMessage).toContain("version");
	});
});
