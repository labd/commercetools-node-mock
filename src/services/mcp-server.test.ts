import { afterEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

const draft = {
	key: "storefront-assistant",
	name: { en: "Storefront assistant" },
	mcpServer: {
		type: "CommerceMCP",
		majorVersion: "v1",
		tools: ["read_products", "read_categories"],
	},
};

describe("MCP Servers", () => {
	afterEach(async () => {
		await ctMock.clear();
	});

	test("create with defaults and a URL", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/mcp-servers",
			payload: draft,
		});
		expect(response.statusCode).toBe(201);
		const server = response.json();
		expect(server).toMatchObject({
			key: "storefront-assistant",
			version: 1,
			authenticationMode: "ClientCredentials",
			state: "Disabled",
			mcpServer: {
				type: "CommerceMCP",
				majorVersion: "v1",
				tools: ["read_products", "read_categories"],
				toolCustomizations: [],
			},
		});
		expect(server.mcpServer.url).toContain(server.id);
	});

	test("reject a draft without a configuration", async () => {
		const strict = new CommercetoolsMock({ strict: true });
		const response = await strict.app.inject({
			method: "POST",
			url: "/dummy/mcp-servers",
			payload: { key: "incomplete" },
		});
		expect(response.statusCode).toBe(400);
	});

	test("get by key, update and delete", async () => {
		await ctMock.app.inject({
			method: "POST",
			url: "/dummy/mcp-servers",
			payload: draft,
		});
		const byKey = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/mcp-servers/key=storefront-assistant",
		});
		expect(byKey.statusCode).toBe(200);

		const updated = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/mcp-servers/${byKey.json().id}`,
			payload: {
				version: 1,
				actions: [
					{ action: "setState", state: "Enabled" },
					{ action: "setTools", tools: ["read_products"] },
					{ action: "addTool", tool: "read_orders" },
					{
						action: "setToolCustomizations",
						toolCustomizations: [
							{ tool: "read_products", description: "Products in the catalog" },
						],
					},
					{
						action: "setJsonOutputFiltering",
						jsonOutputFiltering: { drop: { fieldNames: ["password"] } },
					},
					{
						action: "setToolOutputFormatting",
						toolOutputFormatting: "JsonToTabular",
					},
				],
			},
		});
		expect(updated.statusCode).toBe(200);
		expect(updated.json()).toMatchObject({
			state: "Enabled",
			mcpServer: {
				tools: ["read_products", "read_orders"],
				toolCustomizations: [
					{ tool: "read_products", description: "Products in the catalog" },
				],
				jsonOutputFiltering: { drop: { fieldNames: ["password"] } },
				toolOutputFormatting: "JsonToTabular",
			},
		});

		const deleted = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/mcp-servers/${byKey.json().id}?version=${updated.json().version}`,
		});
		expect(deleted.statusCode).toBe(200);
	});
});
