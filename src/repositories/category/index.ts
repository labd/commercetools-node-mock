import type {
	Category,
	CategoryDraft,
	CategoryReference,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import { getBaseResourceProperties } from "~src/helpers";
import { AbstractStorage } from "~src/storage/abstract";
import { Writable } from "~src/types";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import { createCustomFields } from "../helpers";
import { CategoryUpdateHandler } from "./actions";

export class CategoryRepository extends AbstractResourceRepository<"category"> {
	constructor(storage: AbstractStorage) {
		super("category", storage);
		this.actions = new CategoryUpdateHandler(this._storage);
	}

	create(context: RepositoryContext, draft: CategoryDraft): Category {
		const resource: Category = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			slug: draft.slug,
			orderHint: draft.orderHint || "",
			externalId: draft.externalId || "",
			parent: draft.parent
				? { typeId: "category", id: draft.parent.id! }
				: undefined,
			ancestors: [], // Resolved at runtime
			assets:
				draft.assets?.map((d) => ({
					id: uuidv4(),
					name: d.name,
					description: d.description,
					sources: d.sources,
					tags: d.tags,
					key: d.key,
					custom: createCustomFields(
						draft.custom,
						context.projectKey,
						this._storage,
					),
				})) || [],
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}

	postProcessResource(
		context: RepositoryContext,
		resource: Writable<Category>,
	): Category {
		let node: Category = resource;
		const ancestors: CategoryReference[] = [];

		while (node.parent) {
			node = this._storage.getByResourceIdentifier<"category">(
				context.projectKey,
				node.parent,
			);
			ancestors.push({ typeId: "category", id: node.id });
		}

		resource.ancestors = ancestors;
		return resource;
	}
}
