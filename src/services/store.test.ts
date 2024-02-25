import type { Store } from "@commercetools/platform-sdk";
import supertest from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import { CommercetoolsMock } from "../index";

const ctMock = new CommercetoolsMock();

describe("Store", () => {
	beforeAll(() => {
		ctMock.start();
	});

	afterEach(() => {
		ctMock.clear();
	});

	afterAll(() => {
		ctMock.stop();
	});

	test("Get store by key", async () => {
		ctMock.project("dummy").add("store", {
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

		const response = await supertest(ctMock.app).get(
			`/dummy/stores/key=STOREKEY`,
		);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
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
		ctMock.project("dummy").add("store", {
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

		const response = await supertest(ctMock.app).get(
			`/dummy/stores/key=DOESNOTEXIST`,
		);

		expect(response.status).toBe(404);
	});
});
