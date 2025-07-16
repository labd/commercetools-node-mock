import type { BusinessUnitDraft } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const ctMock = new CommercetoolsMock();

describe("MyBusinessUnit", () => {
	test("Get my business units", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/business-units")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			"/dummy/me/business-units/",
		);

		expect(response.status).toBe(200);
		expect(response.body.count).toBeGreaterThanOrEqual(0);
		expect(response.body.results).toBeDefined();
	});

	test("Get my business unit by ID", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/business-units")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const response = await supertest(ctMock.app).get(
			`/dummy/me/business-units/${createResponse.body.id}`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual(createResponse.body);
	});

	test("Delete my business unit", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/business-units")
			.send(draft);

		expect(createResponse.status).toBe(201);

		// Now delete the business unit
		const deleteResponse = await supertest(ctMock.app).delete(
			`/dummy/me/business-units/${createResponse.body.id}`,
		);

		expect(deleteResponse.status).toBe(200);
		expect(deleteResponse.body).toEqual(createResponse.body);

		// Verify that the business unit is deleted
		const newResponse = await supertest(ctMock.app).get(
			`/dummy/me/business-units/${createResponse.body.id}`,
		);
		expect(newResponse.status).toBe(404);
	});

	test("Update my business unit", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await supertest(ctMock.app)
			.post("/dummy/business-units")
			.send(draft);

		expect(createResponse.status).toBe(201);

		const updateResponse = await supertest(ctMock.app)
			.post(`/dummy/me/business-units/${createResponse.body.id}`)
			.send({
				id: createResponse.body.id,
				version: createResponse.body.version,
				actions: [
					{
						action: "changeName",
						name: "Updated Business Unit Name",
					},
				],
			});

		expect(updateResponse.status).toBe(200);
		expect(updateResponse.body.name).toBe("Updated Business Unit Name");
	});
});
