import { afterEach, describe, expect, test } from "vitest";
import { businessUnitDraftFactory } from "#src/testing/business-unit.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("MyBusinessUnit", () => {
	const businessUnitFactory = businessUnitDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Get my business units", async () => {
		await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/me/business-units",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().count).toBeGreaterThanOrEqual(0);
		expect(response.json().results).toBeDefined();
	});

	test("Get my business unit by ID", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/${businessUnit.id}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(businessUnit);
	});

	test("Get my business unit by key", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/key=${businessUnit.key}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(businessUnit);
	});

	test("Delete my business unit", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		// Now delete the business unit
		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/me/business-units/${businessUnit.id}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(businessUnit);

		// Verify that the business unit is deleted
		const newResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/${businessUnit.id}`,
		});
		expect(newResponse.statusCode).toBe(404);
	});

	test("Delete my business unit by key", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		// Now delete the business unit
		const deleteResponse = await ctMock.app.inject({
			method: "DELETE",
			url: `/dummy/me/business-units/key=${businessUnit.key}`,
		});

		expect(deleteResponse.statusCode).toBe(200);
		expect(deleteResponse.json()).toEqual(businessUnit);

		// Verify that the business unit is deleted
		const newResponse = await ctMock.app.inject({
			method: "GET",
			url: `/dummy/me/business-units/key=${businessUnit.key}`,
		});
		expect(newResponse.statusCode).toBe(404);
	});

	test("Update my business unit", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/me/business-units/${businessUnit.id}`,
			payload: {
				id: businessUnit.id,
				version: businessUnit.version,
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
		const businessUnit = await businessUnitFactory.create({
			key: "my-business-unit",
			unitType: "Company",
			name: "My Business Unit",
			contactEmail: "contact@example.com",
		});

		const updateResponse = await ctMock.app.inject({
			method: "POST",
			url: `/dummy/me/business-units/key=${businessUnit.key}`,
			payload: {
				id: businessUnit.id,
				version: businessUnit.version,
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
