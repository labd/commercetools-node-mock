import type { Category, CategoryDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const categoryDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<CategoryDraft, CategoryDraft, Category>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/categories",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `category-${sequence}`,
				name: { en: `Category ${sequence}` },
				slug: { en: `category-${sequence}` },
				orderHint: "0.1",
			};
		},
	);
