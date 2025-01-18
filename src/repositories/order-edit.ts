import type {
	OrderEdit,
	OrderEditDraft,
	OrderEditResult,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "../helpers";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";

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
