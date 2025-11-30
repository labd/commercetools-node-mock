import type {
	RecurrencePolicy,
	RecurrencePolicySetDescriptionAction,
	RecurrencePolicySetKeyAction,
	RecurrencePolicySetNameAction,
	RecurrencePolicySetScheduleAction,
	RecurrencePolicyUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

export class RecurrencePolicyUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<
			UpdateHandlerInterface<RecurrencePolicy, RecurrencePolicyUpdateAction>
		>
{
	setKey(
		context: RepositoryContext,
		resource: Writable<RecurrencePolicy>,
		{ key }: RecurrencePolicySetKeyAction,
	) {
		if (key) {
			resource.key = key;
		}
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<RecurrencePolicy>,
		{ description }: RecurrencePolicySetDescriptionAction,
	) {
		resource.description = description;
	}

	setName(
		context: RepositoryContext,
		resource: Writable<RecurrencePolicy>,
		{ name }: RecurrencePolicySetNameAction,
	) {
		resource.name = name;
	}

	setSchedule(
		context: RepositoryContext,
		resource: Writable<RecurrencePolicy>,
		{ schedule }: RecurrencePolicySetScheduleAction,
	) {
		resource.schedule = schedule;
	}
}
