import type {
	Extension,
	ExtensionChangeDestinationAction,
	ExtensionChangeTriggersAction,
	ExtensionDraft,
	ExtensionSetAdditionalContextAction,
	ExtensionSetDependenciesAction,
	ExtensionSetExpansionPathsAction,
	ExtensionSetKeyAction,
	ExtensionSetTimeoutInMsAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { ExtensionRepository } from "./extension.ts";

describe("Extension Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ExtensionRepository(config);

	test("create extension with HTTP destination", async () => {
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
		const result = await repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.timeoutInMs).toBe(draft.timeoutInMs);
		expect(result.destination.type).toBe("HTTP");
		expect(result.triggers).toEqual(draft.triggers);

		// Test that the extension is stored
		const items = await repository.query(ctx);
		expect(items.count).toBe(1);
	});

	test("create extension with AWSLambda destination", async () => {
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
		const result = await repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.key).toBe(draft.key);
		expect(result.destination.type).toBe("AWSLambda");
		expect(result.triggers).toEqual(draft.triggers);
	});

	test("create extension with expansion paths", async () => {
		const draft: ExtensionDraft = {
			key: "expansion-extension",
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
			expansionPaths: ["lineItems[*].variant", "shippingInfo.shippingMethod"],
		};

		const ctx = { projectKey: "dummy" };
		const result = await repository.create(ctx, draft);

		expect(result.expansionPaths).toEqual([
			"lineItems[*].variant",
			"shippingInfo.shippingMethod",
		]);
	});

	test("create extension without expansion paths", async () => {
		const draft: ExtensionDraft = {
			key: "no-expansion-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const result = await repository.create(ctx, draft);

		expect(result.expansionPaths).toBeUndefined();
		expect(result.dependencies).toBeUndefined();
		expect(result.additionalContext).toBeUndefined();
	});

	test("create extension with additional context", async () => {
		const draft: ExtensionDraft = {
			key: "context-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
			additionalContext: { includeOldResource: true },
		};

		const ctx = { projectKey: "dummy" };
		const result = await repository.create(ctx, draft);

		expect(result.additionalContext).toEqual({ includeOldResource: true });
	});

	test("create extension with dependencies", async () => {
		const ctx = { projectKey: "dummy" };
		const dependency = await repository.create(ctx, {
			key: "dependency-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/dependency",
			},
			triggers: [],
		});

		const byId = await repository.create(ctx, {
			key: "dependent-by-id",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
			dependencies: [{ typeId: "extension", id: dependency.id }],
		});
		expect(byId.dependencies).toEqual([
			{ typeId: "extension", id: dependency.id },
		]);

		const byKey = await repository.create(ctx, {
			key: "dependent-by-key",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
			dependencies: [{ typeId: "extension", key: "dependency-extension" }],
		});
		expect(byKey.dependencies).toEqual([
			{ typeId: "extension", id: dependency.id },
		]);
	});

	test("create extension with unknown dependency", async () => {
		const ctx = { projectKey: "dummy" };
		await expect(
			repository.create(ctx, {
				key: "dependent-on-nothing",
				destination: {
					type: "HTTP",
					url: "https://example.com/webhook",
				},
				triggers: [],
				dependencies: [{ typeId: "extension", key: "does-not-exist" }],
			}),
		).rejects.toThrow(/was not found/);
	});

	test("postProcessResource masks HTTP authentication header", async () => {
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
		const result = await repository.postProcessResource(ctx, extension);

		expect(result.destination.type).toBe("HTTP");
		if (
			result.destination.type === "HTTP" &&
			result.destination.authentication?.type === "AuthorizationHeader"
		) {
			expect(result.destination.authentication.headerValue).toBe("****");
		}
	});

	test("postProcessResource masks AWSLambda access secret", async () => {
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
		const result = await repository.postProcessResource(ctx, extension);

		expect(result.destination.type).toBe("AWSLambda");
		if (result.destination.type === "AWSLambda") {
			expect(result.destination.accessSecret).toBe("****");
		}
	});

	test("update extension - changeDestination", async () => {
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
		const extension = await repository.create(ctx, draft);

		const newDestination = {
			type: "HTTP" as const,
			url: "https://new-example.com/webhook",
		};

		const result = await repository.processUpdateActions(
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

	test("update extension - changeTriggers", async () => {
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
		const extension = await repository.create(ctx, draft);

		const newTriggers = [
			{
				resourceTypeId: "order" as const,
				actions: ["Create" as const, "Update" as const],
			},
		];

		const result = await repository.processUpdateActions(
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

	test("update extension - setKey", async () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const extension = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
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

	test("update extension - setTimeoutInMs", async () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const extension = await repository.create(ctx, draft);

		const result = await repository.processUpdateActions(
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

	test("update extension - setExpansionPaths", async () => {
		const ctx = { projectKey: "dummy" };
		const extension = await repository.create(ctx, {
			key: "expansion-update-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
			expansionPaths: ["lineItems[*].variant"],
		});

		const result = await repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "setExpansionPaths",
					expansionPaths: ["custom.type"],
				} as ExtensionSetExpansionPathsAction,
			],
		);

		expect(result.expansionPaths).toEqual(["custom.type"]);
		expect(result.version).toBe(extension.version + 1);

		// An empty array removes all expansion paths
		const cleared = await repository.processUpdateActions(
			ctx,
			result,
			result.version,
			[
				{
					action: "setExpansionPaths",
					expansionPaths: [],
				} as ExtensionSetExpansionPathsAction,
			],
		);

		expect(cleared.expansionPaths).toEqual([]);
		expect(cleared.version).toBe(result.version + 1);
	});

	test("update extension - setDependencies", async () => {
		const ctx = { projectKey: "dummy" };
		const dependency = await repository.create(ctx, {
			key: "dependency-for-update",
			destination: {
				type: "HTTP",
				url: "https://example.com/dependency",
			},
			triggers: [],
		});
		const extension = await repository.create(ctx, {
			key: "dependency-update-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		});

		const result = await repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "setDependencies",
					dependencies: [{ typeId: "extension", key: "dependency-for-update" }],
				} as ExtensionSetDependenciesAction,
			],
		);

		expect(result.dependencies).toEqual([
			{ typeId: "extension", id: dependency.id },
		]);
		expect(result.version).toBe(extension.version + 1);
	});

	test("update extension - setAdditionalContext", async () => {
		const ctx = { projectKey: "dummy" };
		const extension = await repository.create(ctx, {
			key: "context-update-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		});

		const result = await repository.processUpdateActions(
			ctx,
			extension,
			extension.version,
			[
				{
					action: "setAdditionalContext",
					additionalContext: { includeOldResource: true },
				} as ExtensionSetAdditionalContextAction,
			],
		);

		expect(result.additionalContext).toEqual({ includeOldResource: true });
		expect(result.version).toBe(extension.version + 1);
	});

	test("get and delete extension", async () => {
		const draft: ExtensionDraft = {
			key: "test-extension",
			destination: {
				type: "HTTP",
				url: "https://example.com/webhook",
			},
			triggers: [],
		};

		const ctx = { projectKey: "dummy" };
		const extension = await repository.create(ctx, draft);

		// Test get
		const retrieved = await repository.get(ctx, extension.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(extension.id);

		// Test getByKey
		const retrievedByKey = await repository.getByKey(ctx, extension.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(extension.key);

		// Test delete
		const deleted = await repository.delete(ctx, extension.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(extension.id);

		// Verify it's deleted
		const notFound = await repository.get(ctx, extension.id);
		expect(notFound).toBeNull();
	});
});
