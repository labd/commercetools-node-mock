import type {
	InvalidOperationError,
	ProductTailoring,
	ProductTailoringUpdateAction,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { ProductTailoringDraftSchema } from "#src/schemas/generated/product-tailoring.ts";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
} from "./abstract.ts";

export class ProductTailoringRepository extends AbstractResourceRepository<"product-tailoring"> {
	constructor(config: Config) {
		super("product-tailoring", config);
		this.actions = new ProductTailoringUpdateHandler(this._storage);
		this.draftSchema = ProductTailoringDraftSchema;
	}

	create(context: RepositoryContext, draft: any): ProductTailoring {
		throw new CommercetoolsError<InvalidOperationError>(
			{
				code: "InvalidOperation",
				message: "Create method for product-tailoring not implemented.",
			},
			400,
		);
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
		throw new CommercetoolsError<InvalidOperationError>(
			{
				code: "InvalidOperation",
				message: "SetSlug method for product-tailoring not implemented.",
			},
			400,
		);
	}
}
