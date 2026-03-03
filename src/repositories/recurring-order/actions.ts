import type {
	RecurringOrder,
	RecurringOrderSetCustomFieldAction,
	RecurringOrderSetCustomTypeAction,
	RecurringOrderSetExpiresAtAction,
	RecurringOrderSetKeyAction,
	RecurringOrderSetOrderSkipConfigurationAction,
	RecurringOrderSetScheduleAction,
	RecurringOrderSetStartsAtAction,
	RecurringOrderSetStateAction,
	RecurringOrderTransitionStateAction,
	RecurringOrderUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

export class RecurringOrderUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<RecurringOrder, RecurringOrderUpdateAction>>
{
	setCustomField(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ name, value }: RecurringOrderSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ type, fields }: RecurringOrderSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	setExpiresAt(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ expiresAt }: RecurringOrderSetExpiresAtAction,
	) {
		resource.expiresAt = expiresAt;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ key }: RecurringOrderSetKeyAction,
	) {
		resource.key = key;
	}

	setOrderSkipConfiguration(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{
			skipConfigurationInputDraft,
			updatedExpiresAt,
		}: RecurringOrderSetOrderSkipConfigurationAction,
	) {
		if (skipConfigurationInputDraft) {
			resource.skipConfiguration = {
				type: skipConfigurationInputDraft.type,
				totalToSkip: skipConfigurationInputDraft.totalToSkip,
				skipped: 0,
				lastSkippedAt: undefined,
			};
		} else {
			resource.skipConfiguration = undefined;
		}
		if (updatedExpiresAt !== undefined) {
			resource.expiresAt = updatedExpiresAt;
		}
	}

	setSchedule(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ recurrencePolicy }: RecurringOrderSetScheduleAction,
	) {
		resource.schedule = {
			...resource.schedule,
			...recurrencePolicy,
		};
	}

	setStartsAt(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ startsAt }: RecurringOrderSetStartsAtAction,
	) {
		resource.startsAt = startsAt;
	}

	setRecurringOrderState(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ recurringOrderState }: RecurringOrderSetStateAction,
	) {
		// Map the state draft to the actual state
		switch (recurringOrderState.type) {
			case "active":
				resource.recurringOrderState = "Active";
				if (recurringOrderState.resumesAt) {
					resource.resumesAt = recurringOrderState.resumesAt;
				}
				break;
			case "canceled":
				resource.recurringOrderState = "Canceled";
				break;
			case "expired":
				resource.recurringOrderState = "Expired";
				break;
			case "paused":
				resource.recurringOrderState = "Paused";
				break;
		}
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ state, force }: RecurringOrderTransitionStateAction,
	) {
		resource.state = {
			typeId: "state",
			id: state.id!,
		};
	}
}
