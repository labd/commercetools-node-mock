import { ProductProjection, _SearchQuery } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { cloneObject } from "~src/helpers";
import { parseSearchQuery } from "./productSearchFilter";

describe("Product search filter", () => {
	const exampleProduct: ProductProjection = {
		id: "7401d82f-1378-47ba-996a-85beeb87ac87",
		version: 2,
		createdAt: "2022-07-22T10:02:40.851Z",
		lastModifiedAt: "2022-07-22T10:02:44.427Z",
		key: "test-product",
		productType: {
			typeId: "product-type",
			id: "b9b4b426-938b-4ccb-9f36-c6f933e8446e",
		},
		name: {
			"nl-NL": "test",
			"en-US": "my english test",
		},
		slug: {
			"nl-NL": "test",
			"en-US": "test",
		},
		variants: [],
		searchKeywords: {},
		categories: [],
		masterVariant: {
			id: 1,
			sku: "MYSKU",
			attributes: [
				{
					name: "Country",
					value: {
						key: "NL",
						label: {
							de: "niederlande",
							en: "netherlands",
							nl: "nederland",
						},
					},
				},
				{
					name: "number",
					value: 4,
				},
			],
			prices: [
				{
					id: "dummy-uuid",
					value: {
						type: "centPrecision",
						currencyCode: "EUR",
						centAmount: 1789,
						fractionDigits: 2,
					},
				},
			],
		},
	};

	const match = (filterObject: _SearchQuery, product?: ProductProjection) => {
		const matchFunc = parseSearchQuery(filterObject);
		const clone = cloneObject(product ?? exampleProduct);
		return {
			isMatch: matchFunc(clone, false),
			product: clone,
		};
	};

	test("by product key", async () => {
		expect(
			match({
				exists: {
					field: "key",
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				not: {
					exists: {
						field: "key",
					},
				},
			}).isMatch,
		).toBeFalsy();

		expect(
			match({
				exact: {
					field: "key",
					value: "test-product",
				},
			}).isMatch,
		).toBeTruthy();
	});

	test("by product type id", async () => {
		expect(
			match({
				exact: {
					field: "productType.id",
					value: "b9b4b426-938b-4ccb-9f36-c6f933e8446e",
				},
			}).isMatch,
		).toBeTruthy();
	});

	test("by variant SKU", async () => {
		expect(
			match({
				exists: {
					field: "variants.sku",
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				not: {
					exists: {
						field: "variants.sku",
					},
				},
			}).isMatch,
		).toBeFalsy();

		expect(
			match({
				exact: {
					field: "variants.sku",
					value: "MYSKU",
				},
			}).isMatch,
		).toBeTruthy();
	});

	test("by attribute value", async () => {
		expect(
			match({
				exact: {
					field: "variants.attributes.number",
					value: 4,
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				or: [
					{
						exact: {
							field: "variants.attributes.number",
							value: 3,
						},
					},
					{
						exact: {
							field: "variants.attributes.number",
							value: 4,
						},
					},
				],
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				exact: {
					field: "variants.attributes.number",
					value: 5,
				},
			}).isMatch,
		).toBeFalsy();
	});

	test("by attribute range", async () => {
		expect(
			match({
				range: {
					field: "variants.attributes.number",
					gt: 0,
					lt: 5,
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				range: {
					field: "variants.attributes.number",
					gt: 4,
					lt: 10,
				},
			}).isMatch,
		).toBeFalsy();

		expect(
			match({
				range: {
					field: "variants.attributes.number",
					gte: 4,
					lte: 10,
				},
			}).isMatch,
		).toBeTruthy();
	});

	test("by attribute enum key", async () => {
		expect(
			match({
				exact: {
					field: "variants.attributes.Country.key",
					value: "NL",
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				exact: {
					field: "variants.attributes.Country.key",
					value: "DE",
				},
			}).isMatch,
		).toBeFalsy();
	});

	test("by attribute text value", async () => {
		expect(
			match({
				wildcard: {
					field: "name",
					value: "*test*",
					language: "nl-NL",
					caseInsensitive: true,
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				wildcard: {
					field: "name",
					value: "*other*",
					language: "nl-NL",
					caseInsensitive: true,
				},
			}).isMatch,
		).toBeFalsy();

		expect(
			match({
				wildcard: {
					field: "name",
					value: "*Test*",
					language: "nl-NL",
					caseInsensitive: false,
				},
			}).isMatch,
		).toBeFalsy();

		expect(
			match({
				wildcard: {
					field: "name",
					value: "*english Test*",
					language: "en-US",
					caseInsensitive: true,
				},
			}).isMatch,
		).toBeTruthy();
	});

	test("by price range", async () => {
		expect(
			match({
				range: {
					field: "variants.prices.currentCentAmount",
					gte: 1500,
					lte: 2000,
				},
			}).isMatch,
		).toBeTruthy();

		expect(
			match({
				range: {
					field: "variants.prices.currentCentAmount",
					gt: 1800,
					lte: 2000,
				},
			}).isMatch,
		).toBeFalsy();
	});

	test("by price range - or", async () => {
		expect(
			match({
				or: [
					{
						range: {
							field: "variants.prices.currentCentAmount",
							gte: 2,
							lte: 1500,
						},
					},
					{
						range: {
							field: "variants.prices.currentCentAmount",
							gte: 1500,
							lte: 3000,
						},
					},
					{
						range: {
							field: "variants.prices.currentCentAmount",
							gte: 3000,
							lte: 4000,
						},
					},
				],
			}).isMatch,
		).toBeTruthy();
	});
});
