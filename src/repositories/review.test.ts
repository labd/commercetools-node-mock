import type {
	ReviewDraft,
	ReviewSetAuthorNameAction,
	ReviewSetCustomFieldAction,
	ReviewSetCustomTypeAction,
	ReviewSetCustomerAction,
	ReviewSetKeyAction,
	ReviewSetLocaleAction,
	ReviewSetRatingAction,
	ReviewSetTargetAction,
	ReviewSetTextAction,
	ReviewSetTitleAction,
	ReviewTransitionStateAction,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import { InMemoryStorage } from "~src/storage";
import { ReviewRepository } from "./review";

describe("Review Repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new ReviewRepository(config);

	// Add required dependencies for testing
	storage.add("dummy", "product", {
		...getBaseResourceProperties(),
		id: "product-123",
		key: "test-product",
		productType: {
			typeId: "product-type",
			id: "product-type-123",
		},
		masterData: {
			current: {
				name: { "en-US": "Test Product" },
				slug: { "en-US": "test-product" },
				categories: [],
				masterVariant: {
					id: 1,
					sku: "test-sku",
					prices: [],
				},
				variants: [],
				searchKeywords: {},
			},
			published: true,
			staged: {
				name: { "en-US": "Test Product" },
				slug: { "en-US": "test-product" },
				categories: [],
				masterVariant: {
					id: 1,
					sku: "test-sku",
					prices: [],
				},
				variants: [],
				searchKeywords: {},
			},
			hasStagedChanges: false,
		},
	});

	storage.add("dummy", "channel", {
		...getBaseResourceProperties(),
		id: "channel-123",
		key: "test-channel",
		name: { "en-US": "Test Channel" },
		roles: ["ProductDistribution"],
	});

	storage.add("dummy", "customer", {
		...getBaseResourceProperties(),
		id: "customer-123",
		email: "test@example.com",
		firstName: "John",
		lastName: "Doe",
		password: "hashed-password",
		addresses: [],
		defaultShippingAddressId: "",
		defaultBillingAddressId: "",
		customerNumber: "",
		externalId: "",
		key: "",
		stores: [],
		authenticationMode: "Password" as const,
		isEmailVerified: false,
	});

	storage.add("dummy", "state", {
		...getBaseResourceProperties(),
		id: "state-123",
		key: "approved",
		type: "ReviewState",
		name: { "en-US": "Approved" },
		roles: ["ReviewIncludedInStatistics"],
		transitions: [],
		initial: false,
		builtIn: false,
	});

	storage.add("dummy", "type", {
		...getBaseResourceProperties(),
		id: "type-123",
		key: "review-type",
		name: { "en-US": "Review Type" },
		resourceTypeIds: ["review"],
		fieldDefinitions: [
			{
				name: "helpfulVotes",
				label: { "en-US": "Helpful Votes" },
				required: false,
				type: { name: "Number" },
				inputHint: "SingleLine",
			},
		],
	});

	test("create review with product target", () => {
		const draft: ReviewDraft = {
			key: "product-review-1",
			authorName: "John Doe",
			title: "Great product!",
			text: "I really like this product. Highly recommended.",
			rating: 5,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.version).toBe(1);
		expect(result.key).toBe(draft.key);
		expect(result.authorName).toBe(draft.authorName);
		expect(result.title).toBe(draft.title);
		expect(result.text).toBe(draft.text);
		expect(result.rating).toBe(draft.rating);
		expect(result.target?.typeId).toBe("product");
		expect(result.target?.id).toBe("product-123");
		expect(result.includedInStatistics).toBe(true);

		// Test that the review is stored
		const items = repository.query(ctx);
		expect(items.count).toBe(1);
		expect(items.results[0].id).toBe(result.id);
	});

	test("create review with channel target", () => {
		const draft: ReviewDraft = {
			key: "channel-review-1",
			authorName: "Jane Smith",
			title: "Good service",
			text: "The service was good overall.",
			rating: 4,
			target: {
				typeId: "channel",
				id: "channel-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.target?.typeId).toBe("channel");
		expect(result.target?.id).toBe("channel-123");
	});

	test("create review with all optional fields", () => {
		const draft: ReviewDraft = {
			key: "full-review",
			authorName: "Alice Johnson",
			title: "Complete review",
			text: "This is a complete review with all fields.",
			rating: 3,
			locale: "en-US",
			uniquenessValue: "unique-123",
			target: {
				typeId: "product",
				id: "product-123",
			},
			state: {
				typeId: "state",
				id: "state-123",
			},
			custom: {
				type: {
					typeId: "type",
					id: "type-123",
				},
				fields: {
					helpfulVotes: 10,
				},
			},
		};

		const ctx = { projectKey: "dummy" };
		const result = repository.create(ctx, draft);

		expect(result.id).toBeDefined();
		expect(result.locale).toBe(draft.locale);
		expect(result.uniquenessValue).toBe(draft.uniquenessValue);
		expect(result.state?.id).toBe("state-123");
		expect(result.custom?.fields.helpfulVotes).toBe(10);
	});

	test("create review fails without target", () => {
		const draft: ReviewDraft = {
			authorName: "Bob Wilson",
			title: "No target review",
			text: "This review has no target.",
			rating: 2,
		};

		const ctx = { projectKey: "dummy" };

		expect(() => {
			repository.create(ctx, draft);
		}).toThrow("Missing target");
	});

	test("update review - setAuthorName", () => {
		const draft: ReviewDraft = {
			authorName: "Original Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setAuthorName",
					authorName: "Updated Author",
				} as ReviewSetAuthorNameAction,
			],
		);

		expect(result.authorName).toBe("Updated Author");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setTitle", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Original Title",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setTitle",
					title: "Updated Title",
				} as ReviewSetTitleAction,
			],
		);

		expect(result.title).toBe("Updated Title");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setText", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			text: "Original text",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setText",
					text: "Updated text content",
				} as ReviewSetTextAction,
			],
		);

		expect(result.text).toBe("Updated text content");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setRating", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 3,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setRating",
					rating: 5,
				} as ReviewSetRatingAction,
			],
		);

		expect(result.rating).toBe(5);
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setLocale", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setLocale",
					locale: "de-DE",
				} as ReviewSetLocaleAction,
			],
		);

		expect(result.locale).toBe("de-DE");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setKey", () => {
		const draft: ReviewDraft = {
			key: "original-key",
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setKey",
					key: "updated-key",
				} as ReviewSetKeyAction,
			],
		);

		expect(result.key).toBe("updated-key");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setCustomer", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setCustomer",
					customer: {
						typeId: "customer",
						id: "customer-123",
					},
				} as ReviewSetCustomerAction,
			],
		);

		expect(result.customer?.id).toBe("customer-123");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setTarget", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setTarget",
					target: {
						typeId: "channel",
						id: "channel-123",
					},
				} as ReviewSetTargetAction,
			],
		);

		expect(result.target?.typeId).toBe("channel");
		expect(result.target?.id).toBe("channel-123");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - transitionState", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "transitionState",
					state: {
						typeId: "state",
						id: "state-123",
					},
				} as ReviewTransitionStateAction,
			],
		);

		expect(result.state?.id).toBe("state-123");
		expect(result.version).toBe(review.version + 1);
	});

	test("update review - setCustomType", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		// Set custom type
		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setCustomType",
					type: {
						typeId: "type",
						id: "type-123",
					},
					fields: {
						helpfulVotes: 5,
					},
				} as ReviewSetCustomTypeAction,
			],
		);

		expect(result.custom).toBeDefined();
		expect(result.custom?.fields.helpfulVotes).toBe(5);
		expect(result.version).toBe(review.version + 1);

		// Remove custom type
		const result2 = repository.processUpdateActions(
			ctx,
			result,
			result.version,
			[
				{
					action: "setCustomType",
				} as ReviewSetCustomTypeAction,
			],
		);

		expect(result2.custom).toBeUndefined();
		expect(result2.version).toBe(result.version + 1);
	});

	test("update review - setCustomField", () => {
		const draft: ReviewDraft = {
			authorName: "Test Author",
			title: "Test Review",
			rating: 4,
			target: {
				typeId: "product",
				id: "product-123",
			},
			custom: {
				type: {
					typeId: "type",
					id: "type-123",
				},
				fields: {
					helpfulVotes: 3,
				},
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		const result = repository.processUpdateActions(
			ctx,
			review,
			review.version,
			[
				{
					action: "setCustomField",
					name: "helpfulVotes",
					value: 10,
				} as ReviewSetCustomFieldAction,
			],
		);

		expect(result.custom?.fields.helpfulVotes).toBe(10);
		expect(result.version).toBe(review.version + 1);
	});

	test("get and delete review", () => {
		const draft: ReviewDraft = {
			key: "delete-test",
			authorName: "Test Author",
			title: "Delete Test Review",
			rating: 3,
			target: {
				typeId: "product",
				id: "product-123",
			},
		};

		const ctx = { projectKey: "dummy" };
		const review = repository.create(ctx, draft);

		// Test get
		const retrieved = repository.get(ctx, review.id);
		expect(retrieved).toBeDefined();
		expect(retrieved?.id).toBe(review.id);

		// Test getByKey
		const retrievedByKey = repository.getByKey(ctx, review.key!);
		expect(retrievedByKey).toBeDefined();
		expect(retrievedByKey?.key).toBe(review.key);

		// Test delete
		const deleted = repository.delete(ctx, review.id);
		expect(deleted).toBeDefined();
		expect(deleted?.id).toBe(review.id);

		// Verify it's deleted
		const notFound = repository.get(ctx, review.id);
		expect(notFound).toBeNull();
	});
});
