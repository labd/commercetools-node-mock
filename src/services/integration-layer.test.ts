import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const json = (method: string, url: string, payload?: unknown) => ({
	method: method as "GET" | "PUT" | "PATCH" | "DELETE",
	url,
	payload: payload as object,
});

describe("Integration Layer management API", () => {
	test("Session defaults are checked against nothing until the Project has values", async () => {
		const ctMock = new CommercetoolsMock();
		const before = await ctMock.app.inject(json("GET", "/dummy/main/settings"));
		expect(before.json().presentment).toBeUndefined();

		await ctMock.app.inject({
			method: "POST",
			url: "/dummy",
			payload: {
				version: 1,
				actions: [
					{ action: "changeLanguages", languages: ["nl-NL", "en-US"] },
					{ action: "changeCurrencies", currencies: ["EUR"] },
					{ action: "changeCountries", countries: ["NL", "BE"] },
				],
			},
		});
		const put = await ctMock.app.inject(
			json("PUT", "/dummy/main/settings", {
				label: "Shop",
				language: "nl-NL",
				currency: "EUR",
				country: "NL",
			}),
		);
		expect(put.statusCode).toBe(200);

		const view = (
			await ctMock.app.inject(json("GET", "/dummy/main/settings"))
		).json();
		expect(view.project).toMatchObject({ label: "Shop", country: "NL" });
		expect(view.presentment).toEqual({
			languages: ["nl-NL", "en-US"],
			countries: ["NL", "BE"],
			currencies: ["EUR"],
		});
		expect(view.version).toBe(2);
	});

	test("Every session default is required", async () => {
		const ctMock = new CommercetoolsMock();
		const put = await ctMock.app.inject(
			json("PUT", "/dummy/main/settings", { label: "Shop" }),
		);
		expect(put.statusCode).toBe(400);
		expect(put.json().error).toContain("required");
	});

	test("Checkout rules are part of the settings", async () => {
		const ctMock = new CommercetoolsMock();
		const rules = [{ applicationKey: "shop", mode: "COMPLETE" }];
		await ctMock.app.inject(json("PUT", "/dummy/main/checkout", { rules }));
		const view = (
			await ctMock.app.inject(json("GET", "/dummy/main/settings"))
		).json();
		expect(view.project.checkout).toEqual({ rules });

		const empty = await ctMock.app.inject(
			json("PUT", "/dummy/main/checkout", { rules: [] }),
		);
		expect(empty.statusCode).toBe(400);
	});

	test("Fields that can be hidden come from the Types and Product Types", async () => {
		const ctMock = new CommercetoolsMock();
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/types",
			payload: {
				key: "order-extra",
				name: { en: "Order extra" },
				resourceTypeIds: ["order"],
				fieldDefinitions: [
					{
						name: "costPrice",
						label: { en: "Cost price" },
						required: false,
						type: { name: "Money" },
					},
				],
			},
		});
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/product-types",
			payload: {
				key: "chair",
				name: "Chair",
				description: "Chair",
				attributes: [
					{
						name: "supplierCode",
						label: { en: "Supplier code" },
						isRequired: false,
						type: { name: "text" },
					},
				],
			},
		});

		const put = await ctMock.app.inject(
			json("PUT", "/dummy/main/schema/visibility", [
				{ space: "attribute", typeKey: "chair", fieldName: "supplierCode" },
				{ space: "customField", typeKey: "gone", fieldName: "nothing" },
			]),
		);
		expect(put.json()).toMatchObject({ publishPending: false });

		const view = (
			await ctMock.app.inject(json("GET", "/dummy/main/schema/visibility"))
		).json();
		expect(view.fields).toEqual([
			{
				coordinate: {
					space: "customField",
					typeKey: "order-extra",
					fieldName: "costPrice",
				},
				fieldType: "Money",
				active: false,
			},
			{
				coordinate: {
					space: "attribute",
					typeKey: "chair",
					fieldName: "supplierCode",
				},
				fieldType: "text",
				active: true,
			},
			{
				coordinate: {
					space: "customField",
					typeKey: "gone",
					fieldName: "nothing",
				},
				active: false,
				reason: "noSuchField",
			},
		]);
	});

	test("The IdP login keeps its client secret", async () => {
		const ctMock = new CommercetoolsMock();
		const idp = {
			issuer: "https://login.example.com",
			tokenEndpoint: "https://login.example.com/token",
			revocationEndpoint: "https://login.example.com/revoke",
			jwksUri: "https://login.example.com/jwks",
			clientId: "storefront",
			redirectUri: "https://shop.example.com/callback",
			matchStrategy: "email",
			claims: {
				externalId: "sub",
				email: "email",
				firstName: "given_name",
				lastName: "family_name",
				phone: "phone_number",
			},
		};
		expect(
			(await ctMock.app.inject(json("GET", "/dummy/main/idp"))).statusCode,
		).toBe(404);
		expect(
			(await ctMock.app.inject(json("PUT", "/dummy/main/idp", idp))).statusCode,
		).toBe(400);

		const created = await ctMock.app.inject(
			json("PUT", "/dummy/main/idp", { ...idp, clientSecret: "s3cret" }),
		);
		expect(created.json()).toMatchObject({ hasClientSecret: true });
		expect(created.json().clientSecret).toBeUndefined();

		// Without a secret the stored one is kept.
		const updated = await ctMock.app.inject(
			json("PUT", "/dummy/main/idp", { ...idp, clientId: "storefront-2" }),
		);
		expect(updated.statusCode).toBe(200);

		const deleted = await ctMock.app.inject(json("DELETE", "/dummy/main/idp"));
		expect(deleted.statusCode).toBe(204);
		expect(
			(await ctMock.app.inject(json("GET", "/dummy/main/idp"))).statusCode,
		).toBe(404);
	});

	test("Config entries keep secrets out of reads", async () => {
		const ctMock = new CommercetoolsMock();
		await ctMock.app.inject(
			json("PATCH", "/dummy/main/extension/config", {
				entries: [
					{ key: "EVOLVE_LOCALE", value: "en-GB" },
					{ key: "ALGOLIA_SEARCH_API_KEY", value: "search-key", secret: true },
				],
			}),
		);
		const read = (
			await ctMock.app.inject(json("GET", "/dummy/main/extension/config"))
		).json();
		expect(read.entries).toEqual([
			{ key: "EVOLVE_LOCALE", value: "en-GB", secret: false },
			{ key: "ALGOLIA_SEARCH_API_KEY", value: null, secret: true },
		]);

		const removed = await ctMock.app.inject(
			json("PATCH", "/dummy/main/extension/config", {
				entries: [{ key: "EVOLVE_LOCALE", value: null }],
			}),
		);
		expect(removed.json().entries).toHaveLength(1);
	});

	test("The allowlist is stored in lowercase, once each", async () => {
		const ctMock = new CommercetoolsMock();
		const put = await ctMock.app.inject(
			json("PUT", "/dummy/main/extension/allowlist", [
				"CDN.contentful.com",
				"cdn.contentful.com",
				"*.algolia.net",
			]),
		);
		expect(put.json().allow).toEqual(["cdn.contentful.com", "*.algolia.net"]);
		const read = (
			await ctMock.app.inject(json("GET", "/dummy/main/extension/allowlist"))
		).json();
		expect(read.deny).toEqual(["*.commercetools.app"]);
	});

	test("clear() forgets the Integration Layer too", async () => {
		const ctMock = new CommercetoolsMock();
		await ctMock.app.inject(
			json("PUT", "/dummy/main/extension/allowlist", ["cdn.contentful.com"]),
		);
		await ctMock.clear();
		const read = (
			await ctMock.app.inject(json("GET", "/dummy/main/extension/allowlist"))
		).json();
		expect(read.allow).toEqual([]);
	});
});

describe("Integration Layer host", () => {
	const mswServer = setupServer();
	beforeAll(() => mswServer.listen({ onUnhandledFrame: "error" }));
	afterAll(() => mswServer.close());

	test("Is served on extensions.integration-layer, with PUT and PATCH", async () => {
		const ctMock = new CommercetoolsMock();
		ctMock.registerHandlers(mswServer);
		const base =
			"https://extensions.integration-layer.europe-west1.gcp.commercetools.com/dummy/main";
		const put = await fetch(`${base}/extension/allowlist`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(["cdn.contentful.com"]),
		});
		expect(put.status).toBe(200);
		const patch = await fetch(`${base}/extension/config`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ entries: [{ key: "A", value: "1" }] }),
		});
		expect((await patch.json()).entries).toEqual([
			{ key: "A", value: "1", secret: false },
		]);
	});
});
