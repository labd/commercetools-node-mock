import type {
	ProductSelection,
	ProductSelectionDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const productSelectionDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<
		ProductSelectionDraft,
		ProductSelectionDraft,
		ProductSelection
	>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/product-selections",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `product-selection-${sequence}`,
			name: { en: `Product Selection ${sequence}` },
		};
	});
