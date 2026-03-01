import type {
	Category,
	Channel,
	Customer,
	Type,
} from "@commercetools/platform-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import { InMemoryStorage } from "./in-memory.ts";

const makeCategory = (overrides: Partial<Writable<Category>> = {}): Category =>
	({
		id: "cat-1",
		version: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		name: { en: "Test Category" },
		slug: { en: "test-category" },
		orderHint: "0.1",
		ancestors: [],
		...overrides,
	}) as Category;

const makeChannel = (overrides: Partial<Writable<Channel>> = {}): Channel =>
	({
		id: "channel-1",
		version: 1,
		key: "default-channel",
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		roles: [],
		...overrides,
	}) as Channel;

const makeCustomer = (overrides: Partial<Writable<Customer>> = {}): Customer =>
	({
		id: "customer-1",
		version: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		email: "test@example.com",
		addresses: [],
		isEmailVerified: false,
		authenticationMode: "Password",
		stores: [],
		...overrides,
	}) as Customer;

const makeType = (overrides: Partial<Writable<Type>> = {}): Type =>
	({
		id: "type-1",
		version: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		lastModifiedAt: "2024-01-01T00:00:00.000Z",
		key: "my-type",
		name: { en: "My Type" },
		resourceTypeIds: ["category"],
		fieldDefinitions: [],
		...overrides,
	}) as Type;

describe("InMemoryStorage", () => {
	let storage: InMemoryStorage;
	const projectKey = "test-project";

	beforeEach(() => {
		storage = new InMemoryStorage();
	});

	describe("project management", () => {
		test("addProject creates a new project with defaults", () => {
			const project = storage.addProject(projectKey);

			expect(project.key).toBe(projectKey);
			expect(project.version).toBe(1);
			expect(project.countries).toEqual([]);
			expect(project.currencies).toEqual([]);
			expect(project.languages).toEqual([]);
			expect(project.messages.enabled).toBe(false);
			expect(project.carts).toBeDefined();
			expect(project.searchIndexing).toBeDefined();
		});

		test("addProject returns existing project if already created", () => {
			const first = storage.addProject(projectKey);
			const modified = { ...first, name: "Modified" };
			storage.saveProject(modified);

			const second = storage.addProject(projectKey);
			expect(second.name).toBe("Modified");
		});

		test("getProject returns (or creates) the project", () => {
			const project = storage.getProject(projectKey);
			expect(project.key).toBe(projectKey);
		});

		test("saveProject persists changes", () => {
			const project = storage.addProject(projectKey);
			const updated = {
				...project,
				name: "Updated Name",
				countries: ["US", "DE"],
			};
			storage.saveProject(updated);

			const retrieved = storage.getProject(projectKey);
			expect(retrieved.name).toBe("Updated Name");
			expect(retrieved.countries).toEqual(["US", "DE"]);
		});

		test("separate project keys are independent", () => {
			storage.addProject("project-a");
			storage.addProject("project-b");

			const a = storage.getProject("project-a");
			const b = storage.getProject("project-b");

			expect(a.key).toBe("project-a");
			expect(b.key).toBe("project-b");
		});
	});

	describe("CRUD operations", () => {
		describe("add", () => {
			test("adds a resource and returns a clone", () => {
				const category = makeCategory();
				const result = storage.add(projectKey, "category", category);

				expect(result.id).toBe("cat-1");
				expect(result.name).toEqual({ en: "Test Category" });

				// Should be a clone, not the same reference
				expect(result).not.toBe(category);
				expect(result).toEqual(category);
			});

			test("returned clone is independent of stored resource", () => {
				storage.add(projectKey, "category", makeCategory());

				// Mutate the returned value - should not affect stored version
				const returned = storage.get(projectKey, "category", "cat-1");
				(returned as Writable<Category>).name = { en: "Mutated" };

				const retrieved = storage.get(projectKey, "category", "cat-1");
				expect(retrieved?.name).toEqual({ en: "Test Category" });
			});
		});

		describe("get", () => {
			test("returns resource by id", () => {
				storage.add(projectKey, "category", makeCategory());

				const result = storage.get(projectKey, "category", "cat-1");
				expect(result).not.toBeNull();
				expect(result?.id).toBe("cat-1");
			});

			test("returns null for non-existent id", () => {
				const result = storage.get(projectKey, "category", "non-existent");
				expect(result).toBeNull();
			});

			test("returns a clone each time", () => {
				storage.add(projectKey, "category", makeCategory());

				const first = storage.get(projectKey, "category", "cat-1");
				const second = storage.get(projectKey, "category", "cat-1");

				expect(first).toEqual(second);
				expect(first).not.toBe(second);
			});
		});

		describe("getByKey", () => {
			test("returns resource by key", () => {
				storage.add(projectKey, "category", makeCategory({ key: "my-key" }));

				const result = storage.getByKey(projectKey, "category", "my-key", {});
				expect(result).not.toBeNull();
				expect(result?.id).toBe("cat-1");
			});

			test("returns null for non-existent key", () => {
				storage.add(projectKey, "category", makeCategory());

				const result = storage.getByKey(
					projectKey,
					"category",
					"does-not-exist",
					{},
				);
				expect(result).toBeNull();
			});
		});

		describe("all", () => {
			test("returns empty array when no resources exist", () => {
				const result = storage.all(projectKey, "category");
				expect(result).toEqual([]);
			});

			test("returns all resources of a type", () => {
				storage.add(projectKey, "category", makeCategory({ id: "cat-1" }));
				storage.add(projectKey, "category", makeCategory({ id: "cat-2" }));
				storage.add(projectKey, "category", makeCategory({ id: "cat-3" }));

				const result = storage.all(projectKey, "category");
				expect(result).toHaveLength(3);
			});

			test("returns clones of all resources", () => {
				storage.add(projectKey, "category", makeCategory());

				const results = storage.all(projectKey, "category");
				(results[0] as Writable<Category>).name = { en: "Mutated" };

				const fresh = storage.all(projectKey, "category");
				expect(fresh[0].name).toEqual({ en: "Test Category" });
			});

			test("does not return resources from other types", () => {
				storage.add(projectKey, "category", makeCategory());
				storage.add(projectKey, "channel", makeChannel());

				const categories = storage.all(projectKey, "category");
				expect(categories).toHaveLength(1);

				const channels = storage.all(projectKey, "channel");
				expect(channels).toHaveLength(1);
			});
		});

		describe("delete", () => {
			test("deletes a resource and returns it", () => {
				storage.add(projectKey, "category", makeCategory());

				const deleted = storage.delete(projectKey, "category", "cat-1", {});
				expect(deleted).not.toBeNull();
				expect(deleted?.id).toBe("cat-1");

				// Should no longer be retrievable
				const result = storage.get(projectKey, "category", "cat-1");
				expect(result).toBeNull();
			});

			test("returns null when deleting non-existent resource", () => {
				const result = storage.delete(
					projectKey,
					"category",
					"non-existent",
					{},
				);
				expect(result).toBeNull();
			});
		});
	});

	describe("query", () => {
		beforeEach(() => {
			// Add 25 categories for pagination tests
			for (let i = 1; i <= 25; i++) {
				storage.add(
					projectKey,
					"category",
					makeCategory({
						id: `cat-${i}`,
						name: { en: `Category ${i}` },
						key: `category-${i}`,
						orderHint: `0.${i}`,
					}),
				);
			}
		});

		test("returns paginated results with default limit of 20", () => {
			const result = storage.query(projectKey, "category", {});

			expect(result.results).toHaveLength(20);
			expect(result.limit).toBe(20);
			expect(result.offset).toBe(0);
			expect(result.count).toBe(20);
			expect(result.total).toBe(25);
		});

		test("respects custom limit", () => {
			const result = storage.query(projectKey, "category", { limit: 5 });

			expect(result.results).toHaveLength(5);
			expect(result.limit).toBe(5);
		});

		test("respects offset", () => {
			const result = storage.query(projectKey, "category", {
				offset: 20,
				limit: 10,
			});

			expect(result.results).toHaveLength(5); // 25 - 20 = 5 remaining
			expect(result.offset).toBe(20);
		});

		test("returns empty results when offset exceeds total", () => {
			const result = storage.query(projectKey, "category", {
				offset: 100,
			});

			expect(result.results).toHaveLength(0);
			expect(result.count).toBe(0);
			expect(result.total).toBe(25);
		});

		test("filters with where predicate", () => {
			const result = storage.query(projectKey, "category", {
				where: 'key = "category-5"',
			});

			expect(result.results).toHaveLength(1);
			expect(result.results[0].key).toBe("category-5");
			expect(result.count).toBe(1);
		});

		test("filters with where predicate using variables", () => {
			const result = storage.query(projectKey, "category", {
				where: "key = :myKey",
				"var.myKey": "category-3",
			});

			expect(result.results).toHaveLength(1);
			expect(result.results[0].key).toBe("category-3");
		});

		test("throws CommercetoolsError on invalid where predicate", () => {
			expect(() =>
				storage.query(projectKey, "category", {
					where: "invalid !!! predicate",
				}),
			).toThrow(CommercetoolsError);
		});

		test("returns cloned results", () => {
			const result = storage.query(projectKey, "category", { limit: 1 });
			(result.results[0] as Writable<Category>).name = { en: "Mutated" };

			const fresh = storage.query(projectKey, "category", { limit: 1 });
			expect(fresh.results[0].name).not.toEqual({ en: "Mutated" });
		});
	});

	describe("search", () => {
		beforeEach(() => {
			for (let i = 1; i <= 10; i++) {
				storage.add(
					projectKey,
					"category",
					makeCategory({
						id: `cat-${i}`,
						key: `category-${i}`,
						name: { en: `Category ${i}` },
					}),
				);
			}
		});

		test("returns all resources with default pagination", () => {
			const result = storage.search(projectKey, "category", {});

			expect(result.results).toHaveLength(10);
			expect(result.count).toBe(10);
			expect(result.offset).toBe(0);
			expect(result.limit).toBe(20);
		});

		test("respects limit and offset", () => {
			const result = storage.search(projectKey, "category", {
				limit: 3,
				offset: 2,
			});

			expect(result.results).toHaveLength(3);
			expect(result.offset).toBe(2);
			expect(result.limit).toBe(3);
		});

		test("filters with where predicate", () => {
			const result = storage.search(projectKey, "category", {
				where: 'key = "category-5"',
			});

			expect(result.results).toHaveLength(1);
			expect(result.count).toBe(1);
		});

		test("throws on invalid where predicate", () => {
			expect(() =>
				storage.search(projectKey, "category", {
					where: "invalid !!! predicate",
				}),
			).toThrow(CommercetoolsError);
		});
	});

	describe("getByResourceIdentifier", () => {
		test("finds resource by id", () => {
			storage.add(projectKey, "category", makeCategory());

			const result = storage.getByResourceIdentifier(projectKey, {
				typeId: "category",
				id: "cat-1",
			});

			expect(result.id).toBe("cat-1");
		});

		test("finds resource by key", () => {
			storage.add(projectKey, "category", makeCategory({ key: "my-cat-key" }));

			const result = storage.getByResourceIdentifier(projectKey, {
				typeId: "category",
				key: "my-cat-key",
			});

			expect(result.id).toBe("cat-1");
		});

		test("throws ReferencedResourceNotFoundError when id not found", () => {
			try {
				storage.getByResourceIdentifier(projectKey, {
					typeId: "category",
					id: "non-existent",
				});
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).toBeInstanceOf(CommercetoolsError);
				expect((err as CommercetoolsError<any>).info.code).toBe(
					"ReferencedResourceNotFound",
				);
				expect((err as CommercetoolsError<any>).info.id).toBe("non-existent");
			}
		});

		test("throws ReferencedResourceNotFoundError when key not found", () => {
			try {
				storage.getByResourceIdentifier(projectKey, {
					typeId: "category",
					key: "non-existent-key",
				});
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).toBeInstanceOf(CommercetoolsError);
				expect((err as CommercetoolsError<any>).info.code).toBe(
					"ReferencedResourceNotFound",
				);
				expect((err as CommercetoolsError<any>).info.key).toBe(
					"non-existent-key",
				);
			}
		});

		test("throws InvalidJsonInput when neither id nor key provided", () => {
			try {
				storage.getByResourceIdentifier(projectKey, {
					typeId: "category",
				} as any);
				expect.fail("Should have thrown");
			} catch (err) {
				expect(err).toBeInstanceOf(CommercetoolsError);
				expect((err as CommercetoolsError<any>).info.code).toBe(
					"InvalidJsonInput",
				);
			}
		});
	});

	describe("expand", () => {
		test("returns object unchanged when clause is undefined", () => {
			const obj = { foo: "bar" };
			const result = storage.expand(projectKey, obj, undefined);

			expect(result).toEqual(obj);
		});

		test("expands a single reference", () => {
			const typeResource = makeType();
			storage.add(projectKey, "type", typeResource);

			const category = makeCategory({
				custom: {
					type: { typeId: "type" as const, id: "type-1" },
					fields: {},
				},
			});
			storage.add(projectKey, "category", category);

			const retrieved = storage.get(projectKey, "category", "cat-1", {
				expand: ["custom.type"],
			});

			expect(retrieved).not.toBeNull();
			expect((retrieved as any).custom.type.obj).toBeDefined();
			expect((retrieved as any).custom.type.obj.id).toBe("type-1");
		});

		test("expands array references with wildcard", () => {
			const cat1 = makeCategory({ id: "cat-a" });
			const cat2 = makeCategory({ id: "cat-b" });
			storage.add(projectKey, "category", cat1);
			storage.add(projectKey, "category", cat2);

			const obj = {
				categories: [
					{ typeId: "category", id: "cat-a" },
					{ typeId: "category", id: "cat-b" },
				],
			};

			const result = storage.expand(projectKey, obj, ["categories[*]"]);

			expect((result.categories[0] as any).obj).toBeDefined();
			expect((result.categories[0] as any).obj.id).toBe("cat-a");
			expect((result.categories[1] as any).obj).toBeDefined();
			expect((result.categories[1] as any).obj.id).toBe("cat-b");
		});

		test("handles missing reference element gracefully", () => {
			const obj = { name: "test" };
			// Should not throw when trying to expand a non-existent field
			const result = storage.expand(projectKey, obj, ["nonExistent"]);
			expect(result).toEqual(obj);
		});

		test("expands multiple clauses", () => {
			const typeResource = makeType();
			storage.add(projectKey, "type", typeResource);

			const channelResource = makeChannel();
			storage.add(projectKey, "channel", channelResource);

			const obj = {
				custom: {
					type: { typeId: "type", id: "type-1" },
					fields: {},
				},
				supplyChannel: { typeId: "channel", id: "channel-1" },
			};

			const result = storage.expand(projectKey, obj, [
				"custom.type",
				"supplyChannel",
			]);

			expect((result.custom.type as any).obj).toBeDefined();
			expect((result.supplyChannel as any).obj).toBeDefined();
		});

		test("expand with string clause (non-array)", () => {
			const typeResource = makeType();
			storage.add(projectKey, "type", typeResource);

			const obj = {
				custom: {
					type: { typeId: "type", id: "type-1" },
					fields: {},
				},
			};

			const result = storage.expand(projectKey, obj, "custom.type");
			expect((result.custom.type as any).obj).toBeDefined();
			expect((result.custom.type as any).obj.id).toBe("type-1");
		});
	});

	describe("clear", () => {
		test("removes all resources from all projects", () => {
			storage.add(projectKey, "category", makeCategory());
			storage.add(projectKey, "channel", makeChannel());
			storage.add("other-project", "category", makeCategory({ id: "cat-2" }));

			storage.clear();

			expect(storage.all(projectKey, "category")).toHaveLength(0);
			expect(storage.all(projectKey, "channel")).toHaveLength(0);
			expect(storage.all("other-project", "category")).toHaveLength(0);
		});

		test("clear does not affect projects themselves", () => {
			storage.addProject(projectKey);
			storage.add(projectKey, "category", makeCategory());

			storage.clear();

			// Projects still exist, can still add resources after clear
			const project = storage.getProject(projectKey);
			expect(project.key).toBe(projectKey);
		});
	});

	describe("cross-project isolation", () => {
		test("resources in different projects are isolated", () => {
			storage.add("project-a", "category", makeCategory({ id: "cat-a" }));
			storage.add("project-b", "category", makeCategory({ id: "cat-b" }));

			expect(storage.get("project-a", "category", "cat-a")).not.toBeNull();
			expect(storage.get("project-a", "category", "cat-b")).toBeNull();

			expect(storage.get("project-b", "category", "cat-b")).not.toBeNull();
			expect(storage.get("project-b", "category", "cat-a")).toBeNull();
		});

		test("deleting from one project does not affect another", () => {
			storage.add("project-a", "category", makeCategory({ id: "cat-1" }));
			storage.add("project-b", "category", makeCategory({ id: "cat-1" }));

			storage.delete("project-a", "category", "cat-1", {});

			expect(storage.get("project-a", "category", "cat-1")).toBeNull();
			expect(storage.get("project-b", "category", "cat-1")).not.toBeNull();
		});
	});

	describe("multiple resource types", () => {
		test("stores and retrieves different resource types independently", () => {
			storage.add(projectKey, "category", makeCategory());
			storage.add(projectKey, "channel", makeChannel());
			storage.add(projectKey, "customer", makeCustomer());

			expect(storage.get(projectKey, "category", "cat-1")).not.toBeNull();
			expect(storage.get(projectKey, "channel", "channel-1")).not.toBeNull();
			expect(storage.get(projectKey, "customer", "customer-1")).not.toBeNull();

			// Cross-type lookup should return null
			expect(storage.get(projectKey, "category", "channel-1")).toBeNull();
		});
	});
});
