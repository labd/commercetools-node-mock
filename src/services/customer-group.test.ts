import type { CustomerGroupDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("CustomerGroup", () => {
	test("Create customer group", async () => {
		const draft: CustomerGroupDraft = {
			key: "premium-customers",
			groupName: "Premium Customers",
		};
		const response = await supertest(ctMock.app)
			.post("/dummy/customer-groups")
			.send(draft);

		expect(response.status).toBe(201);

		expect(response.body).toEqual({
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
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/customer-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/customer-groups/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Get customer group by key", async () => {
		const draft: CustomerGroupDraft = {
			key: "key-group",
			groupName: "Key Group",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/customer-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/customer-groups/key=key-group",
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Query customer groups", async () => {
		const draft: CustomerGroupDraft = {
			key: "query-group",
			groupName: "Query Group",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/customer-groups")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get("/dummy/customer-groups");

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThan(0);
		expect(response.body.results).toContainEqual(createResponse.body);
	});
});
