import type {
	InvalidOperationError,
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
	ReferencedResourceNotFoundError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
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
		if (!resource.custom) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "Resource has no custom field",
				},
				400,
			);
		}
		if (value === null) {
			delete resource.custom.fields[name];
		} else {
			resource.custom.fields[name] = value;
		}
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<RecurringOrder>,
		{ type, fields }: RecurringOrderSetCustomTypeAction,
	) {
		if (!type) {
			resource.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new CommercetoolsError<ReferencedResourceNotFoundError>(
					{
						code: "ReferencedResourceNotFound",
						message: `Type ${type} not found`,
						typeId: "type",
						id: type.id,
						key: type.key,
					},
					400,
				);
			}

			resource.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields || {},
			};
		}
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
