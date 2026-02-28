import type {
	Customer,
	CustomerChangePassword,
	CustomerToken,
	MyCustomerDraft,
} from "@commercetools/platform-sdk";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock, getBaseResourceProperties } from "../index.ts";
import { hashPassword } from "../lib/password.ts";

const ctMock = new CommercetoolsMock();

describe("Me", () => {
	afterEach(() => {
		ctMock.clear();
	});

	test("Create me", async () => {
		const draft: MyCustomerDraft = {
			email: "test@example.org",
			password: "p4ssw0rd",
		};

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/signup",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual({
			customer: {
				...draft,
				password: "cDRzc3cwcmQ=",
				lowercaseEmail: draft.email.toLowerCase(),
				authenticationMode: "Password",
				version: 1,
				isEmailVerified: false,
				addresses: [],
				billingAddressIds: [],
				shippingAddressIds: [],
				id: expect.anything(),
				createdAt: expect.anything(),
				lastModifiedAt: expect.anything(),
				stores: [],
			},
		});
	});

	test("Get me", async () => {
		const draft: MyCustomerDraft = {
			email: "test@example.org",
			password: "p4ssw0rd",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/signup",
			payload: draft,
		});

		const response = await ctMock.app.inject({ method: "GET", url: "/dummy/me" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json().customer);
	});
});

describe("/me", () => {
	afterEach(() => {
		ctMock.clear();
	});

	beforeEach(() => {
		ctMock.project("dummy").unsafeAdd("customer", {
			id: "123",
			createdAt: "2021-03-18T14:00:00.000Z",
			version: 2,
			lastModifiedAt: "2021-03-18T14:00:00.000Z",
			email: "foo@example.org",
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "password",
			custom: { type: { typeId: "type", id: "" }, fields: {} },
			stores: [],
		});
	});

	test("Get me", async () => {
		const response = await ctMock.app.inject({ method: "GET", url: "/dummy/me" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			id: "123",
			createdAt: "2021-03-18T14:00:00.000Z",
			version: 2,
			lastModifiedAt: "2021-03-18T14:00:00.000Z",
			email: "foo@example.org",
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "password",
			custom: {
				fields: {},
				type: {
					id: "",
					typeId: "type",
				},
			},
			stores: [],
		});
	});

	test("Delete me", async () => {
		const response = await ctMock.app.inject({ method: "DELETE", url: "/dummy/me" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			id: "123",
			createdAt: "2021-03-18T14:00:00.000Z",
			version: 2,
			lastModifiedAt: "2021-03-18T14:00:00.000Z",
			email: "foo@example.org",
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "password",
			custom: {
				fields: {},
				type: {
					id: "",
					typeId: "type",
				},
			},
			stores: [],
		});

		const newResponse = await ctMock.app.inject({ method: "GET", url: "/dummy/me" });
		expect(newResponse.statusCode).toBe(404);
	});

	test("Change my password", async () => {
		const customer: Customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
			stores: [],
		};
		ctMock.project("dummy").unsafeAdd("customer", customer);

		const draft: CustomerChangePassword = {
			id: customer.id,
			version: customer.version,
			newPassword: "newP4ssw0rd",
			currentPassword: "p4ssw0rd",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/password",
			payload: draft,
		});

		expect(response.statusCode).toBe(200);
	});

	test("Fail to change password", async () => {
		const draft: CustomerChangePassword = {
			id: "foo",
			version: 1,
			newPassword: "newP4ssw0rd",
			currentPassword: "p4ssw0rd",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/password",
			payload: draft,
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			message: "Account with the given credentials not found.",
			statusCode: 400,
			errors: [
				{
					code: "InvalidCurrentPassword",
					message: "Account with the given credentials not found.",
				},
			],
		});
	});

	test("reset password flow", async () => {
		const customer: Customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
			stores: [],
		};
		ctMock.project("dummy").unsafeAdd("customer", customer);

		const tokenResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customers/password-token",
			payload: {
				email: "user@example.com",
			},
		});
		const token = tokenResponse.json() as CustomerToken;

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/password/reset",
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
			url: "/dummy/me/password/reset",
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

	test("verify email flow", async () => {
		const customer: Customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: false,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
			stores: [],
		};
		ctMock.project("dummy").unsafeAdd("customer", customer);

		const tokenResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customers/email-token",
			payload: {
				id: "customer-uuid",
			},
		});
		const token = tokenResponse.json() as CustomerToken;

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/email/confirm",
			payload: {
				tokenValue: token.value,
			},
		});
		expect(response.statusCode).toBe(200);
	});

	test("fail verify email flow", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/email/confirm",
			payload: {
				tokenValue: "invalid-token",
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

	test("setCustomField", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me",
			payload: {
				version: 2,
				actions: [{ action: "setCustomField", name: "foobar", value: true }],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().version).toBe(3);
		expect(response.json().custom.fields.foobar).toBe(true);
	});

	test("deleteMe", async () => {
		const response = await ctMock.app.inject({ method: "DELETE", url: "/dummy/me" });
		expect(response.statusCode).toBe(200);
		expect(response.json().id).toBeDefined();
	});

	test("signIn with invalid credentials", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/me/login",
			payload: {
				email: "nonexistent@example.com",
				password: "wrongpassword",
			},
		});

		expect(response.statusCode).toBe(400);
		expect(response.json()).toEqual({
			message: "Account with the given credentials not found.",
			errors: [
				{
					code: "InvalidCredentials",
					message: "Account with the given credentials not found.",
				},
			],
		});
	});
});
