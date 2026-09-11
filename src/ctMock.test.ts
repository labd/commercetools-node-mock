import { expect, test } from "vitest";
import { CommercetoolsMock } from "./index.ts";

test("ctMock.authServer", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: false,
		validateCredentials: false,
		apiHost: "http://api.localhost",
	});

	ctMock.authStore().addToken({
		token_type: "Bearer",
		access_token: "foobar",
		expires_in: 172800,
		scope: "my-project",
		refresh_token: "foobar",
	});
});

test("ctMock.clear drops issued tokens", async () => {
	const ctMock = new CommercetoolsMock({
		enableAuthentication: true,
		validateCredentials: true,
	});

	const tokenResponse = await ctMock.app.inject({
		method: "POST",
		url: "/oauth/token",
		headers: {
			authorization: `Basic ${Buffer.from("foo:bar").toString("base64")}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		payload: new URLSearchParams({
			grant_type: "client_credentials",
			scope: "manage_project:dummy",
		}).toString(),
	});
	expect(tokenResponse.statusCode).toBe(200);
	const token = tokenResponse.json().access_token;

	const authorized = () =>
		ctMock.app.inject({
			method: "GET",
			url: "/dummy/orders",
			headers: { authorization: `Bearer ${token}` },
		});

	expect((await authorized()).statusCode).toBe(200);

	await ctMock.clear();

	// The token outlived the resources it was issued against, so it must no
	// longer be accepted.
	expect(ctMock.authStore().tokens).toHaveLength(0);
	expect((await authorized()).statusCode).toBe(401);
});
