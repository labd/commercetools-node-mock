import type { DiscountGroupDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
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
		const response = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/discount-groups/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Get discount group by key", async () => {
		const draft: DiscountGroupDraft = {
			key: "key-discount-group",
			name: {
				"en-GB": "Key Discount Group",
			},
			sortOrder: "0.2",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/discount-groups/key=key-discount-group",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query discount groups", async () => {
		const draft: DiscountGroupDraft = {
			key: "query-discount-group",
			name: {
				"en-GB": "Query Discount Group",
			},
			sortOrder: "0.3",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/discount-groups");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});

	test("Update discount group - setName", async () => {
		const draft: DiscountGroupDraft = {
			key: "update-name-group",
			name: {
				"en-GB": "Original Name",
			},
			sortOrder: "0.4",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/discount-groups/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setName",
						name: {
							"en-GB": "Updated Name",
							de: "Aktualisierter Name",
						},
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.name).toEqual({
			"en-GB": "Updated Name",
			de: "Aktualisierter Name",
		});
		expect(updateResponse.body.version).toBe(2);
	});

	test("Update discount group - setDescription", async () => {
		const draft: DiscountGroupDraft = {
			key: "update-description-group",
			name: {
				"en-GB": "Test Group",
			},
			sortOrder: "0.5",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/discount-groups/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setDescription",
						description: {
							"en-GB": "New description",
							de: "Neue Beschreibung",
						},
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.description).toEqual({
			"en-GB": "New description",
			de: "Neue Beschreibung",
		});
		expect(updateResponse.body.version).toBe(2);
	});

	test("Update discount group - setKey", async () => {
		const draft: DiscountGroupDraft = {
			key: "original-key",
			name: {
				"en-GB": "Test Group",
			},
			sortOrder: "0.6",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/discount-groups/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setKey",
						key: "updated-key",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.key).toBe("updated-key");
		expect(updateResponse.body.version).toBe(2);
	});

	test("Update discount group - setSortOrder", async () => {
		const draft: DiscountGroupDraft = {
			key: "sort-order-group",
			name: {
				"en-GB": "Sort Order Group",
			},
			sortOrder: "0.1",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/discount-groups/${createResponse.body.id}`)
			.send({
				version: createResponse.body.version,
				actions: [
					{
						action: "setSortOrder",
						sortOrder: "0.9",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.sortOrder).toBe("0.9");
		expect(updateResponse.body.version).toBe(2);
	});

	test("Delete discount group", async () => {
		const draft: DiscountGroupDraft = {
			key: "delete-group",
			name: {
				"en-GB": "Delete Group",
			},
			sortOrder: "0.7",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/discount-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const deleteResponse = await supertest(ctMock.app)
			.delete(`/dummy/discount-groups/${createResponse.body.id}`)
			.query({ version: createResponse.body.version });

		expect(deleteResponse.status).toBe(200);
		expect(deleteResponse.body).toEqual(createResponse.body);

		const getResponse = await supertest(ctMock.app).get(
			`/dummy/discount-groups/${createResponse.body.id}`,
		);

		expect(getResponse.status).toBe(404);
	});
});
