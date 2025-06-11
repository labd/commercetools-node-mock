import type { SubscriptionDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { SubscriptionRepository } from "./subscription";

describe("Subscription Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new SubscriptionRepository(config);

	test("create subscription with SQS destination", () => {
		const draft: SubscriptionDraft = {
			key: "test-subscription",
			destination: {
				type: "SQS",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				region: "us-east-1",
			},
			changes: [
				{
					resourceTypeId: "order",
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.destination.type).toBe("SQS");
		expect(result.changes).toEqual(draft.changes);
		expect(result.messages).toEqual([]);
		expect(result.format).toEqual({ type: "Platform" });
		expect(result.status).toBe("Healthy");
		expect(result.events).toEqual([]);

		// Test that the subscription is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create subscription with Google Cloud Pub/Sub destination", () => {
		const draft: SubscriptionDraft = {
			key: "pubsub-subscription",
			destination: {
				type: "GoogleCloudPubSub",
				projectId: "my-project",
				topic: "my-topic",
			},
			messages: [
				{
					resourceTypeId: "customer",
					types: ["CustomerCreated", "CustomerEmailVerified"],
				},
			],
			format: {
				type: "CloudEvents",
				cloudEventsVersion: "1.0",
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.destination.type).toBe("GoogleCloudPubSub");
		expect(result.messages).toEqual(draft.messages);
		expect(result.format).toEqual(draft.format);
		expect(result.status).toBe("Healthy");
	});

	test("create subscription with Azure Event Grid destination", () => {
		const draft: SubscriptionDraft = {
			key: "azure-subscription",
			destination: {
				type: "EventGrid",
				uri: "https://my-topic.westus2-1.eventgrid.azure.net/api/events",
				accessKey: "example-access-key",
			},
			events: [
				{
					resourceTypeId: "product",
					types: ["ProductCreated", "ProductPublished"],
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.destination.type).toBe("EventGrid");
		expect(result.events).toEqual(draft.events);
		expect(result.status).toBe("Healthy");
	});

	test("create subscription with Azure Service Bus destination", () => {
		const draft: SubscriptionDraft = {
			key: "servicebus-subscription",
			destination: {
				type: "AzureServiceBus",
				connectionString: "Endpoint=sb://example.servicebus.windows.net/;SharedAccessKeyName=example;SharedAccessKey=example",
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.destination.type).toBe("AzureServiceBus");
		expect(result.status).toBe("Healthy");
	});

	test("create subscription fails with invalid SQS account ID", () => {
		const draft: SubscriptionDraft = {
			key: "invalid-subscription",
			destination: {
				type: "SQS",
				queueUrl: "https://sqs.us-east-1.amazonaws.com/0000000000/my-queue",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
				region: "us-east-1",
			},
		};

		const ctx = { projectKey: "dummy" };

		expect(() => {
			repository.create(ctx, draft);
		}).toThrow("A test message could not be delivered to this destination");
	});

	test("update subscription - setKey", () => {
		const draft: SubscriptionDraft = {
			key: "test-subscription-update",
			destination: {
				type: "GoogleCloudPubSub",
				projectId: "my-project",
				topic: "my-topic",
			},
		};

		const ctx = { projectKey: "dummy" };
		const subscription = repository.create(ctx, draft);

		const result = repository.processUpdateActions(ctx, subscription, subscription.version, [
			{
				action: "setKey",
				key: "updated-subscription-key",
			},
		]);

		expect(result.key).toBe("updated-subscription-key");
		expect(result.version).toBe(subscription.version + 1);
	});

	test("get and delete subscription", () => {
		const draft: SubscriptionDraft = {
			key: "delete-test",
			destination: {
				type: "GoogleCloudPubSub",
				projectId: "my-project",
				topic: "my-topic",
			},
		};

		const ctx = { projectKey: "dummy" };
		const subscription = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, subscription.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(subscription.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, subscription.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(subscription.key);

		// Test delete
		const deleted = repository.delete(ctx, subscription.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(subscription.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, subscription.id);
		expect(notFound).toBeNull();
	});
});