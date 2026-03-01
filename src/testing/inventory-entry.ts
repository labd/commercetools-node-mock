import type {
	InventoryEntry,
	InventoryEntryDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const inventoryEntryDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<InventoryEntryDraft, InventoryEntryDraft, InventoryEntry>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/inventory",
					payload: draft,
				});

				return response.json();
			});

			return {
				sku: `sku-${sequence}`,
				quantityOnStock: 100,
			};
		},
	);
