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
	test("Update subscription", async () => {
		const created = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: {
				key: "updatable",
				destination: {
					type: "GoogleCloudPubSub",
					projectId: "my-project",
					topic: "my-topic",
				},
				messages: [{ resourceTypeId: "order", types: ["OrderCreated"] }],
			},
		});
		expect(created.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/subscriptions/${created.json().id}`,
			payload: {
				version: created.json().version,
				actions: [
					{
						action: "changeDestination",
						destination: {
							type: "GoogleCloudPubSub",
							projectId: "other-project",
							topic: "other-topic",
						},
					},
					{ action: "setMessages", messages: [] },
					{ action: "setChanges", changes: [{ resourceTypeId: "product" }] },
					{
						action: "setEvents",
						events: [
							{
								resourceTypeId: "import-api",
								types: ["ImportContainerCreated"],
							},
						],
					},
					{ action: "setKey", key: "updated" },
				],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().destination.topic).toBe("other-topic");
		expect(response.json().messages).toEqual([]);
		expect(response.json().changes).toEqual([{ resourceTypeId: "product" }]);
		expect(response.json().events).toEqual([
			{ resourceTypeId: "import-api", types: ["ImportContainerCreated"] },
		]);
		expect(response.json().key).toBe("updated");
	});
});

describe("Subscription draft validation", () => {
	const ctMock = new CommercetoolsMock({ strict: true });

	test("Create subscription with an incomplete destination", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: {
				key: "incomplete",
				destination: {
					type: "SQS",
					queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/orders",
				},
				messages: [{ resourceTypeId: "order", types: ["OrderCreated"] }],
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().errors[0].code).toBe("InvalidJsonInput");
		expect(response.json().errors[0].detailedErrorMessage).toContain("region");
	});

	test("Create subscription with an unknown destination type", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/subscriptions",
			payload: {
				key: "unknown-destination",
				destination: { type: "Carrier pigeon" },
			},
		});

		expect(response.statusCode).toBe(400);
	});
});
