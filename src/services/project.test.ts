import type { Project } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const ctMock = new CommercetoolsMock();

describe("Project", () => {
	test("Get project by key", async () => {
		const response = await supertest(ctMock.app).get("/dummy/");

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			version: 1,
			carts: {
				countryTaxRateFallbackEnabled: false,
				deleteDaysAfterLastModification: 90,
				priceRoundingMode: "HalfEven",
				taxRoundingMode: "HalfEven",
			},
			countries: [],
			createdAt: "2018-10-04T11:32:12.603Z",
			currencies: [],
			key: "dummy",
			languages: [],
			messages: {
				deleteDaysAfterCreation: 15,
				enabled: false,
			},
			name: "",
			searchIndexing: {
				customers: {
					status: "Deactivated",
				},
				orders: {
					status: "Deactivated",
				},
				products: {
					status: "Deactivated",
				},
				productsSearch: {
					status: "Deactivated",
				},
				businessUnits: {
					status: "Deactivated",
				},
			},
			trialUntil: "2018-12",
			shoppingLists: {
				deleteDaysAfterLastModification: 360,
			},
		} as Project);
	});

	test("Post empty update ", async () => {
		const response = await supertest(ctMock.app).post("/dummy/");
		expect(response.statusCode).toBe(400);
	});

	test("Post successful update", async () => {
		const response = await supertest(ctMock.app)
			.post("/dummy/")
			.send({
				version: 1,
				actions: [
					{
						action: "changeName",
						name: "Updated Project Name",
					},
				],
			});
		expect(response.status).toBe(200);
		expect(response.body.name).toBe("Updated Project Name");
		expect(response.body.version).toBe(2);
	});
});
