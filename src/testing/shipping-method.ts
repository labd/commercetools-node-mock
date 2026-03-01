import type {
	ShippingMethod,
	ShippingMethodDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const shippingMethodDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ShippingMethodDraft, ShippingMethodDraft, ShippingMethod>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/shipping-methods",
					payload: draft,
				});

				return response.json();
			});

			return {
				name: `Shipping Method ${sequence}`,
				taxCategory: {
					typeId: "tax-category",
					key: `tax-category-${sequence}`,
				},
				isDefault: true,
				zoneRates: [],
			};
		},
	);
