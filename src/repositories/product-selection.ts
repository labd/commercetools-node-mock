import type {
	ProductSelection,
	ProductSelectionChangeNameAction,
	ProductSelectionDraft,
	ProductSelectionSetCustomTypeAction,
	ProductSelectionUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { createCustomFields } from "~src/repositories/helpers";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract";
import { AbstractResourceRepository, AbstractUpdateHandler } from "./abstract";

export class ProductSelectionRepository extends AbstractResourceRepository<"product-selection"> {
	constructor(config: Config) {
		super("product-selection", config);
		this.actions = new ProductSelectionUpdateHandler(this._storage);
	}

	create(
		context: RepositoryContext,
		draft: ProductSelectionDraft,
	): ProductSelection {
		const resource: ProductSelection = {
			...getBaseResourceProperties(),
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
		if (type) {
			resource.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
	}
}
