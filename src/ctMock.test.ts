import { test } from "vitest";
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
