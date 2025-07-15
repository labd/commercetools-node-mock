import type {
	CustomerGroupResourceIdentifier,
	DiscountedPriceDraft,
	PriceDraft,
	PriceTierDraft,
	ProductDiscountReference,
} from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { getBaseResourceProperties } from "~src/helpers";
import { InMemoryStorage } from "~src/storage";
import type { RepositoryContext } from "../abstract";
import { priceFromDraft } from "./helpers";

describe("priceFromDraft", () => {
	const context: RepositoryContext = {
		projectKey: "test-project",
	};
	const storage = new InMemoryStorage();

	test("should handle basic price draft without optional fields", () => {
		const draft: PriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
			country: "NL",
		};

		const result = priceFromDraft(context, storage, draft);

		expect(result).toMatchObject({
			id: expect.any(String),
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
		});
		expect(result.key).toBeUndefined();
		expect(result.channel).toBeUndefined();
		expect(result.customerGroup).toBeUndefined();
	});

	test("should handle customerGroup field when provided", () => {
		// First create a customer group in storage
		const customerGroup = {
			...getBaseResourceProperties(),
			id: "customer-group-id",
			key: "customer-group-key",
			name: "Test Customer Group",
			groupName: "Test Group",
		};
		storage.add("test-project", "customer-group", customerGroup);

		const customerGroupResourceIdentifier: CustomerGroupResourceIdentifier = {
			typeId: "customer-group",
			id: "customer-group-id",
		};

		const draft: PriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
			country: "NL",
			customerGroup: customerGroupResourceIdentifier,
		};

		const result = priceFromDraft(context, storage, draft);

		expect(result).toMatchObject({
			id: expect.any(String),
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			customerGroup: {
				typeId: "customer-group",
				id: "customer-group-id",
			},
		});
	});

	test("should handle validFrom and validUntil fields when provided", () => {
		const draft: PriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
			country: "NL",
			validFrom: "2023-01-01T00:00:00.000Z",
			validUntil: "2023-12-31T23:59:59.999Z",
		};

		const result = priceFromDraft(context, storage, draft);

		expect(result).toMatchObject({
			id: expect.any(String),
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			validFrom: "2023-01-01T00:00:00.000Z",
			validUntil: "2023-12-31T23:59:59.999Z",
		});
	});

	test("should handle tiers field when provided", () => {
		const tierDrafts: PriceTierDraft[] = [
			{
				minimumQuantity: 5,
				value: {
					currencyCode: "EUR",
					centAmount: 900,
				},
			},
			{
				minimumQuantity: 10,
				value: {
					currencyCode: "EUR",
					centAmount: 800,
				},
			},
		];

		const draft: PriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
			country: "NL",
			tiers: tierDrafts,
		};

		const result = priceFromDraft(context, storage, draft);

		expect(result).toMatchObject({
			id: expect.any(String),
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			tiers: [
				{
					minimumQuantity: 5,
					value: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 900,
						fractionDigits: 2,
					},
				},
				{
					minimumQuantity: 10,
					value: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 800,
						fractionDigits: 2,
					},
				},
			],
		});
	});

	test("should handle discounted field when provided", () => {
		// First create a product discount in storage
		const productDiscount = {
			...getBaseResourceProperties(),
			id: "product-discount-id",
			name: { en: "Test Discount" },
			description: { en: "Test Discount Description" },
			value: {
				type: "relative" as const,
				permyriad: 2000, // 20% discount
			},
			predicate: "1=1",
			sortOrder: "0.1",
			isActive: true,
			references: [],
		};
		storage.add("test-project", "product-discount", productDiscount);

		const discountedDraft: DiscountedPriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 800,
			},
			discount: {
				typeId: "product-discount",
				id: "product-discount-id",
			},
		};

		const draft: PriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
			country: "NL",
			discounted: discountedDraft,
		};

		const result = priceFromDraft(context, storage, draft);

		expect(result).toMatchObject({
			id: expect.any(String),
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			discounted: {
				value: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 800,
					fractionDigits: 2,
				},
				discount: {
					typeId: "product-discount",
					id: "product-discount-id",
				},
			},
		});
	});

	test("should handle custom field when provided", () => {
		// First create a type in storage for custom fields
		const customType = {
			...getBaseResourceProperties(),
			id: "custom-type-id",
			key: "custom-type-key",
			name: { en: "Custom Type" },
			resourceTypeIds: ["price"],
			fieldDefinitions: [],
		};
		storage.add("test-project", "type", customType);

		const draft: PriceDraft = {
			value: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
			country: "NL",
			custom: {
				type: {
					typeId: "type",
					id: "custom-type-id",
				},
				fields: {
					customField: "customValue",
				},
			},
		};

		const result = priceFromDraft(context, storage, draft);

		expect(result).toMatchObject({
			id: expect.any(String),
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			custom: {
				type: {
					typeId: "type",
					id: "custom-type-id",
				},
				fields: {
					customField: "customValue",
				},
			},
		});
	});
});
