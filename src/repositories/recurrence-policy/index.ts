import type {
	RecurrencePolicy,
	RecurrencePolicyDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { RecurrencePolicyUpdateHandler } from "./actions.ts";

export class RecurrencePolicyRepository extends AbstractResourceRepository<"recurrence-policy"> {
	constructor(config: Config) {
		super("recurrence-policy", config);
		this.actions = new RecurrencePolicyUpdateHandler(config.storage);
	}

	create(
		context: RepositoryContext,
		draft: RecurrencePolicyDraft,
	): RecurrencePolicy {
		const resource: RecurrencePolicy = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			schedule: draft.schedule,
		};
		return this.saveNew(context, resource);
	}
}
