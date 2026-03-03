import type {
	RecurrencePolicy,
	RecurrencePolicyDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { RecurrencePolicyDraftSchema } from "#src/schemas/generated/recurrence-policy.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { RecurrencePolicyUpdateHandler } from "./actions.ts";

export class RecurrencePolicyRepository extends AbstractResourceRepository<"recurrence-policy"> {
	constructor(config: Config) {
		super("recurrence-policy", config);
		this.actions = new RecurrencePolicyUpdateHandler(config.storage);
		this.draftSchema = RecurrencePolicyDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: RecurrencePolicyDraft,
	): Promise<RecurrencePolicy> {
		const resource: RecurrencePolicy = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			schedule: draft.schedule,
		};
		return await this.saveNew(context, resource);
	}
}
