import type {
	CartDiscount,
	CartDiscountDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const cartDiscountDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<CartDiscountDraft, CartDiscountDraft, CartDiscount>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/cart-discounts",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `cart-discount-${sequence}`,
				name: { en: `Cart Discount ${sequence}` },
				value: {
					type: "relative",
					permyriad: 1000,
				},
				sortOrder: `0.${sequence}`,
				cartPredicate: "1=1",
				isActive: false,
				requiresDiscountCode: false,
			};
		},
	);
