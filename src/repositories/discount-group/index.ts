import type {
	DiscountGroup,
	DiscountGroupDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import { DiscountGroupUpdateHandler } from "./actions";

export class DiscountGroupRepository extends AbstractResourceRepository<"discount-group"> {
	constructor(config: Config) {
		super("discount-group", config);
		this.actions = new DiscountGroupUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: DiscountGroupDraft): DiscountGroup {
		const resource: DiscountGroup = {
			...getBaseResourceProperties(),
			description: draft.description,
			name: draft.name,
			key: draft.key,
			sortOrder: draft.sortOrder,
		};
		return this.saveNew(context, resource);
	}
}
