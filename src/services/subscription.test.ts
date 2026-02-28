import type { SubscriptionDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Subscription", () => {
	test("Create subscription", async () => {
		const draft: SubscriptionDraft = {
			key: "order-notifications",
			destination: {
				type: "SQS",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/orders",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				region: "us-east-1",
			},
			messages: [
				{
					resourceTypeId: "order",
					types: ["OrderCreated", "OrderStateChanged"],
				},
			],
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			changes: [],
			createdAt: expect.anything(),
			destination: {
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/orders",
				region: "us-east-1",
				type: "SQS",
			},
			events: [],
			format: {
				type: "Platform",
			},
			id: expect.anything(),
			key: "order-notifications",
			lastModifiedAt: expect.anything(),
			messages: [
				{
					resourceTypeId: "order",
					types: ["OrderCreated", "OrderStateChanged"],
				},
			],
			status: "Healthy",
			version: 1,
		});
	});

	test("Get subscription", async () => {
		const draft: SubscriptionDraft = {
			key: "test-subscription",
			destination: {
				type: "SQS",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/test",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				region: "us-east-1",
			},
			messages: [
				{
					resourceTypeId: "customer",
					types: ["CustomerCreated"],
				},
			],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/subscriptions/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get subscription by key", async () => {
		const draft: SubscriptionDraft = {
			key: "key-subscription",
			destination: {
				type: "SQS",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/key",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				region: "us-east-1",
			},
			messages: [
				{
					resourceTypeId: "product",
					types: ["ProductPublished"],
				},
			],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/subscriptions/key=key-subscription",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query subscriptions", async () => {
		const draft: SubscriptionDraft = {
			key: "query-subscription",
			destination: {
				type: "SQS",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/query",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				region: "us-east-1",
			},
			messages: [
				{
					resourceTypeId: "cart",
					types: ["CartCreated"],
				},
			],
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/subscriptions",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});
});
