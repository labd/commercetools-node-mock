import type {
	Category,
	CategoryDraft,
	CategoryReference,
	Product,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { CategoryDraftSchema } from "#src/schemas/generated/category.ts";
import type { Writable } from "#src/types.ts";
import {
	AbstractResourceRepository,
	type GetParams,
	type RepositoryContext,
} from "../abstract.ts";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers.ts";
import { CategoryUpdateHandler } from "./actions.ts";
import { getAncestors } from "./ancestors.ts";

export class CategoryRepository extends AbstractResourceRepository<"category"> {
	constructor(config: Config) {
		super("category", config);
		this.actions = new CategoryUpdateHandler(this._storage);
		this.draftSchema = CategoryDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: CategoryDraft,
	): Promise<Category> {
		const assets = draft.assets
			? await Promise.all(
					draft.assets.map(async (d) => ({
						id: uuidv4(),
						name: d.name,
						description: d.description,
						sources: d.sources,
						tags: d.tags,
						key: d.key,
						custom: await createCustomFields(
							d.custom,
							context.projectKey,
							this._storage,
						),
					})),
				)
			: [];

		const resource: Category = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			slug: draft.slug,
			description: draft.description,
			metaDescription: draft.metaDescription,
			metaKeywords: draft.metaKeywords,
			orderHint: draft.orderHint || "",
			externalId: draft.externalId || "",
			parent: draft.parent
				? await getReferenceFromResourceIdentifier<CategoryReference>(
						draft.parent,
						context.projectKey,
						this._storage,
					)
				: undefined,
			ancestors: await getAncestors(
				this._storage,
				context.projectKey,
				draft.parent,
			),
			assets,
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return await this.saveNew(context, resource);
	}

	async delete(
		context: RepositoryContext,
		id: string,
		params: GetParams = {},
	): Promise<Category | null> {
		const resource = await super.delete(context, id, params);
		if (!resource) {
			return null;
		}

		const descendants = (
			await this._storage.all(context.projectKey, "category")
		).filter((category) => category.ancestors.some((ref) => ref.id === id));
		for (const descendant of descendants) {
			await this._storage.delete(
				context.projectKey,
				"category",
				descendant.id,
				{},
			);
		}

		const deletedIds = new Set([id, ...descendants.map(({ id }) => id)]);
		const products = await this._storage.all(context.projectKey, "product");
		for (const product of products as Writable<Product>[]) {
			const { current, staged } = product.masterData;
			if (
				![...current.categories, ...staged.categories].some((ref) =>
					deletedIds.has(ref.id),
				)
			) {
				continue;
			}
			current.categories = current.categories.filter(
				(ref) => !deletedIds.has(ref.id),
			);
			staged.categories = staged.categories.filter(
				(ref) => !deletedIds.has(ref.id),
			);
			await this._storage.add(context.projectKey, "product", product);
		}

		return resource;
	}
}
