import type { SubscriptionDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

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
		const response = await supertest(ctMock.app)
			.post("/dummy/subscriptions")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
			changes: [],
			createdAt: expect.anything(),
			destination: {
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789/orders",
				region: "us-east-1",
				type: "SQS",
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/subscriptions")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/subscriptions/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/subscriptions")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/subscriptions/key=key-subscription",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/subscriptions")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/subscriptions");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});