import { describe, expect, test } from "vitest";
import { discountGroupDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("DiscountGroup", () => {
	const discountGroupDraft = discountGroupDraftFactory(ctMock);

	test("Create discount group", async () => {
		const draft = discountGroupDraft.build({
			key: "premium-discount-group",
			name: {
				"en-GB": "Premium Discount Group",
			},
			description: {
				"en-GB": "A discount group for premium customers",
			},
			sortOrder: "0.5",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/discount-groups",
			payload: draft,
		});

		expect(response.statusCode).toBe(201);
		expect(response.json()).toEqual(
			expect.objectContaining({
				key: "premium-discount-group",
				isActive: true,
				name: expect.objectContaining({
					"en-GB": "Premium Discount Group",
				}),
				description: {
					"en-GB": "A discount group for premium customers",
				},
				sortOrder: "0.5",
				version: 1,
			}),
		);
	});

	test("Get discount group", async () => {
		const discountGroup = await discountGroupDraft.create({
			key: "test-discount-group",
			name: {
				"en-GB": "Test Discount Group",
			},
			sortOrder: "0.1",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/discount-groups/${discountGroup.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(discountGroup);
	});

	test("Get discount group by key", async () => {
		const discountGroup = await discountGroupDraft.create({
			key: "key-discount-group",
			name: {
				"en-GB": "Key Discount Group",
			},
			sortOrder: "0.2",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/discount-groups/key=key-discount-group",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(discountGroup);
	});

	test("Query discount groups", async () => {
		const discountGroup = await discountGroupDraft.create({
			key: "query-discount-group",
			name: {
				"en-GB": "Query Discount Group",
			},
			sortOrder: "0.3",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/discount-groups",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThan(0);
		expect(response.json().results).toContainEqual(discountGroup);
	});

	test("Update discount group - setName", async () => {
		const discountGroup = await discountGroupDraft.create({
			key: "update-name-group",
			name: {
				"en-GB": "Original Name",
			},
			sortOrder: "0.4",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${discountGroup.id}`,
			payload: {
				version: discountGroup.version,
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
		const discountGroup = await discountGroupDraft.create({
			key: "update-description-group",
			name: {
				"en-GB": "Test Group",
			},
			sortOrder: "0.5",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${discountGroup.id}`,
			payload: {
				version: discountGroup.version,
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
		const discountGroup = await discountGroupDraft.create({
			key: "original-key",
			name: {
				"en-GB": "Test Group",
			},
			sortOrder: "0.6",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${discountGroup.id}`,
			payload: {
				version: discountGroup.version,
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
		const discountGroup = await discountGroupDraft.create({
			key: "sort-order-group",
			name: {
				"en-GB": "Sort Order Group",
			},
			sortOrder: "0.1",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/discount-groups/${discountGroup.id}`,
			payload: {
				version: discountGroup.version,
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
		const discountGroup = await discountGroupDraft.create({
			key: "delete-group",
			name: {
				"en-GB": "Delete Group",
			},
			sortOrder: "0.7",
		});

		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/discount-groups/${discountGroup.id}?version=${discountGroup.version}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(discountGroup);

		const getResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/discount-groups/${discountGroup.id}`,
		});

		expect(getResponse.statusCode).toBe(404);
	});
});
