import type {
	DiscountCode,
	DiscountCodeDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const discountCodeDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<DiscountCodeDraft, DiscountCodeDraft, DiscountCode>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/discount-codes",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `discount-code-${sequence}`,
				code: `SAVE${sequence}`,
				name: { en: `Discount Code ${sequence}` },
				cartDiscounts: [],
				isActive: true,
			};
		},
	);
