import type { Store } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Store", () => {
	test("Get store by key", async () => {
		ctMock.project("dummy").unsafeAdd("store", {
			id: "fake-store",
			version: 1,
			createdAt: "",
			lastModifiedAt: "",
			key: "STOREKEY",
			countries: [],
			languages: [],
			distributionChannels: [],
			supplyChannels: [],
			productSelections: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/stores/key=STOREKEY",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({
			version: 1,
			createdAt: "",
			id: "fake-store",
			key: "STOREKEY",
			lastModifiedAt: "",
			countries: [],
			languages: [],
			distributionChannels: [],
			supplyChannels: [],
			productSelections: [],
		} as Store);
	});

	test("Get store by 404 when not found by key", async () => {
		ctMock.project("dummy").unsafeAdd("store", {
			id: "fake-store",
			version: 1,
			createdAt: "",
			lastModifiedAt: "",
			key: "STOREKEY",
			countries: [],
			languages: [],
			distributionChannels: [],
			supplyChannels: [],
			productSelections: [],
		});

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/stores/key=DOESNOTEXIST",
		});

		expect(response.statusCode).toBe(404);
	});
});
