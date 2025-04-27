import type { InvalidTokenError } from "@commercetools/platform-sdk";
import { setupServer } from "msw/node";
import { afterEach, beforeAll, expect, test } from "vitest";
import { CommercetoolsMock } from "./index";

const mswServer = setupServer();

beforeAll(() => {
	mswServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
	mswServer.resetHandlers();
});

test("node:fetch client", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
		apiHost: "https://localhost",
		authHost: "https://localhost:8080",
	});
	ctMock.registerHandlers(mswServer);

	const authHeader = `Basic ${Buffer.from("foo:bar").toString("base64")}`;
	let response = await fetch("https://localhost:8080/oauth/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: authHeader,
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

test("fetch client", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
		apiHost: "https://localhost",
		authHost: "https://localhost:8080",
	});
	ctMock.registerHandlers(mswServer);
	const params = new URLSearchParams({
		grant_type: "client_credentials",
		scope: "manage_project:commercetools-node-mock",
	});

	const authHeader = `Basic ${Buffer.from("foo:bar").toString("base64")}`;
	let response = await fetch(`https://localhost:8080/oauth/token?${params}`, {
		method: "POST",
		headers: {
			Authorization: authHeader,
		},
	});

	const authBody = await response.json();
	expect(response.status).toBe(200);

	const token = authBody.access_token;
	expect(authBody.access_token).toBeDefined();

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

test("Options.validateCredentials: true (error)", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
	});
	ctMock.registerHandlers(mswServer);

	const response = await fetch(
		"https://api.europe-west1.gcp.commercetools.com/my-project/orders",
		{
			headers: {
				Authorization: "Bearer foobar",
			},
		},
	);

	const body = (await response.json()) as InvalidTokenError;
	expect(response.status).toBe(401);
	expect(body.message).toBe("invalid_token");
});

test("Options.validateCredentials: false", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: false,
	});
	ctMock.registerHandlers(mswServer);

	const response = await fetch(
		"https://api.europe-west1.gcp.commercetools.com/my-project/orders",
		{
			headers: {
				Authorization: "Bearer foobar",
			},
		},
	);

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

test("Options.enableAuthentication: false", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
	});
	ctMock.registerHandlers(mswServer);

	const response = await fetch(
		"https://api.europe-west1.gcp.commercetools.com/my-project/orders",
	);

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

test("Options.apiHost: is overridden is set", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
		apiHost: "http://api.localhost",
	});
	ctMock.registerHandlers(mswServer);

	const response = await fetch("http://api.localhost/my-project/orders");

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

test("Options.authHost: is set", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
		authHost: "http://auth.localhost",
	});
	ctMock.registerHandlers(mswServer);
	const params = new URLSearchParams({
		grant_type: "client_credentials",
		scope: "manage_project:commercetools-node-mock",
	});

	const authHeader = `Basic ${Buffer.from("foo:bar").toString("base64")}`;
	const response = await fetch(`http://auth.localhost/oauth/token?${params}`, {
		method: "POST",
		headers: {
			Authorization: authHeader,
		},
	});

	const authBody = await response.json();
	expect(response.status).toBe(200);

	const token = authBody.access_token;
	expect(token).toBeDefined();
});

test("apiHost mock proxy: querystring", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
		apiHost: "http://api.localhost",
	});
	ctMock.registerHandlers(mswServer);

	const queryParams = new URLSearchParams({
		where: 'orderNumber="foobar"',
		expand: "custom.type",
	});

	const response = await fetch(
		`http://api.localhost/my-project/orders?${queryParams}`,
	);

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
