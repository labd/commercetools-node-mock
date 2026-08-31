import type { MyPaymentDraft } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import {
	customerDraftFactory,
	loginCustomer,
	typeDraftFactory,
} from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyPayment", () => {
	const typeFactory = typeDraftFactory(ctMock);

	let customerId: string;
	let headers: { authorization: string };

	beforeEach(async () => {
		const customer = await customerDraftFactory(ctMock).create({
			email: "my-payment@example.com",
			password: "secret",
		});
		customerId = customer.id;
		headers = (
			await loginCustomer(ctMock, {
				email: "my-payment@example.com",
				password: "secret",
			})
		).headers;

		await typeFactory.create({
			key: "custom-payment",
			name: {
				"nl-NL": "custom-payment",
			},
			resourceTypeIds: ["payment"],
		});
	});

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Create payment", async () => {
		const draft: MyPaymentDraft = {
			amountPlanned: { currencyCode: "EUR", centAmount: 1337 },
			custom: {
				type: { typeId: "type", key: "custom-payment" },
				fields: {
					foo: "bar",
				},
			},
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/payments",
			payload: draft,
			headers,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			id: expect.anything(),
			createdAt: expect.anything(),
			createdBy: expect.anything(),
			lastModifiedAt: expect.anything(),
			lastModifiedBy: expect.anything(),
			version: 1,
			customer: { typeId: "customer", id: customerId },
			amountPlanned: {
				type: "centPrecision",
				fractionDigits: 2,
				currencyCode: "EUR",
				centAmount: 1337,
			},
			paymentStatus: {},
			paymentMethodInfo: {},
			transactions: [],
			interfaceInteractions: [],
			custom: {
				type: { typeId: "type", id: expect.anything() },
				fields: { foo: "bar" },
			},
		});
	});
	test("Get payment", async () => {
		const draft: MyPaymentDraft = {
			amountPlanned: { currencyCode: "EUR", centAmount: 1337 },
			custom: {
				type: { typeId: "type", key: "custom-payment" },
				fields: {
					foo: "bar",
				},
			},
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/payments",
			payload: draft,
			headers,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/payments/${createResponse.json().id}`,
			headers,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Without a customer token", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/payments",
		});

		expect(response.statusCode).toBe(403);
		expect(response.json().errors[0].code).toBe("insufficient_scope");
	});
});
