import { describe, expect, test } from "vitest";
import { InMemoryStorage } from "~src/storage";
import { CategoryRepository } from "./index";

describe("Order repository", () => {
	const storage = new InMemoryStorage();
	const repository = new CategoryRepository(storage);

	test("valid ancestors", async () => {
		const root = repository.create(
			{ projectKey: "dummy" },
			{
				key: "root",
				slug: {
					en: "root",
				},
				name: {
					en: "root",
				},
			},
		);

		const level1 = repository.create(
			{ projectKey: "dummy" },
			{
				key: "level-1",
				slug: {
					en: "level-1",
				},
				name: {
					en: "level-1",
				},
				parent: {
					id: root.id,
					typeId: "category",
				},
			},
		);

		const level2 = repository.create(
			{ projectKey: "dummy" },
			{
				key: "level-2",
				slug: {
					en: "level-2",
				},
				name: {
					en: "level-2",
				},
				parent: {
					id: level1.id,
					typeId: "category",
				},
			},
		);

		const level3 = repository.create(
			{ projectKey: "dummy" },
			{
				key: "level-3",
				slug: {
					en: "level-3",
				},
				name: {
					en: "level-3",
				},
				parent: {
					id: level2.id,
					typeId: "category",
				},
			},
		);

		const result = repository.get({ projectKey: "dummy" }, level3.id);
		expect(result?.ancestors).toHaveLength(3);
		expect(result?.ancestors).toEqual([
			{ id: level2.id, typeId: "category" },
			{ id: level1.id, typeId: "category" },
			{ id: root.id, typeId: "category" },
		]);
	});
});
