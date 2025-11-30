import { describe, expect, test } from "vitest";
import type { Config } from "#src/config.ts";
import { InMemoryStorage } from "#src/storage/index.ts";
import { CategoryRepository } from "./index.ts";

describe("Order repository", () => {
	const storage = new InMemoryStorage();
	const config: Config = { storage, strict: false };
	const repository = new CategoryRepository(config);

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

		const expandResult = repository.get({ projectKey: "dummy" }, level3.id, {
			expand: ["ancestors[*]"],
		});
		expect(expandResult?.ancestors).toHaveLength(3);
		expect(expandResult?.ancestors).toEqual([
			{ id: level2.id, typeId: "category", obj: level2 },
			{ id: level1.id, typeId: "category", obj: level1 },
			{ id: root.id, typeId: "category", obj: root },
		]);

		const queryResult = repository.query(
			{ projectKey: "dummy" },
			{
				where: [`id="${level3.id}"`],
				expand: ["ancestors[*]"],
			},
		);
		expect(queryResult.results[0].ancestors).toHaveLength(3);
		expect(queryResult.results[0].ancestors).toEqual([
			{ id: level2.id, typeId: "category", obj: level2 },
			{ id: level1.id, typeId: "category", obj: level1 },
			{ id: root.id, typeId: "category", obj: root },
		]);
	});
});
