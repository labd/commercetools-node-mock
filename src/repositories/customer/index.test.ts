import type { Store } from "@commercetools/platform-sdk";
import { describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { CustomerRepository } from "./index.ts";

describe("Customer repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CustomerRepository(config);

	test("query by lowercaseEmail", async () => {
		const customer = repository.create(
			{ projectKey: "dummy" },
			{ email: "my-customer-UPPERCASE@email.com" },
		);

		const result = repository.query(
			{ projectKey: "dummy" },
			{ where: [`lowercaseEmail = "my-customer-uppercase@email.com"`] },
		);

		expect(result.results).toHaveLength(1);
		expect(result.results[0].id).toEqual(customer.id);
	});

	test("updating lowercaseEmail", async () => {
		const customer = repository.create(
			{ projectKey: "dummy" },
			{ email: "my-customer-UPPERCASE-v1@email.com" },
		);

		repository.saveUpdate({ projectKey: "dummy" }, customer.version, {
			...customer,
			email: "my-customer-UPPERCASE-v2@email.com",
			version: customer.version + 1,
		});

		const result = repository.query(
			{ projectKey: "dummy" },
			{ where: [`lowercaseEmail = "my-customer-uppercase-v2@email.com"`] },
		);

		expect(result.results).toHaveLength(1);
		expect(result.results[0].id).toEqual(customer.id);
		expect(result.results[0].email).toEqual(
			"my-customer-UPPERCASE-v2@email.com",
		);
	});

	test("adding multiple stores to customer", async () => {
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

	test("adding single store to customer", async () => {
		const store1: Store = {
			id: "58082253-fe4e-4714-941f-86ab596d42ed",
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

		storage.add("dummy", "store", store1);

		const result = repository.create(
			{ projectKey: "dummy" },
			{
				email: "my-customer2@email.com",
				stores: [
					{
						typeId: "store",
						key: store1.key,
					},
				],
			},
		);

		expect(result?.stores).toEqual([
			{
				typeId: "store",
				key: store1.key,
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
