import type {
	InventoryEntry,
	InventoryEntryDraft,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import { InventoryEntryDraftSchema } from "#src/schemas/generated/inventory-entry.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { createCustomFields } from "../helpers.ts";
import { InventoryEntryUpdateHandler } from "./actions.ts";

export class InventoryEntryRepository extends AbstractResourceRepository<"inventory-entry"> {
	constructor(config: Config) {
		super("inventory-entry", config);
		this.actions = new InventoryEntryUpdateHandler(config.storage);
		this.draftSchema = InventoryEntryDraftSchema;
	}

	create(
		context: RepositoryContext,
		draft: InventoryEntryDraft,
	): InventoryEntry {
		const resource: InventoryEntry = {
			...getBaseResourceProperties(context.clientId),
			sku: draft.sku,
			quantityOnStock: draft.quantityOnStock,
			availableQuantity: draft.quantityOnStock,
			expectedDelivery: draft.expectedDelivery,
			restockableInDays: draft.restockableInDays,
			supplyChannel: draft.supplyChannel
				? {
						typeId: "channel",
						id: draft.supplyChannel.id ?? "",
					}
				: undefined,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}
}
