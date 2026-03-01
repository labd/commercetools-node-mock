import type {
	ProductSelection,
	ProductSelectionChangeNameAction,
	ProductSelectionDraft,
	ProductSelectionSetCustomTypeAction,
	ProductSelectionUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { ProductSelectionDraftSchema } from "#src/schemas/generated/product-selection.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";

export class ProductSelectionRepository extends AbstractResourceRepository<"product-selection"> {
	constructor(config: Config) {
		super("product-selection", config);
		this.actions = new ProductSelectionUpdateHandler(this._storage);
		this.draftSchema = ProductSelectionDraftSchema;
	}

	create(
		context: RepositoryContext,
		draft: ProductSelectionDraft,
	): ProductSelection {
		const resource: ProductSelection = {
			...getBaseResourceProperties(context.clientId),
			productCount: 0,
			key: draft.key,
			name: draft.name,
			mode: "Individual",
		};
		return this.saveNew(context, resource);
	}
}

class ProductSelectionUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<
			UpdateHandlerInterface<ProductSelection, ProductSelectionUpdateAction>
		>
{
	changeName(
		context: RepositoryContext,
		resource: Writable<ProductSelection>,
		{ name }: ProductSelectionChangeNameAction,
	) {
		resource.name = name;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<ProductSelection>,
		{ type, fields }: ProductSelectionSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
	}
}
