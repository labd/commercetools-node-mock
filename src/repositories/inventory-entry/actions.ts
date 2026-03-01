import type {
	InvalidOperationError,
	InventoryEntry,
	InventoryEntryChangeQuantityAction,
	InventoryEntryRemoveQuantityAction,
	InventoryEntrySetCustomFieldAction,
	InventoryEntrySetCustomTypeAction,
	InventoryEntrySetExpectedDeliveryAction,
	InventoryEntrySetRestockableInDaysAction,
	InventoryEntryUpdateAction,
	ReferencedResourceNotFoundError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

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

	removeQuantity(
		context: RepositoryContext,
		resource: Writable<InventoryEntry>,
		{ quantity }: InventoryEntryRemoveQuantityAction,
	) {
		const newQuantity = Math.max(0, resource.quantityOnStock - quantity);
		resource.quantityOnStock = newQuantity;
		// don't know active reservations so just set to same value
		resource.availableQuantity = newQuantity;
	}

	setCustomField(
		context: RepositoryContext,
		resource: InventoryEntry,
		{ name, value }: InventoryEntrySetCustomFieldAction,
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
