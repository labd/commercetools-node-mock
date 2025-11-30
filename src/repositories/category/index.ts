import type {
	Category,
	CategoryDraft,
	CategoryReference,
} from "@commercetools/platform-sdk";
import { v4 as uuidv4 } from "uuid";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { parseExpandClause } from "#src/lib/expandParser.ts";
import type { Writable } from "#src/types.ts";
import type { GetParams } from "../abstract.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { createCustomFields } from "../helpers.ts";
import { CategoryUpdateHandler } from "./actions.ts";

export class CategoryRepository extends AbstractResourceRepository<"category"> {
	constructor(config: Config) {
		super("category", config);
		this.actions = new CategoryUpdateHandler(this._storage);
	}

	create(context: RepositoryContext, draft: CategoryDraft): Category {
		const resource: Category = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			slug: draft.slug,
			description: draft.description,
			metaDescription: draft.metaDescription,
			metaKeywords: draft.metaKeywords,
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
		params?: GetParams,
	): Category {
		let node: Category = resource;
		const ancestors: CategoryReference[] = [];

		// TODO: The expand clause here is a hack, the current expand architecture
		// is not able to handle the case for 'dynamic' fields like ancestors which
		// are resolved at runtime.  We should do the expand resolution post query
		// execution for all resources

		const expandClauses = params?.expand?.map(parseExpandClause) ?? [];
		const addExpand = expandClauses?.find(
			(c) => c.element === "ancestors" && c.index === "*",
		);

		while (node.parent) {
			node = this._storage.getByResourceIdentifier<"category">(
				context.projectKey,
				node.parent,
			);
			ancestors.push({
				typeId: "category",
				id: node.id,
				obj: addExpand ? node : undefined,
			});
		}

		resource.ancestors = ancestors;
		return resource;
	}
}
