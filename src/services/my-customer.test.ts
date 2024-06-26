import type {
	CustomerChangePassword,
	CustomerToken,
	MyCustomerDraft,
} from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsMock, getBaseResourceProperties } from "../index";
import { hashPassword } from "../lib/password";

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

		const response = await supertest(ctMock.app)
			.post("/dummy/me/signup")
			.send(draft);

		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			customer: {
				...draft,
				password: "cDRzc3cwcmQ=",
				authenticationMode: "Password",
				version: 1,
				isEmailVerified: false,
				addresses: [],
				id: expect.anything(),
				createdAt: expect.anything(),
				lastModifiedAt: expect.anything(),
			},
		});
	});

	test("Get me", async () => {
		const draft: MyCustomerDraft = {
			email: "test@example.org",
			password: "p4ssw0rd",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/me/signup")
			.send(draft);

		const response = await supertest(ctMock.app).get(`/dummy/me`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body.customer);
	});
});

describe("/me", () => {
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
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "password",
			custom: { type: { typeId: "type", id: "" }, fields: {} },
		});
	});

	test("Get me", async () => {
		const response = await supertest(ctMock.app).get("/dummy/me");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
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
		});
	});

	test("Delete me", async () => {
		const response = await supertest(ctMock.app).delete("/dummy/me");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
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
		});

		const newResponse = await supertest(ctMock.app).get("/dummy/me");
		expect(newResponse.status).toBe(404);
	});

	test("Change my password", async () => {
		const customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
		};
		ctMock.project("dummy").add("customer", customer);

		const draft: CustomerChangePassword = {
			id: customer.id,
			version: customer.version,
			newPassword: "newP4ssw0rd",
			currentPassword: "p4ssw0rd",
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/me/password")
			.send(draft);

		expect(response.status).toBe(200);
	});

	test("Fail to change password", async () => {
		const draft: CustomerChangePassword = {
			id: "foo",
			version: 1,
			newPassword: "newP4ssw0rd",
			currentPassword: "p4ssw0rd",
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/me/password")
			.send(draft);

		expect(response.status).toBe(400);
		expect(response.body).toEqual({
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
		const customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
		};
		ctMock.project("dummy").add("customer", customer);

		const token = await supertest(ctMock.app)
			.post("/dummy/customers/password-token")
			.send({
				email: "user@example.com",
			})
			.then((response) => response.body as CustomerToken);

		const response = await supertest(ctMock.app)
			.post("/dummy/me/password/reset")
			.send({
				tokenValue: token.value,
				newPassword: "somethingNew",
			});
		expect(response.status).toBe(200);
	});

	test("fail reset password flow", async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/me/password/reset")
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

	test("verify email flow", async () => {
		const customer = {
			...getBaseResourceProperties(),
			id: "customer-uuid",
			email: "user@example.com",
			password: hashPassword("p4ssw0rd"),
			addresses: [],
			isEmailVerified: true,
			authenticationMode: "Password", //default in Commercetools
			version: 1,
		};
		ctMock.project("dummy").add("customer", customer);

		const token = await supertest(ctMock.app)
			.post("/dummy/customers/email-token")
			.send({
				id: "customer-uuid",
			})
			.then((response) => response.body as CustomerToken);

		const response = await supertest(ctMock.app)
			.post("/dummy/me/email/confirm")
			.send({
				tokenValue: token.value,
			});
		expect(response.status).toBe(200);
	});

	test("fail verify email flow", async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/me/email/confirm")
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

	test("setCustomField", async () => {
		const response = await supertest(ctMock.app)
			.post(`/dummy/me`)
			.send({
				version: 2,
				actions: [{ action: "setCustomField", name: "foobar", value: true }],
			});
		expect(response.status).toBe(200);
		expect(response.body.version).toBe(3);
		expect(response.body.custom.fields.foobar).toBe(true);
	});
});
