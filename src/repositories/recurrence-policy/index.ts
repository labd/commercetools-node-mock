import assert from "node:assert";
import type {
	RecurrencePolicy,
	RecurrencePolicyDraft,
	RecurringOrder,
	RecurringOrderDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "~src/helpers";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import { OrderRepository } from "../order";
import { RecurrencePolicyUpdateHandler } from "./actions";

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
