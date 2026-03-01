import type {
	DiscountGroup,
	DiscountGroupDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const discountGroupDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<DiscountGroupDraft, DiscountGroupDraft, DiscountGroup>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/discount-groups",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `discount-group-${sequence}`,
				name: { en: `Discount Group ${sequence}` },
				sortOrder: `0.${sequence}`,
			};
		},
	);
