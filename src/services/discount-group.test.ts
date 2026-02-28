import type { DiscountGroupDraft } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("DiscountGroup", () => {
	test("Create discount group", async () => {
		const draft: DiscountGroupDraft = {
			key: "premium-discount-group",
			name: {
				"en-GB": "Premium Discount Group",
			},
			description: {
				"en-GB": "A discount group for premium customers",
			},
			sortOrder: "0.5",
		};
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);

		expect(response.json()).toEqual({
			createdAt: expect.anything(),
			id: expect.anything(),
			key: "premium-discount-group",
			isActive: true,
			lastModifiedAt: expect.anything(),
			name: {
				"en-GB": "Premium Discount Group",
			},
			description: {
				"en-GB": "A discount group for premium customers",
			},
			sortOrder: "0.5",
			version: 1,
		});
	});

	test("Get discount group", async () => {
		const draft: DiscountGroupDraft = {
			key: "test-discount-group",
			name: {
				"en-GB": "Test Discount Group",
			},
			sortOrder: "0.1",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/discount-groups/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get discount group by key", async () => {
		const draft: DiscountGroupDraft = {
			key: "key-discount-group",
			name: {
				"en-GB": "Key Discount Group",
			},
			sortOrder: "0.2",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/discount-groups/key=key-discount-group",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Query discount groups", async () => {
		const draft: DiscountGroupDraft = {
			key: "query-discount-group",
			name: {
				"en-GB": "Query Discount Group",
			},
			sortOrder: "0.3",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/discount-groups",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(createResponse.json());
	});

	test("Update discount group - setName", async () => {
		const draft: DiscountGroupDraft = {
			key: "update-name-group",
			name: {
				"en-GB": "Original Name",
			},
			sortOrder: "0.4",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setName",
						name: {
							"en-GB": "Updated Name",
							de: "Aktualisierter Name",
						},
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().name).toEqual({
			"en-GB": "Updated Name",
			de: "Aktualisierter Name",
		});
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update discount group - setDescription", async () => {
		const draft: DiscountGroupDraft = {
			key: "update-description-group",
			name: {
				"en-GB": "Test Group",
			},
			sortOrder: "0.5",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setDescription",
						description: {
							"en-GB": "New description",
							de: "Neue Beschreibung",
						},
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().description).toEqual({
			"en-GB": "New description",
			de: "Neue Beschreibung",
		});
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update discount group - setKey", async () => {
		const draft: DiscountGroupDraft = {
			key: "original-key",
			name: {
				"en-GB": "Test Group",
			},
			sortOrder: "0.6",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setKey",
						key: "updated-key",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().key).toBe("updated-key");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Update discount group - setSortOrder", async () => {
		const draft: DiscountGroupDraft = {
			key: "sort-order-group",
			name: {
				"en-GB": "Sort Order Group",
			},
			sortOrder: "0.1",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${createResponse.json().id}`,
			payload: {
				version: createResponse.json().version,
				actions: [
					{
						action: "setSortOrder",
						sortOrder: "0.9",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().sortOrder).toBe("0.9");
		expect(updateResponse.json().version).toBe(2);
	});

	test("Delete discount group", async () => {
		const draft: DiscountGroupDraft = {
			key: "delete-group",
			name: {
				"en-GB": "Delete Group",
			},
			sortOrder: "0.7",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/discount-groups/${createResponse.json().id}?version=${createResponse.json().version}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(createResponse.json());

		const getResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/discount-groups/${createResponse.json().id}`,
		});

		expect(getResponse.statusCode).toBe(404);
	});
});
