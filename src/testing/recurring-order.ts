import type {
	RecurringOrder,
	RecurringOrderDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const recurringOrderDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<RecurringOrderDraft, RecurringOrderDraft, RecurringOrder>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/recurring-orders",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `recurring-order-${sequence}`,
				cart: {
					typeId: "cart" as const,
					id: "placeholder-cart-id",
				},
				cartVersion: 1,
				startsAt: "2025-01-01T10:00:00.000Z",
				expiresAt: "2025-12-31T23:59:59.000Z",
			};
		},
	);
