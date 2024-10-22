import type {
	ProductSelection,
	ProductSelectionChangeNameAction,
	ProductSelectionDraft,
	ProductSelectionUpdateAction,
} from "@commercetools/platform-sdk";
import { getBaseResourceProperties } from "../helpers";
import type { AbstractStorage } from "../storage/abstract";
import type { Writable } from "../types";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract";
import { AbstractResourceRepository, AbstractUpdateHandler } from "./abstract";

export class ProductSelectionRepository extends AbstractResourceRepository<"product-selection"> {
	constructor(storage: AbstractStorage) {
		super("product-selection", storage);
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
}
