import { Customer } from "@commercetools/platform-sdk";
import assert from "assert";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock, getBaseResourceProperties } from "../index";

describe("Customer Update Actions", () => {
	const ctMock = new CommercetoolsMock();
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
		};
		ctMock.project("dummy").add("customer", customer);
	});

	afterEach(() => {
		ctMock.clear();
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
			.head(`/dummy/customers/invalid-id`)
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
			customer.authenticationMode == "Password",
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
				actions: [
					{ action: "setKey", key: "C001" },
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(2);
		expect(response.body.key).toBe("C001");
	});
});
