import type {
	DiscountGroup,
	DiscountGroupDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { DiscountGroupDraftSchema } from "#src/schemas/generated/discount-group.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { DiscountGroupUpdateHandler } from "./actions.ts";

export class DiscountGroupRepository extends AbstractResourceRepository<"discount-group"> {
	constructor(config: Config) {
		super("discount-group", config);
		this.actions = new DiscountGroupUpdateHandler(config.storage);
		this.draftSchema = DiscountGroupDraftSchema;
	}

	create(context: RepositoryContext, draft: DiscountGroupDraft): DiscountGroup {
		const resource: DiscountGroup = {
			...getBaseResourceProperties(context.clientId),
			description: draft.description,
			name: draft.name,
			key: draft.key,
			sortOrder: draft.sortOrder,
			isActive: true,
		};
		return this.saveNew(context, resource);
	}
}
