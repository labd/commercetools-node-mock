import type { Project } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Project", () => {
	test("Get project by key", async () => {
		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
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
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy",
		});
		expect(response.statusCode).toBe(400);
	});

	test("Post successful update", async () => {
		const response = await ctMock.app.inject({
			method: "POST",
			url: "/dummy",
			payload: {
				version: 1,
				actions: [
					{
						action: "changeName",
						name: "Updated Project Name",
					},
				],
			},
		});
		expect(response.statusCode).toBe(200);
		expect(response.json().name).toBe("Updated Project Name");
		expect(response.json().version).toBe(2);
	});
});
