import type {
	ShoppingList,
	ShoppingListDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const shoppingListDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ShoppingListDraft, ShoppingListDraft, ShoppingList>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/shopping-lists",
					payload: draft,
				});

				return response.json();
			});

			return {
				name: { en: `Shopping List ${sequence}` },
			};
		},
	);
