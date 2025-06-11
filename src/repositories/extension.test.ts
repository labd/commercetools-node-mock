import type {
	Extension,
	ExtensionChangeDestinationAction,
	ExtensionChangeTriggersAction,
	ExtensionDraft,
	ExtensionSetKeyAction,
	ExtensionSetTimeoutInMsAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { InMemoryStorage } from "~src/storage";
import { ExtensionRepository } from "./extension";

describe("Extension Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ExtensionRepository(config);

	test("create extension with HTTP destination", () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			timeoutInMs: 2000,
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
				authentication: {
					type: "AuthorizationHeader",
					headerValue: "Bearer secret-token",
				},
			},
			triggers: [
				{
					resourceTypeId: "cart",
					actions: ["Create", "Update"],
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.timeoutInMs).toBe(draft.timeoutInMs);
		expect(result.destination.type).toBe("HTTP");
		expect(result.triggers).toEqual(draft.triggers);

		// Test that the extension is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
	});

	test("create extension with AWSLambda destination", () => {
		const draft: ExtensionDraft = {
			key: "aws-extension",
			destination: {
				type: "AWSLambda",
				arn: "arn:aws:lambda:us-east-1:123456789012:function:MyFunction",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
			},
			triggers: [
				{
					resourceTypeId: "order",
					actions: ["Create"],
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.destination.type).toBe("AWSLambda");
		expect(result.triggers).toEqual(draft.triggers);
	});

	test("postProcessResource masks HTTP authentication header", () => {
		const extension: Extension = {
			id: "test-id",
			version: 1,
			createdAt: "2023-01-01T00:00:00Z",
			lastModifiedAt: "2023-01-01T00:00:00Z",
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
				authentication: {
					type: "AuthorizationHeader",
					headerValue: "Bearer secret-token",
				},
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.postProcessResource(ctx, extension);

		expect(result.destination.type).toBe("HTTP");
		if (
			result.destination.type === "HTTP" &&
			result.destination.authentication?.type === "AuthorizationHeader"
		) {
			expect(result.destination.authentication.headerValue).toBe("****");
		}
	});

	test("postProcessResource masks AWSLambda access secret", () => {
		const extension: Extension = {
			id: "test-id",
			version: 1,
			createdAt: "2023-01-01T00:00:00Z",
			lastModifiedAt: "2023-01-01T00:00:00Z",
			key: "aws-extension",
			destination: {
				type: "AWSLambda",
				arn: "arn:aws:lambda:us-east-1:123456789012:function:MyFunction",
				accessKey: "AKIAIOSFODNN7EXAMPLE",
				accessSecret: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.postProcessResource(ctx, extension);

		expect(result.destination.type).toBe("AWSLambda");
		if (result.destination.type === "AWSLambda") {
			expect(result.destination.accessSecret).toBe("****");
		}
	});

	test("update extension - changeDestination", () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "cart",
					actions: ["Create"],
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const extension = repository.create(ctx, draft);

		const newDestination = {
			type: "HTTP" as const,
			url: "https://new-example.com/webhook",
		};

		const result = repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "changeDestination",
					destination: newDestination,
				} as ExtensionChangeDestinationAction,
			],
		);

		expect((result.destination as any).url).toBe(
			"https://new-example.com/webhook",
		);
		expect(result.version).toBe(extension.version + 1);
	});

	test("update extension - changeTriggers", () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [
				{
					resourceTypeId: "cart",
					actions: ["Create"],
				},
			],
		};

		const ctx = { projectKey: "dummy" };
		const extension = repository.create(ctx, draft);

		const newTriggers = [
			{
				resourceTypeId: "order" as const,
				actions: ["Create" as const, "Update" as const],
			},
		];

		const result = repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "changeTriggers",
					triggers: newTriggers,
				} as ExtensionChangeTriggersAction,
			],
		);

		expect(result.triggers).toEqual(newTriggers);
		expect(result.version).toBe(extension.version + 1);
	});

	test("update extension - setKey", () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const extension = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "setKey",
					key: "new-extension-key",
				} as ExtensionSetKeyAction,
			],
		);

		expect(result.key).toBe("new-extension-key");
		expect(result.version).toBe(extension.version + 1);
	});

	test("update extension - setTimeoutInMs", () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const extension = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "setTimeoutInMs",
					timeoutInMs: 5000,
				} as ExtensionSetTimeoutInMsAction,
			],
		);

		expect(result.timeoutInMs).toBe(5000);
		expect(result.version).toBe(extension.version + 1);
	});

	test("get and delete extension", () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const extension = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, extension.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(extension.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, extension.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(extension.key);

		// Test delete
		const deleted = repository.delete(ctx, extension.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(extension.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, extension.id);
		expect(notFound).toBeNull();
	});
});
