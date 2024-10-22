import type {
	InventoryEntry,
	InventoryEntryChangeQuantityAction,
	InventoryEntrySetCustomFieldAction,
	InventoryEntrySetCustomTypeAction,
	InventoryEntrySetExpectedDeliveryAction,
	InventoryEntrySetRestockableInDaysAction,
	InventoryEntryUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "~src/types";
import type { UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract";

export class InventoryEntryUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<InventoryEntry, InventoryEntryUpdateAction>>
{
	changeQuantity(
		context: RepositoryContext,
		resource: Writable<InventoryEntry>,
		{ quantity }: InventoryEntryChangeQuantityAction,
	) {
		resource.quantityOnStock = quantity;
		// don't know active reservations so just set to same value
		resource.availableQuantity = quantity;
	}

	setCustomField(
		context: RepositoryContext,
		resource: InventoryEntry,
		{ name, value }: InventoryEntrySetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<InventoryEntry>,
		{ type, fields }: InventoryEntrySetCustomTypeAction,
	) {
		if (!type) {
			resource.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
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

	setExpectedDelivery(
		context: RepositoryContext,
		resource: Writable<InventoryEntry>,
		{ expectedDelivery }: InventoryEntrySetExpectedDeliveryAction,
	) {
		resource.expectedDelivery = new Date(expectedDelivery!).toISOString();
	}

	setRestockableInDays(
		context: RepositoryContext,
		resource: Writable<InventoryEntry>,
		{ restockableInDays }: InventoryEntrySetRestockableInDaysAction,
	) {
		resource.restockableInDays = restockableInDays;
	}
}
