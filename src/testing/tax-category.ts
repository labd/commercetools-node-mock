import type {
	TaxCategory,
	TaxCategoryDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const taxCategoryDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<TaxCategoryDraft, TaxCategoryDraft, TaxCategory>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/tax-categories",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `tax-category-${sequence}`,
				name: `Tax Category ${sequence}`,
				rates: [],
			};
		},
	);
