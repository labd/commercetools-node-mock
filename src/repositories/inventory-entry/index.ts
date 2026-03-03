import type {
	ChannelReference,
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
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "../helpers.ts";
import { InventoryEntryUpdateHandler } from "./actions.ts";

export class InventoryEntryRepository extends AbstractResourceRepository<"inventory-entry"> {
	constructor(config: Config) {
		super("inventory-entry", config);
		this.actions = new InventoryEntryUpdateHandler(config.storage);
		this.draftSchema = InventoryEntryDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: InventoryEntryDraft,
	): Promise<InventoryEntry> {
		const resource: InventoryEntry = {
			...getBaseResourceProperties(context.clientId),
			sku: draft.sku,
			quantityOnStock: draft.quantityOnStock,
			availableQuantity: draft.quantityOnStock,
			expectedDelivery: draft.expectedDelivery,
			restockableInDays: draft.restockableInDays,
			supplyChannel: draft.supplyChannel
				? await getReferenceFromResourceIdentifier<ChannelReference>(
						draft.supplyChannel,
						context.projectKey,
						this._storage,
					)
				: undefined,
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return await this.saveNew(context, resource);
	}
}
