import { afterEach, describe, expect, test } from "vitest";
import { businessUnitDraftFactory } from "#src/testing/business-unit.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();
const projectKey = "dummy";
const associateId = "5fac8fca-2484-4b14-a1d1-cfdce2f8d3c4";

describe("AsAssociateBusinessUnit", () => {
	const businessUnitFactory = businessUnitDraftFactory(ctMock);

	afterEach(async () => {
		await ctMock.clear();
	});

	test("Get business units as associate", async () => {
		await businessUnitFactory.create({
			key: "as-associate-bu",
			unitType: "Company",
			name: "As Associate BU",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${associateId}/business-units`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().results).toBeDefined();
	});

	test("Get business unit by key as associate", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "as-associate-bu",
			unitType: "Company",
			name: "As Associate BU",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: `/${projectKey}/as-associate/${associateId}/business-units/key=${businessUnit.key}`,
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(businessUnit);
	});

	test("Update business unit by key as associate", async () => {
		const businessUnit = await businessUnitFactory.create({
			key: "as-associate-bu",
			unitType: "Company",
			name: "As Associate BU",
			contactEmail: "contact@example.com",
		});

		const response = await ctMock.app.inject({
			method: "POST",
			url: `/${projectKey}/as-associate/${associateId}/business-units/key=${businessUnit.key}`,
			payload: {
				version: businessUnit.version,
				actions: [{ action: "changeName", name: "Updated Name" }],
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.json().name).toBe("Updated Name");
	});
});
