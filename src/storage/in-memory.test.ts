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
		test("addProject creates a new project with defaults", async () => {
			const project = await storage.addProject(projectKey);

			expect(project.key).toBe(projectKey);
			expect(project.version).toBe(1);
			expect(project.countries).toEqual([]);
			expect(project.currencies).toEqual([]);
			expect(project.languages).toEqual([]);
			expect(project.messages.enabled).toBe(false);
			expect(project.carts).toBeDefined();
			expect(project.searchIndexing).toBeDefined();
		});

		test("addProject returns existing project if already created", async () => {
			const first = await storage.addProject(projectKey);
			const modified = { ...first, name: "Modified" };
			await storage.saveProject(modified);

			const second = await storage.addProject(projectKey);
			expect(second.name).toBe("Modified");
		});

		test("getProject returns (or creates) the project", async () => {
			const project = await storage.getProject(projectKey);
			expect(project.key).toBe(projectKey);
		});

		test("saveProject persists changes", async () => {
			const project = await storage.addProject(projectKey);
			const updated = {
				...project,
				name: "Updated Name",
				countries: ["US", "DE"],
			};
			await storage.saveProject(updated);

			const retrieved = await storage.getProject(projectKey);
			expect(retrieved.name).toBe("Updated Name");
			expect(retrieved.countries).toEqual(["US", "DE"]);
		});

		test("separate project keys are independent", async () => {
			await storage.addProject("project-a");
			await storage.addProject("project-b");

			const a = await storage.getProject("project-a");
			const b = await storage.getProject("project-b");

			expect(a.key).toBe("project-a");
			expect(b.key).toBe("project-b");
		});
	});

	describe("CRUD operations", () => {
		describe("add", () => {
			test("adds a resource and returns a clone", async () => {
				const category = makeCategory();
				const result = await storage.add(projectKey, "category", category);

				expect(result.id).toBe("cat-1");
				expect(result.name).toEqual({ en: "Test Category" });

				// Should be a clone, not the same reference
				expect(result).not.toBe(category);
				expect(result).toEqual(category);
			});

			test("returned clone is independent of stored resource", async () => {
				await storage.add(projectKey, "category", makeCategory());

				// Mutate the returned value - should not affect stored version
				const returned = await storage.get(projectKey, "category", "cat-1");
				(returned as Writable<Category>).name = { en: "Mutated" };

				const retrieved = await storage.get(projectKey, "category", "cat-1");
				expect(retrieved?.name).toEqual({ en: "Test Category" });
			});
		});

		describe("get", () => {
			test("returns resource by id", async () => {
				await storage.add(projectKey, "category", makeCategory());

				const result = await storage.get(projectKey, "category", "cat-1");
				expect(result).not.toBeNull();
				expect(result?.id).toBe("cat-1");
			});

			test("returns null for non-existent id", async () => {
				const result = await storage.get(
					projectKey,
					"category",
					"non-existent",
				);
				expect(result).toBeNull();
			});

			test("returns a clone each time", async () => {
				await storage.add(projectKey, "category", makeCategory());

				const first = await storage.get(projectKey, "category", "cat-1");
				const second = await storage.get(projectKey, "category", "cat-1");

				expect(first).toEqual(second);
				expect(first).not.toBe(second);
			});
		});

		describe("getByKey", () => {
			test("returns resource by key", async () => {
				await storage.add(
					projectKey,
					"category",
					makeCategory({ key: "my-key" }),
				);

				const result = await storage.getByKey(
					projectKey,
					"category",
					"my-key",
					{},
				);
				expect(result).not.toBeNull();
				expect(result?.id).toBe("cat-1");
			});

			test("returns null for non-existent key", async () => {
				await storage.add(projectKey, "category", makeCategory());

				const result = await storage.getByKey(
					projectKey,
					"category",
					"does-not-exist",
					{},
				);
				expect(result).toBeNull();
			});
		});

		describe("all", () => {
			test("returns empty array when no resources exist", async () => {
				const result = await storage.all(projectKey, "category");
				expect(result).toEqual([]);
			});

			test("returns all resources of a type", async () => {
				await storage.add(
					projectKey,
					"category",
					makeCategory({ id: "cat-1" }),
				);
				await storage.add(
					projectKey,
					"category",
					makeCategory({ id: "cat-2" }),
				);
				await storage.add(
					projectKey,
					"category",
					makeCategory({ id: "cat-3" }),
				);

				const result = await storage.all(projectKey, "category");
				expect(result).toHaveLength(3);
			});

			test("returns clones of all resources", async () => {
				await storage.add(projectKey, "category", makeCategory());

				const results = await storage.all(projectKey, "category");
				(results[0] as Writable<Category>).name = { en: "Mutated" };

				const fresh = await storage.all(projectKey, "category");
				expect(fresh[0].name).toEqual({ en: "Test Category" });
			});

			test("does not return resources from other types", async () => {
				await storage.add(projectKey, "category", makeCategory());
				await storage.add(projectKey, "channel", makeChannel());

				const categories = await storage.all(projectKey, "category");
				expect(categories).toHaveLength(1);

				const channels = await storage.all(projectKey, "channel");
				expect(channels).toHaveLength(1);
			});
		});

		describe("delete", () => {
			test("deletes a resource and returns it", async () => {
				await storage.add(projectKey, "category", makeCategory());

				const deleted = await storage.delete(
					projectKey,
					"category",
					"cat-1",
					{},
				);
				expect(deleted).not.toBeNull();
				expect(deleted?.id).toBe("cat-1");

				// Should no longer be retrievable
				const result = await storage.get(projectKey, "category", "cat-1");
				expect(result).toBeNull();
			});

			test("returns null when deleting non-existent resource", async () => {
				const result = await storage.delete(
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
		beforeEach(async () => {
			// Add 25 categories for pagination tests
			for (let i = 1; i <= 25; i++) {
				await storage.add(
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

		test("returns paginated results with default limit of 20", async () => {
			const result = await storage.query(projectKey, "category", {});

			expect(result.results).toHaveLength(20);
			expect(result.limit).toBe(20);
			expect(result.offset).toBe(0);
			expect(result.count).toBe(20);
			expect(result.total).toBe(25);
		});

		test("respects custom limit", async () => {
			const result = await storage.query(projectKey, "category", { limit: 5 });

			expect(result.results).toHaveLength(5);
			expect(result.limit).toBe(5);
		});

		test("respects offset", async () => {
			const result = await storage.query(projectKey, "category", {
				offset: 20,
				limit: 10,
			});

			expect(result.results).toHaveLength(5); // 25 - 20 = 5 remaining
			expect(result.offset).toBe(20);
		});

		test("returns empty results when offset exceeds total", async () => {
			const result = await storage.query(projectKey, "category", {
				offset: 100,
			});

			expect(result.results).toHaveLength(0);
			expect(result.count).toBe(0);
			expect(result.total).toBe(25);
		});

		test("filters with where predicate", async () => {
			const result = await storage.query(projectKey, "category", {
				where: 'key = "category-5"',
			});

			expect(result.results).toHaveLength(1);
			expect(result.results[0].key).toBe("category-5");
			expect(result.count).toBe(1);
		});

		test("filters with where predicate using variables", async () => {
			const result = await storage.query(projectKey, "category", {
				where: "key = :myKey",
				"var.myKey": "category-3",
			});

			expect(result.results).toHaveLength(1);
			expect(result.results[0].key).toBe("category-3");
		});

		test("throws CommercetoolsError on invalid where predicate", async () => {
			await expect(
				storage.query(projectKey, "category", {
					where: "invalid !!! predicate",
				}),
			).rejects.toThrow(CommercetoolsError);
		});

		test("returns cloned results", async () => {
			const result = await storage.query(projectKey, "category", { limit: 1 });
			(result.results[0] as Writable<Category>).name = { en: "Mutated" };

			const fresh = await storage.query(projectKey, "category", { limit: 1 });
			expect(fresh.results[0].name).not.toEqual({ en: "Mutated" });
		});
	});

	describe("search", () => {
		beforeEach(async () => {
			for (let i = 1; i <= 10; i++) {
				await storage.add(
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

		test("returns all resources with default pagination", async () => {
			const result = await storage.search(projectKey, "category", {});

			expect(result.results).toHaveLength(10);
			expect(result.count).toBe(10);
			expect(result.offset).toBe(0);
			expect(result.limit).toBe(20);
		});

		test("respects limit and offset", async () => {
			const result = await storage.search(projectKey, "category", {
				limit: 3,
				offset: 2,
			});

			expect(result.results).toHaveLength(3);
			expect(result.offset).toBe(2);
			expect(result.limit).toBe(3);
		});

		test("filters with where predicate", async () => {
			const result = await storage.search(projectKey, "category", {
				where: 'key = "category-5"',
			});

			expect(result.results).toHaveLength(1);
			expect(result.count).toBe(1);
		});

		test("throws on invalid where predicate", async () => {
			await expect(
				storage.search(projectKey, "category", {
					where: "invalid !!! predicate",
				}),
			).rejects.toThrow(CommercetoolsError);
		});
	});

	describe("getByResourceIdentifier", () => {
		test("finds resource by id", async () => {
			await storage.add(projectKey, "category", makeCategory());

			const result = await storage.getByResourceIdentifier(projectKey, {
				typeId: "category",
				id: "cat-1",
			});

			expect(result.id).toBe("cat-1");
		});

		test("finds resource by key", async () => {
			await storage.add(
				projectKey,
				"category",
				makeCategory({ key: "my-cat-key" }),
			);

			const result = await storage.getByResourceIdentifier(projectKey, {
				typeId: "category",
				key: "my-cat-key",
			});

			expect(result.id).toBe("cat-1");
		});

		test("throws ReferencedResourceNotFoundError when id not found", async () => {
			try {
				await storage.getByResourceIdentifier(projectKey, {
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

		test("throws ReferencedResourceNotFoundError when key not found", async () => {
			try {
				await storage.getByResourceIdentifier(projectKey, {
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

		test("throws InvalidJsonInput when neither id nor key provided", async () => {
			try {
				await storage.getByResourceIdentifier(projectKey, {
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
		test("returns object unchanged when clause is undefined", async () => {
			const obj = { foo: "bar" };
			const result = await storage.expand(projectKey, obj, undefined);

			expect(result).toEqual(obj);
		});

		test("expands a single reference", async () => {
			const typeResource = makeType();
			await storage.add(projectKey, "type", typeResource);

			const category = makeCategory({
				custom: {
					type: { typeId: "type" as const, id: "type-1" },
					fields: {},
				},
			});
			await storage.add(projectKey, "category", category);

			const retrieved = await storage.get(projectKey, "category", "cat-1", {
				expand: ["custom.type"],
			});

			expect(retrieved).not.toBeNull();
			expect((retrieved as any).custom.type.obj).toBeDefined();
			expect((retrieved as any).custom.type.obj.id).toBe("type-1");
		});

		test("expands array references with wildcard", async () => {
			const cat1 = makeCategory({ id: "cat-a" });
			const cat2 = makeCategory({ id: "cat-b" });
			await storage.add(projectKey, "category", cat1);
			await storage.add(projectKey, "category", cat2);

			const obj = {
				categories: [
					{ typeId: "category", id: "cat-a" },
					{ typeId: "category", id: "cat-b" },
				],
			};

			const result = await storage.expand(projectKey, obj, ["categories[*]"]);

			expect((result.categories[0] as any).obj).toBeDefined();
			expect((result.categories[0] as any).obj.id).toBe("cat-a");
			expect((result.categories[1] as any).obj).toBeDefined();
			expect((result.categories[1] as any).obj.id).toBe("cat-b");
		});

		test("handles missing reference element gracefully", async () => {
			const obj = { name: "test" };
			// Should not throw when trying to expand a non-existent field
			const result = await storage.expand(projectKey, obj, ["nonExistent"]);
			expect(result).toEqual(obj);
		});

		test("expands multiple clauses", async () => {
			const typeResource = makeType();
			await storage.add(projectKey, "type", typeResource);

			const channelResource = makeChannel();
			await storage.add(projectKey, "channel", channelResource);

			const obj = {
				custom: {
					type: { typeId: "type", id: "type-1" },
					fields: {},
				},
				supplyChannel: { typeId: "channel", id: "channel-1" },
			};

			const result = await storage.expand(projectKey, obj, [
				"custom.type",
				"supplyChannel",
			]);

			expect((result.custom.type as any).obj).toBeDefined();
			expect((result.supplyChannel as any).obj).toBeDefined();
		});

		test("expand with string clause (non-array)", async () => {
			const typeResource = makeType();
			await storage.add(projectKey, "type", typeResource);

			const obj = {
				custom: {
					type: { typeId: "type", id: "type-1" },
					fields: {},
				},
			};

			const result = await storage.expand(projectKey, obj, "custom.type");
			expect((result.custom.type as any).obj).toBeDefined();
			expect((result.custom.type as any).obj.id).toBe("type-1");
		});
	});

	describe("clear", () => {
		test("removes all resources from all projects", async () => {
			await storage.add(projectKey, "category", makeCategory());
			await storage.add(projectKey, "channel", makeChannel());
			await storage.add(
				"other-project",
				"category",
				makeCategory({ id: "cat-2" }),
			);

			await storage.clear();

			expect(await storage.all(projectKey, "category")).toHaveLength(0);
			expect(await storage.all(projectKey, "channel")).toHaveLength(0);
			expect(await storage.all("other-project", "category")).toHaveLength(0);
		});

		test("clear does not affect projects themselves", async () => {
			await storage.addProject(projectKey);
			await storage.add(projectKey, "category", makeCategory());

			await storage.clear();

			// Projects still exist, can still add resources after clear
			const project = await storage.getProject(projectKey);
			expect(project.key).toBe(projectKey);
		});
	});

	describe("cross-project isolation", () => {
		test("resources in different projects are isolated", async () => {
			await storage.add("project-a", "category", makeCategory({ id: "cat-a" }));
			await storage.add("project-b", "category", makeCategory({ id: "cat-b" }));

			expect(
				await storage.get("project-a", "category", "cat-a"),
			).not.toBeNull();
			expect(await storage.get("project-a", "category", "cat-b")).toBeNull();

			expect(
				await storage.get("project-b", "category", "cat-b"),
			).not.toBeNull();
			expect(await storage.get("project-b", "category", "cat-a")).toBeNull();
		});

		test("deleting from one project does not affect another", async () => {
			await storage.add("project-a", "category", makeCategory({ id: "cat-1" }));
			await storage.add("project-b", "category", makeCategory({ id: "cat-1" }));

			await storage.delete("project-a", "category", "cat-1", {});

			expect(await storage.get("project-a", "category", "cat-1")).toBeNull();
			expect(
				await storage.get("project-b", "category", "cat-1"),
			).not.toBeNull();
		});
	});

	describe("multiple resource types", () => {
		test("stores and retrieves different resource types independently", async () => {
			await storage.add(projectKey, "category", makeCategory());
			await storage.add(projectKey, "channel", makeChannel());
			await storage.add(projectKey, "customer", makeCustomer());

			expect(await storage.get(projectKey, "category", "cat-1")).not.toBeNull();
			expect(
				await storage.get(projectKey, "channel", "channel-1"),
			).not.toBeNull();
			expect(
				await storage.get(projectKey, "customer", "customer-1"),
			).not.toBeNull();

			// Cross-type lookup should return null
			expect(await storage.get(projectKey, "category", "channel-1")).toBeNull();
		});
	});
});
