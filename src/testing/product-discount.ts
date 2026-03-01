import type {
	ProductDiscount,
	ProductDiscountDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const productDiscountDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ProductDiscountDraft, ProductDiscountDraft, ProductDiscount>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/product-discounts",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `product-discount-${sequence}`,
				name: { en: `Product Discount ${sequence}` },
				value: {
					type: "relative",
					permyriad: 2000,
				},
				predicate: "1=1",
				sortOrder: `0.${sequence}`,
				isActive: true,
			};
		},
	);
