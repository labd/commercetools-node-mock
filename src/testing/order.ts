import type { Order, OrderFromCartDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const orderDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<OrderFromCartDraft, OrderFromCartDraft, Order>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/orders",
					payload: draft,
				});

				return response.json();
			});

			return {
				cart: {
					typeId: "cart" as const,
					id: "cart-id-placeholder",
				},
				version: 1,
				orderNumber: `order-${sequence}`,
			};
		},
	);
