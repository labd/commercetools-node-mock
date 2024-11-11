import type { Store } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import { InMemoryStorage } from "~src/storage";
import { CustomerRepository } from "./index";

describe("Customer repository", () => {
	const storage = new InMemoryStorage();
	const repository = new CustomerRepository(storage);

	test("adding stores to customer", async () => {
		const store1: Store = {
			id: "d0016081-e9af-48a7-8133-1f04f340a335",
			key: "store-1",
			name: {
				en: "Store 1",
			},
			version: 1,
			createdAt: "2021-09-02T12:23:30.036Z",
			lastModifiedAt: "2021-09-02T12:23:30.546Z",
			languages: [],
			distributionChannels: [],
			countries: [],
			supplyChannels: [],
			productSelections: [],
		};

		const store2: Store = {
			id: "6dac7d6d-2a48-4705-aa8b-17b0124a499a",
			key: "store-2",
			name: {
				en: "Store 2",
			},
			version: 1,
			createdAt: "2021-09-02T12:23:30.036Z",
			lastModifiedAt: "2021-09-02T12:23:30.546Z",
			languages: [],
			distributionChannels: [],
			countries: [],
			supplyChannels: [],
			productSelections: [],
		};

		storage.add("dummy", "store", store1);
		storage.add("dummy", "store", store2);

		const result = repository.create(
			{ projectKey: "dummy" },
			{
				email: "my-customer@email.com",
				stores: [
					{
						typeId: "store",
						id: store1.id,
					},
					{
						typeId: "store",
						key: store2.key,
					},
				],
			},
		);

		expect(result?.stores).toHaveLength(2);
		expect(result?.stores).toEqual([
			{
				typeId: "store",
				key: store1.key,
			},
			{
				typeId: "store",
				key: store2.key,
			},
		]);
	});

	test("adding customer without linked stores", async () => {
		const result = repository.create(
			{ projectKey: "dummy" },
			{
				email: "my-customer-without-stores@email.com",
				stores: [],
			},
		);

		expect(result.email).toEqual("my-customer-without-stores@email.com");
		expect(result?.stores).toHaveLength(0);
	});
});
