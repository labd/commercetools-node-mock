import type { Quote } from "@commercetools/platform-sdk";
import { afterEach, describe, expect, test } from "vitest";
import { typeDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";

const ctMock = new CommercetoolsMock({ defaultProjectKey: "dummy" });
const projectKey = "dummy";
const associateId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";
const businessUnitKey = "test-business-unit";
const basePath = `/${projectKey}/as-associate/${associateId}/in-business-unit/key=${businessUnitKey}/quotes`;

const createQuote = async () => {
	const quote: Quote = {
		...getBaseResourceProperties(),
		key: "quote-1",
		quoteState: "Pending",
		customer: {
			typeId: "customer",
			id: "8d4d2b1a-6d90-4f0f-9e34-3c1a01e6b3f1",
		},
		quoteRequest: {
			typeId: "quote-request",
			id: "0f0f0a3b-6a2f-4a4c-9a05-6a6b0a5f7d3e",
		},
		stagedQuote: {
			typeId: "staged-quote",
			id: "1ac6f1a0-6f4b-4a8e-9f9e-2ac4f6a1b7c2",
		},
		lineItems: [],
		customLineItems: [],
		taxMode: "Platform",
		priceRoundingMode: "HalfEven",
		taxRoundingMode: "HalfEven",
		taxCalculationMode: "LineItemLevel",
		totalPrice: {
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 1000,
			fractionDigits: 2,
		},
	};

	await ctMock.project().unsafeAdd("quote", quote);
	return quote;
};

describe("AsAssociate quotes", () => {
	afterEach(() => {
		ctMock.clear();
	});

	test("query quotes", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "GET",
			url: basePath,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toHaveLength(1);
		expect(response.json().results[0].id).toBe(quote.id);
	});

	test("get quote by id", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${basePath}/${quote.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(quote.id);
	});

	test("get quote by key", async () => {
		const quote = await createQuote();

		const response = await ctMock.app.inject({
			method: "GET",
			url: `${basePath}/key=${quote.key}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBe(quote.id);
	});

	test("get unknown quote", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: `${basePath}/2c4bb2c1-0f4f-4c1e-9d2f-9a1d3e4b5c6a`,
		});

		expect(response.statusCode).toBe(404);
	});

	test("update quote by id", async () => {
		const quote = await createQuote();
		const type = await typeDraftFactory(ctMock).create({
			key: "quote-type",
			name: { en: "quote-type" },
			resourceTypeIds: ["quote"],
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `${basePath}/${quote.id}`,
			payload: {
				version: quote.version,
				actions: [
					{
						action: "setCustomType",
						type: { typeId: "type", id: type.id },
						fields: { foo: "bar" },
					},
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(quote.version + 1);
		expect(response.json().custom.fields).toEqual({ foo: "bar" });
	});
});
