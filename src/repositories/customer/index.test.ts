import type {
	CustomerAddStoreAction,
	CustomerChangeEmailAction,
	CustomerRemoveStoreAction,
	CustomerSetStoresAction,
	Store,
	StoreResourceIdentifier,
} from "@commercetools/platform-sdk";
import { beforeAll, describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { CustomerRepository } from "./index.ts";

describe("Customer repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CustomerRepository(config);

	test("query by lowercaseEmail", async () => {
		const customer = await repository.create(
			{ projectKey: "dummy" },
			{ email: "my-customer-UPPERCASE@email.com" },
		);

		const result = await repository.query(
			{ projectKey: "dummy" },
			{ where: [`lowercaseEmail = "my-customer-uppercase@email.com"`] },
		);

		expect(result.results).toHaveLength(1);
		expect(result.results[0].id).toEqual(customer.id);
	});

	test("updating lowercaseEmail", async () => {
		const customer = await repository.create(
			{ projectKey: "dummy" },
			{ email: "my-customer-UPPERCASE-v1@email.com" },
		);

		await repository.saveUpdate({ projectKey: "dummy" }, customer.version, {
			...customer,
			email: "my-customer-UPPERCASE-v2@email.com",
			version: customer.version + 1,
		});

		const result = await repository.query(
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

		await storage.add("dummy", "store", store1);
		await storage.add("dummy", "store", store2);

		const result = await repository.create(
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

		await storage.add("dummy", "store", store1);

		const result = await repository.create(
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
		const result = await repository.create(
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

const storeRef = (key: string): StoreResourceIdentifier => ({
	typeId: "store",
	key,
});

const addStore = (store: StoreResourceIdentifier): CustomerAddStoreAction => ({
	action: "addStore",
	store,
});

const removeStore = (
	store: StoreResourceIdentifier,
): CustomerRemoveStoreAction => ({
	action: "removeStore",
	store,
});

const setStores = (
	stores: StoreResourceIdentifier[],
): CustomerSetStoresAction => ({
	action: "setStores",
	stores,
});

const createStore = async (
	storage: InMemoryStorage,
	key: string,
	id: string,
): Promise<Store> => {
	const store: Store = {
		id,
		key,
		name: { en: key },
		version: 1,
		createdAt: "2021-09-02T12:23:30.036Z",
		lastModifiedAt: "2021-09-02T12:23:30.546Z",
		languages: [],
		distributionChannels: [],
		countries: [],
		supplyChannels: [],
		productSelections: [],
	};
	await storage.add("dummy", "store", store);
	return store;
};

describe("Customer email uniqueness", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CustomerRepository(config);
	const context = { projectKey: "dummy" };

	beforeAll(async () => {
		await createStore(storage, "lab", "16bd4dd3-8f52-4d09-9a17-9e9d0e7ff6e0");
		await createStore(storage, "bal", "a3aa9bf1-3b2f-4f4d-8ee3-2b3a4c9e1a2b");
		await createStore(storage, "other", "b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e");
		await createStore(
			storage,
			"unused",
			"c1d2e3f4-a5b6-4c7d-8e9f-1a2b3c4d5e6f",
		);
		await createStore(
			storage,
			"in-store",
			"d1e2f3a4-b5c6-4d7e-8f90-2b3c4d5e6f70",
		);
		await createStore(
			storage,
			"other-store",
			"e1f2a3b4-c5d6-4e7f-8091-3c4d5e6f7081",
		);
	});

	test("same email is allowed in different stores", async () => {
		const lab = await repository.create(context, {
			email: "test@labdigital.nl",
			stores: [storeRef("lab")],
		});
		const bal = await repository.create(context, {
			email: "test@labdigital.nl",
			stores: [storeRef("bal")],
		});

		expect(lab.id).not.toEqual(bal.id);
		expect(lab.stores).toEqual([storeRef("lab")]);
		expect(bal.stores).toEqual([storeRef("bal")]);
	});

	test("same email is rejected within the same store", async () => {
		await expect(
			repository.create(context, {
				email: "test@labdigital.nl",
				stores: [storeRef("lab")],
			}),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("same email is rejected when the stores overlap", async () => {
		await expect(
			repository.create(context, {
				email: "test@labdigital.nl",
				stores: [storeRef("other"), storeRef("bal")],
			}),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("email matching is case insensitive", async () => {
		await expect(
			repository.create(context, {
				email: "TEST@labdigital.nl",
				stores: [storeRef("lab")],
			}),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("a global customer does not conflict with store customers", async () => {
		const global = await repository.create(context, {
			email: "test@labdigital.nl",
		});

		expect(global.stores).toHaveLength(0);
	});

	test("global customers are unique across the project", async () => {
		await expect(
			repository.create(context, { email: "test@labdigital.nl" }),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("in-store endpoint assigns the store and scopes uniqueness", async () => {
		const customer = await repository.create(
			{ projectKey: "dummy", storeKey: "in-store" },
			{ email: "instore@labdigital.nl" },
		);

		expect(customer.stores).toEqual([storeRef("in-store")]);

		await expect(
			repository.create(
				{ projectKey: "dummy", storeKey: "in-store" },
				{ email: "instore@labdigital.nl" },
			),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);

		const other = await repository.create(
			{ projectKey: "dummy", storeKey: "other-store" },
			{ email: "instore@labdigital.nl" },
		);
		expect(other.stores).toEqual([storeRef("other-store")]);
	});

	test("changeEmail respects the store scope", async () => {
		const changeEmail: CustomerChangeEmailAction = {
			action: "changeEmail",
			email: "test@labdigital.nl",
		};

		const customer = await repository.create(context, {
			email: "change-me@labdigital.nl",
			stores: [storeRef("lab")],
		});

		// test@labdigital.nl already exists in store `lab`
		await expect(
			repository.processUpdateActions(context, customer, customer.version, [
				changeEmail,
			]),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);

		// but not in store `unused`
		const unused = await repository.create(context, {
			email: "change-me-too@labdigital.nl",
			stores: [storeRef("unused")],
		});
		const updated = await repository.processUpdateActions(
			context,
			unused,
			unused.version,
			[changeEmail],
		);

		expect(updated.email).toEqual("test@labdigital.nl");
	});

	test("unknown stores are rejected", async () => {
		await expect(
			repository.create(context, {
				email: "unknown-store@labdigital.nl",
				stores: [storeRef("does-not-exist")],
			}),
		).rejects.toThrow(
			"The referenced object of type 'store' with key 'does-not-exist' was not found.",
		);

		await expect(
			repository.create(context, {
				email: "unknown-store@labdigital.nl",
				stores: [
					{ typeId: "store", id: "5d3fa1c3-2b8a-4b56-8bd2-cf5b1a6ee2d0" },
				],
			}),
		).rejects.toThrow(
			"The referenced object of type 'store' with identifier '5d3fa1c3-2b8a-4b56-8bd2-cf5b1a6ee2d0' was not found.",
		);

		// A store in the path is a 404, not a bad reference in the draft
		await expect(
			repository.create(
				{ projectKey: "dummy", storeKey: "does-not-exist" },
				{ email: "unknown-store@labdigital.nl" },
			),
		).rejects.toMatchObject({
			statusCode: 404,
			info: {
				code: "ResourceNotFound",
				message: "The Store with key 'does-not-exist' was not found.",
			},
		});
	});
});

describe("Customer store update actions", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CustomerRepository(config);
	const context = { projectKey: "dummy" };

	beforeAll(async () => {
		await createStore(storage, "lab", "8e10bd8f-1f2c-4a70-9a4f-1c5b0a6d0f11");
		await createStore(storage, "bal", "9e21ce90-2f3d-4b81-8b50-2d6c1b7e1f22");
		await createStore(storage, "third", "af32dfa1-3f4e-4c92-9c61-3e7d2c8f2f33");
	});

	test("addStore assigns a store", async () => {
		const customer = await repository.create(context, {
			email: "add-store@labdigital.nl",
			stores: [storeRef("lab")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[addStore(storeRef("bal"))],
		);

		expect(updated.stores).toEqual([storeRef("lab"), storeRef("bal")]);
	});

	test("addStore is a no-op when already assigned", async () => {
		const customer = await repository.create(context, {
			email: "add-store-again@labdigital.nl",
			stores: [storeRef("lab")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[addStore(storeRef("lab"))],
		);

		expect(updated.stores).toEqual([storeRef("lab")]);
		expect(updated.version).toEqual(customer.version);
	});

	test("addStore rejects an unknown store", async () => {
		const customer = await repository.create(context, {
			email: "add-unknown-store@labdigital.nl",
			stores: [storeRef("lab")],
		});

		await expect(
			repository.processUpdateActions(context, customer, customer.version, [
				addStore(storeRef("nope")),
			]),
		).rejects.toThrow(
			"The referenced object of type 'store' with key 'nope' was not found.",
		);
	});

	test("addStore rejects a store where the email is taken", async () => {
		const taken = await repository.create(context, {
			email: "conflict@labdigital.nl",
			stores: [storeRef("bal")],
		});
		const customer = await repository.create(context, {
			email: "conflict@labdigital.nl",
			stores: [storeRef("lab")],
		});

		expect(taken.id).not.toEqual(customer.id);
		await expect(
			repository.processUpdateActions(context, customer, customer.version, [
				addStore(storeRef("bal")),
			]),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("removeStore unassigns a store", async () => {
		const customer = await repository.create(context, {
			email: "remove-store@labdigital.nl",
			stores: [storeRef("lab"), storeRef("bal")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[removeStore(storeRef("lab"))],
		);

		expect(updated.stores).toEqual([storeRef("bal")]);
	});

	test("removeStore is a no-op when not assigned", async () => {
		const customer = await repository.create(context, {
			email: "remove-unassigned-store@labdigital.nl",
			stores: [storeRef("lab")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[removeStore(storeRef("bal"))],
		);

		expect(updated.stores).toEqual([storeRef("lab")]);
		expect(updated.version).toEqual(customer.version);
	});

	test("removing the last store requires a project wide unique email", async () => {
		const global = await repository.create(context, {
			email: "becomes-global@labdigital.nl",
		});
		const scoped = await repository.create(context, {
			email: "becomes-global@labdigital.nl",
			stores: [storeRef("lab")],
		});

		expect(global.id).not.toEqual(scoped.id);
		await expect(
			repository.processUpdateActions(context, scoped, scoped.version, [
				removeStore(storeRef("lab")),
			]),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("removing the last store makes the customer global", async () => {
		const customer = await repository.create(context, {
			email: "no-longer-scoped@labdigital.nl",
			stores: [storeRef("lab")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[removeStore(storeRef("lab"))],
		);

		expect(updated.stores).toEqual([]);
	});

	test("setStores replaces the assignment", async () => {
		const customer = await repository.create(context, {
			email: "set-stores@labdigital.nl",
			stores: [storeRef("lab")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[setStores([storeRef("bal"), storeRef("third")])],
		);

		expect(updated.stores).toEqual([storeRef("bal"), storeRef("third")]);
	});

	test("setStores validates only newly added stores", async () => {
		const taken = await repository.create(context, {
			email: "set-stores-conflict@labdigital.nl",
			stores: [storeRef("third")],
		});
		const customer = await repository.create(context, {
			email: "set-stores-conflict@labdigital.nl",
			stores: [storeRef("lab"), storeRef("bal")],
		});

		expect(taken.id).not.toEqual(customer.id);

		// Narrowing down to a store it is already in is fine
		const narrowed = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[setStores([storeRef("lab")])],
		);
		expect(narrowed.stores).toEqual([storeRef("lab")]);

		// Adding the conflicting store is not
		await expect(
			repository.processUpdateActions(context, narrowed, narrowed.version, [
				setStores([storeRef("lab"), storeRef("third")]),
			]),
		).rejects.toThrow(
			"There is already an existing customer with the provided email.",
		);
	});

	test("setStores with an empty list makes the customer global", async () => {
		const customer = await repository.create(context, {
			email: "set-stores-empty@labdigital.nl",
			stores: [storeRef("lab")],
		});

		const updated = await repository.processUpdateActions(
			context,
			customer,
			customer.version,
			[setStores([])],
		);

		expect(updated.stores).toEqual([]);
	});

	test("setStores rejects an unknown store", async () => {
		const customer = await repository.create(context, {
			email: "set-unknown-store@labdigital.nl",
			stores: [storeRef("lab")],
		});

		await expect(
			repository.processUpdateActions(context, customer, customer.version, [
				setStores([storeRef("nope")]),
			]),
		).rejects.toThrow(
			"The referenced object of type 'store' with key 'nope' was not found.",
		);
	});

	test("stores can be referenced by id and are deduplicated", async () => {
		const customer = await repository.create(context, {
			email: "store-by-id@labdigital.nl",
			stores: [
				{ typeId: "store", id: "8e10bd8f-1f2c-4a70-9a4f-1c5b0a6d0f11" },
				storeRef("lab"),
			],
		});

		expect(customer.stores).toEqual([storeRef("lab")]);
	});
});
