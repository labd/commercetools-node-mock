import { describe, expect, test } from "vitest";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { priceFromDraft } from "./helpers.ts";

describe("priceFromDraft", () => {
	const storage = new InMemoryStorage();
	const context = { projectKey: "dummy" };

	const seed = async () => {
		const customerGroup = await storage.add("dummy", "customer-group", {
			...getBaseResourceProperties(),
			key: "vip",
			name: "VIP",
		});
		const channel = await storage.add("dummy", "channel", {
			...getBaseResourceProperties(),
			key: "store-1",
			roles: ["ProductDistribution"],
		});
		const type = await storage.add("dummy", "type", {
			...getBaseResourceProperties(),
			key: "price-type",
			name: { en: "price-type" },
			resourceTypeIds: ["product-price"],
			fieldDefinitions: [],
		});
		return { customerGroup, channel, type };
	};

	test("maps every field of the draft", async () => {
		const { customerGroup, channel, type } = await seed();

		const price = await priceFromDraft(context, storage, {
			key: "base_price_eur",
			country: "NL",
			value: { currencyCode: "EUR", centAmount: 1000 },
			customerGroup: { typeId: "customer-group", key: "vip" },
			channel: { typeId: "channel", key: "store-1" },
			validFrom: "2024-01-01T00:00:00.000Z",
			validUntil: "2024-12-31T00:00:00.000Z",
			discounted: {
				value: { currencyCode: "EUR", centAmount: 800 },
				discount: {
					typeId: "product-discount",
					id: "6f0d1e2a-3b4c-4d5e-8f90-1a2b3c4d5e6f",
				},
			},
			tiers: [
				{
					minimumQuantity: 10,
					value: { currencyCode: "EUR", centAmount: 900 },
				},
			],
			custom: {
				type: { typeId: "type", id: type.id },
				fields: { foo: "bar" },
			},
		});

		expect(price).toEqual({
			id: expect.any(String),
			key: "base_price_eur",
			country: "NL",
			value: {
				type: "centPrecision",
				currencyCode: "EUR",
				centAmount: 1000,
				fractionDigits: 2,
			},
			customerGroup: { typeId: "customer-group", id: customerGroup.id },
			channel: { typeId: "channel", id: channel.id },
			recurrencePolicy: undefined,
			validFrom: "2024-01-01T00:00:00.000Z",
			validUntil: "2024-12-31T00:00:00.000Z",
			discounted: {
				value: {
					type: "centPrecision",
					currencyCode: "EUR",
					centAmount: 800,
					fractionDigits: 2,
				},
				discount: {
					typeId: "product-discount",
					id: "6f0d1e2a-3b4c-4d5e-8f90-1a2b3c4d5e6f",
				},
			},
			tiers: [
				{
					minimumQuantity: 10,
					value: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 900,
						fractionDigits: 2,
					},
				},
			],
			custom: {
				type: { typeId: "type", id: type.id },
				fields: { foo: "bar" },
			},
		});
	});

	test("leaves out what the draft does not set", async () => {
		const price = await priceFromDraft(context, storage, {
			value: { currencyCode: "EUR", centAmount: 1000 },
		});

		expect(price.customerGroup).toBeUndefined();
		expect(price.channel).toBeUndefined();
		expect(price.discounted).toBeUndefined();
		expect(price.tiers).toBeUndefined();
		expect(price.custom).toBeUndefined();
	});
});
