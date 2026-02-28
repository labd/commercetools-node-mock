import type { PaymentDraft } from "@commercetools/platform-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Payment", () => {
	beforeEach(async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "custom-payment",
				name: {
					"nl-NL": "custom-payment",
				},
				resourceTypeIds: ["payment"],
			},
		});
		expect(response.statusCode).toBe(201);
	});

	test("Create payment", async () => {
		const draft: PaymentDraft = {
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
			url: "/dummy/payments",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			id: expect.anything(),
			createdAt: expect.anything(),
			lastModifiedAt: expect.anything(),
			version: 1,
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
		const draft: PaymentDraft = {
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
			url: "/dummy/payments",
			payload: draft,
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/payments/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});
});
