import { describe, expect, test } from "vitest";
import { storeDraftFactory } from "#src/testing/index.ts";
import { CommercetoolsMock } from "../index.ts";

const ctMock = new CommercetoolsMock();

describe("Store", () => {
	const factory = storeDraftFactory(ctMock);

	test("Get store by key", async () => {
		const store = await factory.create({ key: "STOREKEY" });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/stores/key=STOREKEY",
		});

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual(
			expect.objectContaining({
				key: "STOREKEY",
				id: store.id,
				version: store.version,
				countries: [],
				languages: [],
				distributionChannels: [],
				supplyChannels: [],
				productSelections: [],
			}),
		);
	});

	test("Get store by 404 when not found by key", async () => {
		await factory.create({ key: "STOREKEY" });

		const response = await ctMock.app.inject({
			method: "GET",
			url: "/dummy/stores/key=DOESNOTEXIST",
		});

		expect(response.statusCode).toBe(404);
	});
});
