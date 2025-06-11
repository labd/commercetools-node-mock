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
});
