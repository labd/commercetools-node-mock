import { describe, expect, test } from "vitest";
import { customerGroupDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("CustomerGroup", () => {
	const customerGroupDraft = customerGroupDraftFactory(ctMock);

	test("Create customer group", async () => {
		const draft = customerGroupDraft.build({
			key: "premium-customers",
			groupName: "Premium Customers",
		});

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
		const customerGroup = await customerGroupDraft.create({
			key: "test-group",
			groupName: "Test Group",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/customer-groups/${customerGroup.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(customerGroup);
	});

	test("Get customer group by key", async () => {
		const customerGroup = await customerGroupDraft.create({
			key: "key-group",
			groupName: "Key Group",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/customer-groups/key=key-group",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(customerGroup);
	});

	test("Query customer groups", async () => {
		const customerGroup = await customerGroupDraft.create({
			key: "query-group",
			groupName: "Query Group",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/customer-groups",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(customerGroup);
	});
});
