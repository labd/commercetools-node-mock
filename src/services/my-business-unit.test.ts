import type { BusinessUnitDraft } from "@commercetools/platform-sdk";
import { afterEach, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyBusinessUnit", () => {
	afterEach(() => {
		ctMock.clear();
	});

	test("Get my business units", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/business-units",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThanOrEqual(0);
		expect(response.json().results).toBeDefined();
	});

	test("Get my business unit by ID", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/${createResponse.json().id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Get my business unit by key", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/key=${createResponse.json().key}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(createResponse.json());
	});

	test("Delete my business unit", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		// Now delete the business unit
		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/me/business-units/${createResponse.json().id}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(createResponse.json());

		// Verify that the business unit is deleted
		const newResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/${createResponse.json().id}`,
		});
		expect(newResponse.statusCode).toBe(404);
	});

	test("Delete my business unit by key", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		// Now delete the business unit
		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/me/business-units/key=${createResponse.json().key}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(createResponse.json());

		// Verify that the business unit is deleted
		const newResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/key=${createResponse.json().key}`,
		});
		expect(newResponse.statusCode).toBe(404);
	});

	test("Update my business unit", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/me/business-units/${createResponse.json().id}`,
			payload: {
				id: createResponse.json().id,
				version: createResponse.json().version,
				actions: [
					{
						action: "changeName",
						name: "Updated Business Unit Name",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().name).toBe("Updated Business Unit Name");
	});

	test("Update my business unit by key", async () => {
		// First create a business unit
		const draft: BusinessUnitDraft = {
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		};
		const createResponse = await ctMock.app.inject({
			method: "POST",
			url: "/dummy/business-units",
			payload: draft,
		});

		expect(createResponse.statusCode).toBe(201);

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/me/business-units/key=${createResponse.json().key}`,
			payload: {
				id: createResponse.json().id,
				version: createResponse.json().version,
				actions: [
					{
						action: "changeName",
						name: "Updated Business Unit Name",
					},
				],
			},
		});

		expect(updateResponse.statusCode).toBe(200);
		expect(updateResponse.json().name).toBe("Updated Business Unit Name");
	});
});
