import type {
	OrderEdit,
	OrderEditDraft,
	OrderEditResult,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "../helpers.ts";
import type { RepositoryContext } from "./abstract.ts";
import { AbstractResourceRepository } from "./abstract.ts";

export class OrderEditRepository extends AbstractResourceRepository<"order-edit"> {
	constructor(config: Config) {
		super("order-edit", config);
	}

	create(context: RepositoryContext, draft: OrderEditDraft): OrderEdit {
		const resource: OrderEdit = {
			...getBaseResourceProperties(),
			stagedActions: draft.stagedActions ?? [],
			resource: draft.resource,
			result: {
				type: "NotProcessed",
			} as OrderEditResult,
		};
		return this.saveNew(context, resource);
	}
}
