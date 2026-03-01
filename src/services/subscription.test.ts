import { describe, expect, test } from "vitest";
import { subscriptionDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Subscription", () => {
	const subscriptionDraft = subscriptionDraftFactory(ctMock);

	test("Create subscription", async () => {
		const draft = subscriptionDraft.build({
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
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			changes: [],
			createdAt: expect.anything(),
			createdBy: expect.anything(),
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
			lastModifiedBy: expect.anything(),
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
		const subscription = await subscriptionDraft.create({
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
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/subscriptions/${subscription.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(subscription);
	});

	test("Get subscription by key", async () => {
		const subscription = await subscriptionDraft.create({
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
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/subscriptions/key=key-subscription",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(subscription);
	});

	test("Query subscriptions", async () => {
		const subscription = await subscriptionDraft.create({
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
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/subscriptions",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(subscription);
	});
});
