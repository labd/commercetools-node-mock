import assert from "node:assert";
import type {
	Customer,
	CustomerDraft,
	CustomerToken,
} from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { hashPassword } from "#src/lib/password.ts";
import { customerDraftFactory } from "#src/testing/customer.ts";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";

const ctMock = new CommercetoolsMock();

afterEach(() => {
	ctMock.clear();
});

describe("Customer create", () => {
	test("create new customer", async () => {
		const draft = customerDraftFactory(ctMock).build();

		const response = await supertest(ctMock.app)
			.post("/dummy/customers")
			.send(draft);

		const customer = response.body.customer as Customer;
		expect(response.status, JSON.stringify(customer)).toBe(201);
		expect(customer.version).toBe(1);
		expect(customer.defaultBillingAddressId).toBeUndefined();
		expect(customer.defaultShippingAddressId).toBeUndefined();
		expect(customer.billingAddressIds).toHaveLength(0);
		expect(customer.shippingAddressIds).toHaveLength(0);
	});

	test("create new customer with default billing & shipping address", async () => {
		const draft: CustomerDraft = {
			email: "new-user@example.com",
			password: "supersecret",
			authenticationMode: "Password",
			stores: [],
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
			defaultBillingAddress: 0,
			defaultShippingAddress: 0,
		};

		const response = await supertest(ctMock.app)
			.post("/dummy/customers")
			.send(draft);

		const customer = response.body.customer as Customer;
		expect(response.status, JSON.stringify(customer)).toBe(201);
		expect(customer.version).toBe(1);
		expect(customer.defaultBillingAddressId).toBeDefined();
		expect(customer.defaultShippingAddressId).toBeDefined();
		expect(customer.billingAddressIds).toHaveLength(0);
		expect(customer.shippingAddressIds).toHaveLength(0);
	});
});

describe("Customer Update Actions", () => {
	test("addAddress", async () => {
		const customer = await customerDraftFactory(ctMock).create();
		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
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
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeAddress",
						addressId: customer.addresses[0].id,
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.addresses).toHaveLength(0);
	});

	test("removeAddress by Key", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeAddress",
						addressKey: customer.addresses[0].key,
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.addresses).toHaveLength(0);
	});

	test("changeAddress by ID", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
		});
		const addressId = customer.addresses[0].id;

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
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
		const result = response.body as Customer;
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

	test("addBillingAddressId", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addBillingAddressId",
						addressId: customer.addresses[0].id,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.shippingAddressIds).toHaveLength(0);
		expect(response.body.billingAddressIds).toHaveLength(1);
	});

	test("removeBillingAddressId", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
			billingAddresses: [0],
			defaultBillingAddress: 0,
		});
		expect(customer.billingAddressIds).toHaveLength(1);
		expect(customer.defaultBillingAddressId).toBeDefined();

		const addressId = customer.addresses[0].id;
		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeBillingAddressId",
						addressId: addressId,
					},
				],
			});
		expect(response.status).toBe(200);
		const result = response.body as Customer;
		expect(result.version).toBe(2);
		expect(result.billingAddressIds).toHaveLength(0);
		expect(result.defaultBillingAddressId).toBeUndefined();
	});

	test("setDefaultBillingAddress by ID", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			defaultBillingAddress: undefined,
			defaultShippingAddress: undefined,
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
			shippingAddresses: [],
			billingAddresses: [],
		});
		const addressId = customer.addresses[0].id;

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: customer.version,
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
		expect(response.body.addresses).toHaveLength(1);
		expect(response.body.billingAddressIds).toContain(addressId);
	});

	test("addShippingAddressId", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "addShippingAddressId",
						addressId: customer.addresses[0].id,
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.shippingAddressIds).toHaveLength(1);
	});

	test("removeShippingAddressId", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
			shippingAddresses: [0],
			defaultShippingAddress: 0,
		});
		expect(customer.shippingAddressIds).toHaveLength(1);
		expect(customer.defaultShippingAddressId).toBeDefined();

		const addressId = customer.addresses[0].id;
		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "removeShippingAddressId",
						addressId: addressId,
					},
				],
			});
		expect(response.status).toBe(200);
		const result = response.body as Customer;
		expect(result.version).toBe(2);
		expect(result.shippingAddressIds).toHaveLength(0);
		expect(result.defaultShippingAddressId).toBeUndefined();
	});

	test("setDefaultShippingAddress by ID", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			defaultBillingAddress: undefined,
			defaultShippingAddress: undefined,
			addresses: [
				{
					key: "address-key",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
			shippingAddresses: [],
			billingAddresses: [],
		});
		const addressId = customer.addresses[0].id;

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: customer.version,
				actions: [
					{
						action: "setDefaultShippingAddress",
						addressId: addressId,
					},
				],
			});
		expect(response.status, JSON.stringify(response.body)).toBe(200);
		const result = response.body as Customer;
		expect(result.version).toBe(2);
		expect(result.defaultShippingAddressId).toBe(addressId);
		expect(result.addresses).toHaveLength(1);
		expect(result.shippingAddressIds).toContain(addressId);
	});
});

// These tests use ctMock.project().add(), which we want to move away from.
// Please add new test to the previous section.
describe("Customer Update Actions (old-style)", () => {
	let customer: Customer | undefined;

	beforeEach(async () => {
		customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: "supersecret",
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
			stores: [],
		};
		ctMock.project("dummy").add("customer", customer);
	});

	test("exists", async () => {
		assert(customer, "customer not created");

		const response = await supertest(ctMock.app)
			.head(`/dummy/customers/${customer.id}`)
			.send();

		expect(response.status).toBe(200);
	});

	test("non-existent", async () => {
		assert(customer, "customer not created");

		const response = await supertest(ctMock.app)
			.head("/dummy/customers/invalid-id")
			.send();

		expect(response.status).toBe(404);
	});

	test("changeEmail", async () => {
		assert(customer, "customer not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "changeEmail", email: "new@example.com" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.email).toBe("new@example.com");
	});

	test("setAuthenticationMode to an invalid mode", async () => {
		assert(customer, "customer not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setAuthenticationMode", authMode: "invalid" }],
			});
		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"Request body does not contain valid JSON.",
		);
		expect(response.body.errors[0].code).toBe("InvalidJsonInput");
		expect(response.body.errors[0].detailedErrorMessage).toBe(
			"actions -> authMode: Invalid enum value: 'invalid'. Expected one of: 'Password','ExternalAuth'",
		);
	});

	test("setAuthenticationMode to ExternalAuth", async () => {
		assert(customer, "customer not created");

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setAuthenticationMode", authMode: "ExternalAuth" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.authenticationMode).toBe("ExternalAuth");
		expect(response.body.password).toBe(undefined);
	});

	test("setAuthenticationMode error when setting current authMode", async () => {
		assert(customer, "customer not created");
		assert(
			customer.authenticationMode === "Password",
			"customer not in default state",
		);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "setAuthenticationMode",
						authMode: "Password",
						password: "newpass",
					},
				],
			});
		expect(response.status).toBe(400);
		expect(response.body.message).toBe(
			"The customer is already using the 'Password' authentication mode.",
		);
	});

	test("setAuthenticationMode to Password", async () => {
		assert(customer, "customer not created");

		//change *away from* Password authMode (to be able to test changing *to* Password authMode)
		await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setAuthenticationMode", authMode: "ExternalAuth" },
				],
			});

		//change to Password authMode
		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 2,
				actions: [
					{
						action: "setAuthenticationMode",
						authMode: "Password",
						password: "newpass",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.authenticationMode).toBe("Password");
		expect(response.body.password).toBe(
			Buffer.from("newpass").toString("base64"),
		);
	});

	test("setCustomField", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			custom: { type: { typeId: "type", id: "" }, fields: {} },
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setCustomField", name: "isValidCouponCode", value: false },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.custom.fields.isValidCouponCode).toBe(false);
	});

	test("setExternalId", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			firstName: "John",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setExternalId", externalId: "123-xx-123" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.externalId).toBe("123-xx-123");
	});

	test("setFirstName", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			firstName: "John",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setFirstName", firstName: "Mary" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.firstName).toBe("Mary");
	});

	test("setLastName", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			lastName: "Doe",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setLastName", lastName: "Smith" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.lastName).toBe("Smith");
	});

	test("setLocale", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			salutation: "Mr.",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setLocale", locale: "de-DE" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.locale).toBe("de-DE");
	});

	test("setSalutation", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			salutation: "Mr.",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setSalutation", salutation: "Mrs." }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.salutation).toBe("Mrs.");
	});

	test("setCompanyName", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			companyName: "Acme",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setCompanyName", companyName: "Acme Inc." }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.companyName).toBe("Acme Inc.");
	});

	test("setVatId", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			vatId: "123456789",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setVatId", vatId: "ABCD" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.vatId).toBe("ABCD");
	});

	test("changeAddress", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			addresses: [
				{
					...getBaseResourceProperties(),
					id: "other-address-uid",
					firstName: "Foo",
					lastName: "Bar",
					streetName: "Baz Street",
					streetNumber: "99",
					postalCode: "12ab",
					country: "NL",
				},
				{
					...getBaseResourceProperties(),
					id: "address-uuid",
					firstName: "John",
					lastName: "Doe",
					streetName: "Main Street",
					streetNumber: "1",
					postalCode: "12345",
					country: "DE",
				},
			],
			defaultBillingAddressId: "address-uuid",
		};
		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{
						action: "changeAddress",
						addressId: "address-uuid",
						address: {
							firstName: "Marie",
							lastName: "Johnson",
							streetName: "Last Street",
							streetNumber: "2",
							postalCode: "ABCS",
							country: "US",
						},
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.addresses).toMatchObject([
			{
				id: "other-address-uid",
				firstName: "Foo",
				lastName: "Bar",
				streetName: "Baz Street",
				streetNumber: "99",
				postalCode: "12ab",
				country: "NL",
			},
			{
				id: "address-uuid",
				firstName: "Marie",
				lastName: "Johnson",
				streetName: "Last Street",
				streetNumber: "2",
				postalCode: "ABCS",
				country: "US",
			},
		]);
	});

	test("setCustomerNumber", async () => {
		assert(customer, "customer not created");

		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setCustomerNumber", customerNumber: "CUSTOMER-001" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.customerNumber).toBe("CUSTOMER-001");
	});

	test("setCustomerNumber error when already have a customer number", async () => {
		assert(customer, "customer not created");

		ctMock.project("dummy").add("customer", {
			...customer,
			customerNumber: "CUSTOMER-002",
		});

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [
					{ action: "setCustomerNumber", customerNumber: "CUSTOMER-001" },
				],
			});
		expect(response.status).toBe(500);
		expect(response.body.error).toBe(
			"A Customer number already exists and cannot be set again.",
		);
	});

	test("setKey", async () => {
		assert(customer, "customer not created");

		ctMock.project("dummy").add("customer", customer);

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/${customer.id}`)
			.send({
				version: 1,
				actions: [{ action: "setKey", key: "C001" }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.key).toBe("C001");
	});
});

describe("Customer Password Reset", () => {
	afterEach(() => {
		ctMock.clear();
	});

	beforeEach(() => {
		ctMock.project("dummy").add("customer", {
			id: "123",
			createdAt: "2021-03-18T14:00:00.000Z",
			version: 2,
			lastModifiedAt: "2021-03-18T14:00:00.000Z",
			email: "foo@example.org",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "password",
			custom: { type: { typeId: "type", id: "" }, fields: {} },
			stores: [],
		});
	});

	test("reset password flow", async () => {
		const token = await supertest(ctMock.app)
			.post("/dummy/customers/password-token")
			.send({
				email: "foo@example.org",
			})
			.then((response) => response.body as CustomerToken);

		const response = await supertest(ctMock.app)
			.post("/dummy/customers/password/reset")
			.send({
				tokenValue: token.value,
				newPassword: "somethingNew",
			});
		expect(response.status).toBe(200);
	});

	test("fail reset password flow", async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/customers/password/reset")
			.send({
				tokenValue: "invalid-token",
				newPassword: "somethingNew",
			});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			message: `The Customer with ID 'Token(invalid-token)' was not found.`,
			statusCode: 400,
			errors: [
				{
					code: "ResourceNotFound",
					message: `The Customer with ID 'Token(invalid-token)' was not found.`,
				},
			],
		});
	});
});

describe("Customer email verification", () => {
	test("creates an email token", async () => {
		const customer = await customerDraftFactory(ctMock).create();

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/email-token`)
			.send({
				id: customer.id,
				ttlMinutes: 60,
			});

		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body).toMatchObject({
			customerId: customer.id,
			invalidateOlderTokens: false,
			id: expect.any(String),
			value: expect.any(String),
		});

		const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
		expect(response.body.createdAt).toMatch(dateTime);
		expect(response.body.lastModifiedAt).toMatch(dateTime);
		expect(response.body.expiresAt).toMatch(dateTime);
	});

	test("validates an email token", async () => {
		const customer = await customerDraftFactory(ctMock).create({
			isEmailVerified: false,
		});

		const tokenResponse = await supertest(ctMock.app)
			.post(`/dummy/customers/email-token`)
			.send({
				id: customer.id,
				ttlMinutes: 60,
			});

		const response = await supertest(ctMock.app)
			.post(`/dummy/customers/email/confirm`)
			.send({
				id: customer.id,
				tokenValue: tokenResponse.body.value,
			});

		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.isEmailVerified).toEqual(true);
	});
});
