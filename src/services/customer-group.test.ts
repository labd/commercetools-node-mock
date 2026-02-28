import type { CustomerGroupDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("CustomerGroup", () => {
	test("Create customer group", async () => {
		const draft: CustomerGroupDraft = {
			key: "premium-customers",
			groupName: "Premium Customers",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customer-groups",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			key: "premium-customers",
			lastModifiedAt: expect.anything(),
			name: "Premium Customers",
			version: 1,
		});
	});

	test("Get customer group", async () => {
		const draft: CustomerGroupDraft = {
			key: "test-group",
			groupName: "Test Group",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customer-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/customer-groups/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get customer group by key", async () => {
		const draft: CustomerGroupDraft = {
			key: "key-group",
			groupName: "Key Group",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customer-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/customer-groups/key=key-group",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query customer groups", async () => {
		const draft: CustomerGroupDraft = {
			key: "query-group",
			groupName: "Query Group",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/customer-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/customer-groups",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});
});
