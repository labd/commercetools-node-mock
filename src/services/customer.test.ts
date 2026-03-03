import assert from "node:assert";
import type { Customer, CustomerToken } from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { hashPassword } from "#src/lib/password.ts";
import { customerDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";

const ctMock = new CommercetoolsMock();

afterEach(async () => {
	await ctMock.clear();
});

describe("Customer create", () => {
	const factory = customerDraftFactory(ctMock);

	test("create new customer", async () => {
		const customer = await factory.create();

		expect(customer.version).toBe(1);
		expect(customer.defaultBillingAddressId).toBeUndefined();
		expect(customer.defaultShippingAddressId).toBeUndefined();
		expect(customer.billingAddressIds).toHaveLength(0);
		expect(customer.shippingAddressIds).toHaveLength(0);
	});

	test("create new customer with default billing & shipping address", async () => {
		const customer = await factory.create({
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
		});

		expect(customer.version).toBe(1);
		expect(customer.defaultBillingAddressId).toBeDefined();
		expect(customer.defaultShippingAddressId).toBeDefined();
		expect(customer.billingAddressIds).toHaveLength(0);
		expect(customer.shippingAddressIds).toHaveLength(0);
	});
});

describe("Customer Update Actions", () => {
	const factory = customerDraftFactory(ctMock);

	test("addAddress", async () => {
		const customer = await factory.create();
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
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
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().addresses).toHaveLength(2);
	});

	test("removeAddress by ID", async () => {
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "removeAddress",
						addressId: customer.addresses[0].id,
					},
				],
			},
		});
		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().addresses).toHaveLength(0);
	});

	test("removeAddress by Key", async () => {
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "removeAddress",
						addressKey: customer.addresses[0].key,
					},
				],
			},
		});
		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().addresses).toHaveLength(0);
	});

	test("changeAddress by ID", async () => {
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
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
			},
		});
		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		const result = response.json() as Customer;
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
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addBillingAddressId",
						addressId: customer.addresses[0].id,
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().shippingAddressIds).toHaveLength(0);
		expect(response.json().billingAddressIds).toHaveLength(1);
	});

	test("removeBillingAddressId", async () => {
		const customer = await factory.create({
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
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "removeBillingAddressId",
						addressId: addressId,
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		const result = response.json() as Customer;
		expect(result.version).toBe(2);
		expect(result.billingAddressIds).toHaveLength(0);
		expect(result.defaultBillingAddressId).toBeUndefined();
	});

	test("setDefaultBillingAddress by ID", async () => {
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: customer.version,
				actions: [
					{
						action: "setDefaultBillingAddress",
						addressId: addressId,
					},
				],
			},
		});
		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().defaultBillingAddressId).toBe(addressId);
		expect(response.json().addresses).toHaveLength(1);
		expect(response.json().billingAddressIds).toContain(addressId);
	});

	test("addShippingAddressId", async () => {
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "addShippingAddressId",
						addressId: customer.addresses[0].id,
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().shippingAddressIds).toHaveLength(1);
	});

	test("removeShippingAddressId", async () => {
		const customer = await factory.create({
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
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "removeShippingAddressId",
						addressId: addressId,
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		const result = response.json() as Customer;
		expect(result.version).toBe(2);
		expect(result.shippingAddressIds).toHaveLength(0);
		expect(result.defaultShippingAddressId).toBeUndefined();
	});

	test("setDefaultShippingAddress by ID", async () => {
		const customer = await factory.create({
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

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: customer.version,
				actions: [
					{
						action: "setDefaultShippingAddress",
						addressId: addressId,
					},
				],
			},
		});
		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		const result = response.json() as Customer;
		expect(result.version).toBe(2);
		expect(result.defaultShippingAddressId).toBe(addressId);
		expect(result.addresses).toHaveLength(1);
		expect(result.shippingAddressIds).toContain(addressId);
	});
});

// These tests use ctMock.project().unsafeAdd(), which we want to move away from.
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
			shippingAddressIds: [],
			billingAddressIds: [],
			customerGroupAssignments: [],
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);
	});

	test("exists", async () => {
		assert(customer, "customer not created");

		const response = await ctMock.app.inject({
			method: "HEAD",
			url: `/dummy/customers/${customer.id}`,
		});

		expect(response.statusCode).toBe(200);
	});

	test("non-existent", async () => {
		assert(customer, "customer not created");

		const response = await ctMock.app.inject({
			method: "HEAD",
			url: "/dummy/customers/invalid-id",
		});

		expect(response.statusCode).toBe(404);
	});

	test("changeEmail", async () => {
		assert(customer, "customer not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "changeEmail", email: "new@example.com" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().email).toBe("new@example.com");
	});

	test("setAuthenticationMode to an invalid mode", async () => {
		assert(customer, "customer not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setAuthenticationMode", authMode: "invalid" }],
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toBe(
			"Request body does not contain valid JSON.",
		);
		expect(response.json().errors[0].code).toBe("InvalidJsonInput");
		expect(response.json().errors[0].detailedErrorMessage).toBe(
			"actions -> authMode: Invalid enum value: 'invalid'. Expected one of: 'Password','ExternalAuth'",
		);
	});

	test("setAuthenticationMode to ExternalAuth", async () => {
		assert(customer, "customer not created");

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setAuthenticationMode", authMode: "ExternalAuth" },
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().authenticationMode).toBe("ExternalAuth");
		expect(response.json().password).toBe(undefined);
	});

	test("setAuthenticationMode error when setting current authMode", async () => {
		assert(customer, "customer not created");
		assert(
			customer.authenticationMode === "Password",
			"customer not in default state",
		);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{
						action: "setAuthenticationMode",
						authMode: "Password",
						password: "newpass",
					},
				],
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toBe(
			"The customer is already using the 'Password' authentication mode.",
		);
	});

	test("setAuthenticationMode to Password", async () => {
		assert(customer, "customer not created");

		//change *away from* Password authMode (to be able to test changing *to* Password authMode)
		await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setAuthenticationMode", authMode: "ExternalAuth" },
				],
			},
		});

		//change to Password authMode
		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 2,
				actions: [
					{
						action: "setAuthenticationMode",
						authMode: "Password",
						password: "newpass",
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().authenticationMode).toBe("Password");
		expect(response.json().password).toBe(
			Buffer.from("newpass").toString("base64"),
		);
	});

	test("setCustomField", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			custom: { type: { typeId: "type", id: "" }, fields: {} },
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setCustomField", name: "isValidCouponCode", value: false },
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().custom.fields.isValidCouponCode).toBe(false);
	});

	test("setExternalId", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			firstName: "John",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setExternalId", externalId: "123-xx-123" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().externalId).toBe("123-xx-123");
	});

	test("setFirstName", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			firstName: "John",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setFirstName", firstName: "Mary" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().firstName).toBe("Mary");
	});

	test("setLastName", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			lastName: "Doe",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setLastName", lastName: "Smith" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().lastName).toBe("Smith");
	});

	test("setLocale", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			salutation: "Mr.",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setLocale", locale: "de-DE" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().locale).toBe("de-DE");
	});

	test("setSalutation", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			salutation: "Mr.",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setSalutation", salutation: "Mrs." }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().salutation).toBe("Mrs.");
	});

	test("setCompanyName", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			companyName: "Acme",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setCompanyName", companyName: "Acme Inc." }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().companyName).toBe("Acme Inc.");
	});

	test("setVatId", async () => {
		assert(customer, "customer not created");

		customer = {
			...customer,
			vatId: "123456789",
		};
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setVatId", vatId: "ABCD" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().vatId).toBe("ABCD");
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
		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
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
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().addresses).toMatchObject([
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

		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setCustomerNumber", customerNumber: "CUSTOMER-001" },
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().customerNumber).toBe("CUSTOMER-001");
	});

	test("setCustomerNumber error when already have a customer number", async () => {
		assert(customer, "customer not created");

		await ctMock.project("dummy").unsafeAdd("customer", {
			...customer,
			customerNumber: "CUSTOMER-002",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setCustomerNumber", customerNumber: "CUSTOMER-001" },
				],
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json().message).toBe(
			"A Customer number already exists and cannot be set again.",
		);
	});

	test("setKey", async () => {
		assert(customer, "customer not created");

		await ctMock.project("dummy").unsafeAdd("customer", customer);

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/${customer.id}`,
			payload: {
				version: 1,
				actions: [{ action: "setKey", key: "C001" }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(2);
		expect(response.json().key).toBe("C001");
	});
});

describe("Customer Password Reset", () => {
	afterEach(async () => {
		await ctMock.clear();
	});

	beforeEach(async () => {
		await ctMock.project("dummy").unsafeAdd("customer", {
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
			shippingAddressIds: [],
			billingAddressIds: [],
			customerGroupAssignments: [],
		});
	});

	test("reset password flow", async () => {
		const tokenResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customers/password-token",
			payload: {
				email: "foo@example.org",
			},
		});
		const token = tokenResponse.json() as CustomerToken;

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customers/password/reset",
			payload: {
				tokenValue: token.value,
				newPassword: "somethingNew",
			},
		});
		expect(response.statusCode).toBe(200);
	});

	test("fail reset password flow", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customers/password/reset",
			payload: {
				tokenValue: "invalid-token",
				newPassword: "somethingNew",
			},
		});
		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
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
	const factory = customerDraftFactory(ctMock);

	test("creates an email token", async () => {
		const customer = await factory.create();

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/email-token`,
			payload: {
				id: customer.id,
				ttlMinutes: 60,
			},
		});

		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		expect(response.json()).toMatchObject({
			customerId: customer.id,
			invalidateOlderTokens: false,
			id: expect.any(String),
			value: expect.any(String),
		});

		const dateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
		expect(response.json().createdAt).toMatch(dateTime);
		expect(response.json().lastModifiedAt).toMatch(dateTime);
		expect(response.json().expiresAt).toMatch(dateTime);
	});

	test("validates an email token", async () => {
		const customer = await factory.create({
			isEmailVerified: false,
		});

		const tokenResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/email-token`,
			payload: {
				id: customer.id,
				ttlMinutes: 60,
			},
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/customers/email/confirm`,
			payload: {
				id: customer.id,
				tokenValue: tokenResponse.json().value,
			},
		});

		expect(response.statusCode, JSON.stringify(response.json())).toBe(200);
		expect(response.json().id).toEqual(customer.id);
		expect(response.json().isEmailVerified).toEqual(true);
	});
});
