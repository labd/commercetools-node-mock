import type {
	ProductTailoring,
	ProductTailoringUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";

export class ProductTailoringRepository extends AbstractResourceRepository<"product-tailoring"> {
	constructor(config: Config) {
		super("product-tailoring", config);
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
