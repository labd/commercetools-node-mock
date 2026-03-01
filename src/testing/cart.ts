import type { Cart, CartDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const cartDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<CartDraft, CartDraft, Cart>(({ onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/carts",
				payload: draft,
			});

			return response.json();
		});

		return {
			currency: "EUR",
		};
	});
