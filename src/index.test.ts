import { type InvalidTokenError } from "@commercetools/platform-sdk";
import got from "got";
import { afterEach, expect, test } from "vitest";
import { CommercetoolsMock } from "./index";

let ctMock: CommercetoolsMock;

afterEach(() => {
	ctMock.stop();
});

test("node:fetch client", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
		apiHost: "https://localhost",
		authHost: "https://localhost:8080",
	});
	ctMock.start();

	const authHeader = "Basic " + Buffer.from("foo:bar").toString("base64");
	let response = await fetch("https://localhost:8080/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			"Authorization": authHeader,
		},
		body: new URLSearchParams({
			grant_type: "client_credentials",
			scope: "manage_project:commercetools-node-mock",
		}),
	});

	const authBody = await response.json();
	expect(response.status).toBe(200);

	const token = authBody.access_token;
	response = await fetch("https://localhost/my-project/orders", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});

	const body = await response.json();
	expect(response.status).toBe(200);
	expect(body).toStrictEqual({
		count: 0,
		total: 0,
		offset: 0,
		limit: 20,
		results: [],
	});
});

test("got client", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
		apiHost: "https://localhost",
		authHost: "https://localhost:8080",
	});
	ctMock.start();

	let response = await got.post<{ access_token: string }>(
		"https://localhost:8080/oauth/token",
		{
			searchParams: {
				grant_type: "client_credentials",
				scope: "manage_project:commercetools-node-mock",
			},
			username: "foo",
			password: "bar",
			responseType: "json",
		},
	);
	expect(response.statusCode).toBe(200);

	const token = response.body.access_token;
	expect(response.body.access_token).toBeDefined();
	response = await got.get("https://localhost/my-project/orders", {
		headers: {
			Authorization: `Bearer ${token}`,
		},
		responseType: "json",
	});
	expect(response.statusCode).toBe(200);
	expect(response.body).toStrictEqual({
		count: 0,
		total: 0,
		offset: 0,
		limit: 20,
		results: [],
	});
});

test("Options.validateCredentials: true (error)", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
	});
	ctMock.start();

	const response = await got.get<InvalidTokenError>(
		"https://api.europe-west1.gcp.commercetools.com/my-project/orders",
		{
			headers: {
				Authorization: `Bearer foobar`,
			},
			responseType: "json",
			throwHttpErrors: false,
		},
	);
	expect(response.statusCode).toBe(401);
	expect(response.body.message).toBe("invalid_token");
});

test("Options.validateCredentials: false", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: false,
	});
	ctMock.start();

	const response = await got.get(
		"https://api.europe-west1.gcp.commercetools.com/my-project/orders",
		{
			headers: {
				Authorization: `Bearer foobar`,
			},
			responseType: "json",
		},
	);
	expect(response.statusCode).toBe(200);
	expect(response.body).toStrictEqual({
		count: 0,
		total: 0,
		offset: 0,
		limit: 20,
		results: [],
	});
});

test("Options.enableAuthentication: false", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
	});
	ctMock.start();

	const response = await got.get(
		"https://api.europe-west1.gcp.commercetools.com/my-project/orders",
		{
			responseType: "json",
		},
	);
	expect(response.statusCode).toBe(200);
	expect(response.body).toStrictEqual({
		count: 0,
		total: 0,
		offset: 0,
		limit: 20,
		results: [],
	});
});

test("Options.apiHost: is overridden is set", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
		apiHost: "http://api.localhost",
	});
	ctMock.start();

	const response = await got.get("http://api.localhost/my-project/orders", {
		responseType: "json",
	});
	expect(response.statusCode).toBe(200);
	expect(response.body).toStrictEqual({
		count: 0,
		total: 0,
		offset: 0,
		limit: 20,
		results: [],
	});
});

test("Options.authHost: is set", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
		authHost: "http://auth.localhost",
	});
	ctMock.start();

	const response = await got.post<{ access_token: string }>(
		"http://auth.localhost/oauth/token",
		{
			searchParams: {
				grant_type: "client_credentials",
				scope: "manage_project:commercetools-node-mock",
			},
			username: "foo",
			password: "bar",
			responseType: "json",
		},
	);
	expect(response.statusCode).toBe(200);

	const token = response.body.access_token;
	expect(token).toBeDefined();
});

test("apiHost mock proxy: querystring", async () => {
	ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
		apiHost: "http://api.localhost",
	});
	ctMock.start();

	const response = await got.get("http://api.localhost/my-project/orders", {
		responseType: "json",
		searchParams: {
			where: 'orderNumber="foobar"',
			expand: "custom.type",
		},
	});

	expect(response.statusCode).toBe(200);
	expect(response.body).toStrictEqual({
		count: 0,
		total: 0,
		offset: 0,
		limit: 20,
		results: [],
	});
});
