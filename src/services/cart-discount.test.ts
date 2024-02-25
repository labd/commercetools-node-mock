import { CartDiscount, TypeDraft } from "@commercetools/platform-sdk";
import assert from "assert";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "..";

const typeDraft: TypeDraft = {
	key: "my-type",
	name: {
		en: "TestType",
	},
	description: {
		en: "Test Type",
	},
	resourceTypeIds: ["cart-discount"],
	fieldDefinitions: [
		{
			name: "discount_name",
			label: {
				en: "Discount name",
			},
			required: false,
			type: {
				name: "String",
			},
			inputHint: "SingleLine",
		},
		{
			name: "fixedAmount",
			label: {
				en: "Fixed Amount",
			},
			required: true,
			type: {
				name: "Money",
			},
			inputHint: "SingleLine",
		},
	],
};

const getCartDiscountDraft = (typeId: string) => ({
	version: 1,
	key: "my-relative-cart-discount",
	name: { en: "myRelativeCartDiscount" },
	value: {
		type: "relative",
		permyriad: 1000,
	},
	description: { en: "My relative cart discount" },
	target: { type: "lineItems", predicate: "1=1" },
	isActive: false,
	custom: {
		type: {
			typeId: "type",
			id: typeId,
		},
		fields: {
			discount_name: "MyDiscount",
			fixedAmount: {
				type: "centPrecision",
				currencyCode: "USD",
				centAmount: 15000,
				fractionDigits: 2,
			},
		},
	},
	validFrom: "2000-01-01T00:00:01.000Z",
	validUntil: "2000-12-31T23:59:59.999Z",
	sortOrder: "0.1",
});

describe("Cart Discounts Query", () => {
	const ctMock = new CommercetoolsMock();

	beforeEach(async () => {
		let response;
		response = await supertest(ctMock.app).post("/dummy/types").send(typeDraft);
		expect(response.status).toBe(201);
		const typeId = response.body.id;

		response = await supertest(ctMock.app)
			.post("/dummy/cart-discounts")
			.send(getCartDiscountDraft(typeId));
		expect(response.status).toBe(201);
	});

	test("no filter", async () => {
		const response = await supertest(ctMock.app)
			.get("/dummy/cart-discounts")
			.send();

		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);

		const myRelativeCartDiscount = response.body.results[0] as CartDiscount;
		expect(myRelativeCartDiscount.key).toBe("my-relative-cart-discount");
		expect(myRelativeCartDiscount.description).toStrictEqual({
			en: "My relative cart discount",
		});
		expect(myRelativeCartDiscount.isActive).toBe(false);
		expect(myRelativeCartDiscount.name).toStrictEqual({
			en: "myRelativeCartDiscount",
		});
		expect(myRelativeCartDiscount.stores).toStrictEqual([]);
		expect(myRelativeCartDiscount.references).toStrictEqual([]);
		expect(myRelativeCartDiscount.target).toStrictEqual({
			type: "lineItems",
			predicate: "1=1",
		});
		expect(myRelativeCartDiscount.requiresDiscountCode).toBe(false);
		expect(myRelativeCartDiscount.stackingMode).toBe("Stacking");
		expect(myRelativeCartDiscount.value).toStrictEqual({
			type: "relative",
			permyriad: 1000,
		});

		expect(myRelativeCartDiscount.custom?.type.id).not.toBeUndefined();
		expect(myRelativeCartDiscount.custom?.type.typeId).toBe("type");
		expect(myRelativeCartDiscount.custom?.fields).toStrictEqual({
			discount_name: "MyDiscount",
			fixedAmount: {
				centAmount: 15000,
				currencyCode: "USD",
				fractionDigits: 2,
				type: "centPrecision",
			},
		});
	});
});

describe("Cart Discounts Update Actions", () => {
	const ctMock = new CommercetoolsMock();
	let cartDiscount: CartDiscount | undefined;

	const createType = async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/types")
			.send(typeDraft);
		expect(response.status).toBe(201);
		return response.body.id;
	};

	const createCartDiscount = async (typeId: string) => {
		const cartDiscountDraft = getCartDiscountDraft(typeId);
		const response = await supertest(ctMock.app)
			.post("/dummy/cart-discounts")
			.send(cartDiscountDraft);
		expect(response.status).toBe(201);
		cartDiscount = response.body;
	};

	beforeEach(async () => {
		const typeId = await createType();
		await createCartDiscount(typeId);
	});

	afterEach(() => {
		ctMock.clear();
	});

	test("set key", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [{ action: "setKey", key: "my-cart-discount" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.key).toBe("my-cart-discount");
	});

	test("set description", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setDescription", description: { en: "Description" } },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.description.en).toBe("Description");
	});

	test("set valid from", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setValidFrom", validFrom: "2020-01-01T00:00:01.000Z" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.validFrom).toBe("2020-01-01T00:00:01.000Z");
	});

	test("set valid until", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setValidUntil", validUntil: "2020-12-31T23:59:59.999Z" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.validUntil).toBe("2020-12-31T23:59:59.999Z");
	});

	test("set valid from and until", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setValidFromAndUntil",
						validFrom: "2020-01-01T00:00:01.000Z",
						validUntil: "2020-12-31T23:59:59.999Z",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.validFrom).toBe("2020-01-01T00:00:01.000Z");
		expect(response.body.validUntil).toBe("2020-12-31T23:59:59.999Z");
	});

	test("change sort order", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeSortOrder", sortOrder: "0.2" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.sortOrder).toBe("0.2");
	});

	test("change isActive", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeIsActive", isActive: true }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.isActive).toBe(true);
	});

	test("change target", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeTarget",
						target: { type: "shippingInfo", predicate: "2=2" },
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.target).toStrictEqual({
			type: "shippingInfo",
			predicate: "2=2",
		});
	});

	test("set custom field", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomField",
						name: "fixedAmount",
						value: {
							type: "centPrecision",
							currencyCode: "EUR",
							centAmount: 15,
							fractionDigits: 2,
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.custom.fields.fixedAmount).toStrictEqual({
			type: "centPrecision",
			currencyCode: "EUR",
			centAmount: 15,
			fractionDigits: 2,
		});
	});

	test("reset custom field", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomField",
						name: "fixedAmount",
						value: null,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.custom.fields.fixedAmount).toBeUndefined();
	});

	test("reset non-existing custom field", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomField",
						name: "nonExistingField",
						value: null,
					},
				],
			});
		expect(response.status).toBe(400);
	});

	test("remove all custom fields", async () => {
		assert(cartDiscount, "cart discount not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/cart-discounts/${cartDiscount.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomType",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.custom).toBeUndefined();
	});
});
