import type { BusinessUnit } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { businessUnitDraftFactory } from "#src/testing/business-unit.ts";
import { customerDraftFactory } from "#src/testing/customer.ts";
import { typeDraftFactory } from "#src/testing/type.ts";
import { CommercetoolsMock } from "../ctMock.ts";

describe("Business units query", () => {
	const ctMock = new CommercetoolsMock();
	let businessUnit: BusinessUnit | undefined;

	afterEach(() => {
		ctMock.clear();
	});

	beforeEach(async () => {
		const draft = businessUnitDraftFactory(ctMock).build();

		const response = await supertest(ctMock.app)
			.post("/dummy/business-units")
			.send(draft);
		expect(response.status).toBe(201);
		businessUnit = response.body as BusinessUnit;
	});

	test("no filter", async () => {
		const response = await supertest(ctMock.app)
			.get("/dummy/business-units")
			.query("{}")
			.send();

		expect(response.status).toBe(200);
		expect(response.body.count).toBe(1);
		businessUnit = response.body.results[0] as BusinessUnit;
		expect(businessUnit.key).toBe("test-business-unit");
	});
});

describe("Business Unit Update Actions", () => {
	const ctMock = new CommercetoolsMock();

	afterEach(() => {
		ctMock.clear();
	});

	test("addAddress", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addAddress",
						address: {
							firstName: "Foo",
							lastName: "Bar",
							streetName: "Baz Street",
							streetNumber: "99",
							postalCode: "12ab",
							country: "NL",
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.addresses).toHaveLength(2);
	});

	test("removeAddress by ID", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeAddress",
						addressId: businessUnit.addresses[0].id,
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.addresses).toHaveLength(0);
	});

	test("changeAddress by ID", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const addressId = businessUnit.addresses[0].id;

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeAddress",
						addressId: addressId,
						address: {
							firstName: "Foo",
							lastName: "Bar",
							streetName: "Baz Street",
							streetNumber: "99",
							postalCode: "12ab",
							country: "NL",
						},
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		const result = response.body as BusinessUnit;
		expect(result.version).toBe(2);
		expect(result.addresses).toHaveLength(1);
		expect(result.addresses).toStrictEqual([
			{
				id: addressId,
				firstName: "Foo",
				lastName: "Bar",
				streetName: "Baz Street",
				streetNumber: "99",
				postalCode: "12ab",
				country: "NL",
			},
		]);
	});

	test("addShippingAddressId", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addShippingAddressId",
						addressId: businessUnit.addresses[0].id,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.shippingAddressIds).toHaveLength(1);
	});

	test("removeShippingAddressId", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const addressId = businessUnit.addresses[0].id;
		await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addShippingAddressId",
						addressId: addressId,
					},
				],
			});

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 2,
				actions: [
					{
						action: "removeShippingAddressId",
						addressId: addressId,
					},
				],
			});
		expect(response.status).toBe(200);
		const result = response.body as BusinessUnit;
		expect(result.version).toBe(3);
		expect(result.shippingAddressIds).toHaveLength(0);
	});

	test("setDefaultShippingAddress by ID", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const addressId = businessUnit.addresses[0].id;

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: businessUnit.version,
				actions: [
					{
						action: "setDefaultShippingAddress",
						addressId: addressId,
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.defaultShippingAddressId).toBe(addressId);
	});

	test("addBillingAddressId", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addBillingAddressId",
						addressId: businessUnit.addresses[0].id,
					},
				],
			});

		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.billingAddressIds).toHaveLength(1);
	});

	test("removeBillingAddressId", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const addressId = businessUnit.addresses[0].id;
		await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addBillingAddressId",
						addressId: addressId,
					},
				],
			});

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 2,
				actions: [
					{
						action: "removeBillingAddressId",
						addressId: addressId,
					},
				],
			});
		expect(response.status).toBe(200);
		const result = response.body as BusinessUnit;
		expect(result.version).toBe(3);
		expect(result.billingAddressIds).toHaveLength(0);
	});

	test("setDefaultBillingAddress by ID", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();
		const addressId = businessUnit.addresses[0].id;

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: businessUnit.version,
				actions: [
					{
						action: "setDefaultBillingAddress",
						addressId: addressId,
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.defaultBillingAddressId).toBe(addressId);
	});

	test("changeName", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeName", name: "Updated Business Unit Name" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.name).toBe("Updated Business Unit Name");
	});

	test("setContactEmail", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setContactEmail", contactEmail: "newemail@business.com" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.contactEmail).toBe("newemail@business.com");
	});

	test("changeStatus", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeStatus", status: "Inactive" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.status).toBe("Inactive");
	});

	test("changeParentUnit", async () => {
		const parentBusinessUnit = await businessUnitDraftFactory(ctMock).create({
			key: "parent-company",
			name: "Parent Company",
		});

		const divisionBusinessUnit = await businessUnitDraftFactory(ctMock).create({
			key: "division-unit",
			name: "Division Unit",
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${divisionBusinessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeParentUnit",
						parentUnit: {
							typeId: "business-unit",
							key: parentBusinessUnit.key,
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.parentUnit?.key).toBe(parentBusinessUnit.key);
	});

	test("addAssociate", async () => {
		const businessUnit = await businessUnitDraftFactory(ctMock).create();
		const customer = await customerDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addAssociate",
						associate: {
							customer: {
								typeId: "customer",
								id: customer.id,
							},
							associateRoleAssignments: [],
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.associates).toHaveLength(1);
	});

	test("removeAssociate", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		const businessUnit = await businessUnitDraftFactory(ctMock).create({
			associates: [
				{
					customer: {
						typeId: "customer",
						id: customer.id,
					},
					associateRoleAssignments: [],
				},
			],
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeAssociate",
						customer: {
							typeId: "customer",
							id: customer.id,
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.associates).toHaveLength(0);
	});

	test("changeAssociate", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		const businessUnit = await businessUnitDraftFactory(ctMock).create({
			associates: [
				{
					customer: {
						typeId: "customer",
						id: customer.id,
					},
					associateRoleAssignments: [],
				},
			],
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeAssociate",
						customer: {
							typeId: "customer",
							id: customer.id,
						},
						associate: {
							customer: {
								typeId: "customer",
								id: customer.id,
							},
							associateRoleAssignments: [
								{
									associateRole: {
										typeId: "associate-role",
										key: "admin",
									},
									inheritance: "Enabled",
								},
							],
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.associates[0].associateRoleAssignments).toHaveLength(
			1,
		);
	});

	test("setCustomType", async () => {
		const type = await typeDraftFactory(ctMock).create({
			resourceTypeIds: ["business-unit"],
			fieldDefinitions: [
				{
					type: { name: "String" },
					name: "customField",
					label: { en: "Custom Field" },
					required: false,
				},
			],
		});

		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomType",
						type: {
							typeId: "type",
							id: type.id,
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.custom.type.id).toBe(type.id);
	});

	test("setCustomField", async () => {
		const type = await typeDraftFactory(ctMock).create({
			resourceTypeIds: ["business-unit"],
			fieldDefinitions: [
				{
					type: { name: "String" },
					name: "customField",
					label: { en: "Custom Field" },
					required: false,
				},
			],
		});

		const businessUnit = await businessUnitDraftFactory(ctMock).create({
			custom: {
				type: {
					typeId: "type",
					id: type.id,
				},
				fields: {
					customField: "foo",
				},
			},
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setCustomField",
						name: "customField",
						value: "bar",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.custom.fields.customField).toBe("bar");
	});

	test("setAddressCustomType", async () => {
		const type = await typeDraftFactory(ctMock).create({
			resourceTypeIds: ["address"],
			fieldDefinitions: [
				{
					type: { name: "String" },
					name: "addressCustomField",
					label: { en: "Address Custom Field" },
					required: false,
				},
			],
		});
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAddressCustomType",
						addressId: businessUnit.addresses[0].id,
						type: {
							typeId: "type",
							id: type.id,
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.addresses[0].custom.type.id).toBe(type.id);
	});

	test("setAddressCustomField", async () => {
		const type = await typeDraftFactory(ctMock).create({
			resourceTypeIds: ["address"],
			fieldDefinitions: [
				{
					type: { name: "String" },
					name: "addressCustomField",
					label: { en: "Address Custom Field" },
					required: false,
				},
			],
		});
		const businessUnit = await businessUnitDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/business-units/${businessUnit.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAddressCustomType",
						addressId: businessUnit.addresses[0].id,
						type: {
							typeId: "type",
							id: type.id,
						},
					},
					{
						action: "setAddressCustomField",
						addressId: businessUnit.addresses[0].id,
						name: "addressCustomField",
						value: "address custom value",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.addresses[0].custom.fields.addressCustomField).toBe(
			"address custom value",
		);
	});
});
