import type { CommercetoolsMock } from "#src/ctMock.ts";

export type CustomerSession = {
	token: string;
	headers: { authorization: string };
};

/**
 * Issues a token for a customer that already exists, without going through the
 * password flow. Handy for tests that seed a customer directly.
 */
export const customerSession = (
	m: CommercetoolsMock,
	customerId: string,
	{ projectKey = "dummy" }: { projectKey?: string } = {},
): CustomerSession => {
	const token = m.authStore().getCustomerToken(projectKey, customerId, "");
	return {
		token: token.access_token,
		headers: { authorization: `Bearer ${token.access_token}` },
	};
};

/**
 * Signs a customer in and returns the token, plus the header to send it with.
 *
 * The `/me` endpoints answer for the customer a token was issued to, so a test
 * that exercises them needs one. Works whether or not `enableAuthentication` is
 * on: the mock resolves the identity from any token it issued.
 */
export const loginCustomer = async (
	m: CommercetoolsMock,
	{
		email,
		password,
		projectKey = "dummy",
	}: { email: string; password: string; projectKey?: string },
): Promise<CustomerSession> => {
	const response = await m.app.inject({
		method: "POST",
		url: `/oauth/${projectKey}/customers/token`,
		headers: {
			authorization: `Basic ${Buffer.from("client:secret").toString("base64")}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		payload: new URLSearchParams({
			grant_type: "password",
			username: email,
			password,
		}).toString(),
	});

	if (response.statusCode !== 200) {
		throw new Error(`Could not sign in ${email}: ${response.body}`);
	}

	const token = response.json().access_token;
	return { token, headers: { authorization: `Bearer ${token}` } };
};

/**
 * Starts an anonymous session and returns its token.
 */
export const anonymousSession = async (
	m: CommercetoolsMock,
	{
		anonymousId,
		projectKey = "dummy",
	}: { anonymousId?: string; projectKey?: string } = {},
): Promise<CustomerSession> => {
	const response = await m.app.inject({
		method: "POST",
		url: `/oauth/${projectKey}/anonymous/token`,
		headers: {
			authorization: `Basic ${Buffer.from("client:secret").toString("base64")}`,
			"content-type": "application/x-www-form-urlencoded",
		},
		payload: new URLSearchParams({
			grant_type: "client_credentials",
			...(anonymousId ? { anonymous_id: anonymousId } : {}),
		}).toString(),
	});

	if (response.statusCode !== 200) {
		throw new Error(`Could not start an anonymous session: ${response.body}`);
	}

	const token = response.json().access_token;
	return { token, headers: { authorization: `Bearer ${token}` } };
};
