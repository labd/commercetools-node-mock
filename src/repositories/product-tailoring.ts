import type {
	ProductTailoring,
	ProductTailoringUpdateAction,
} from "@commercetools/platform-sdk";
import { AbstractStorage } from "~src/storage";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	RepositoryContext,
	UpdateHandlerInterface,
} from "./abstract";

export class ProductTailoringRepository extends AbstractResourceRepository<"product-tailoring"> {
	constructor(storage: AbstractStorage) {
		super("product-tailoring", storage);
		this.actions = new ProductTailoringUpdateHandler(this._storage);
	}

	create(context: RepositoryContext, draft: any): ProductTailoring {
		throw new Error("Create method for product-tailoring not implemented.");
	}
}

class ProductTailoringUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<
			UpdateHandlerInterface<ProductTailoring, ProductTailoringUpdateAction>
		>
{
	setSlug() {
		throw new Error("SetSlug method for product-tailoring not implemented.");
	}
}
