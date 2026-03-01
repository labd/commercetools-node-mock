import type { Payment, PaymentDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const paymentDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<PaymentDraft, PaymentDraft, Payment>(({ onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/payments",
				payload: draft,
			});

			return response.json();
		});

		return {
			amountPlanned: {
				currencyCode: "EUR",
				centAmount: 1000,
			},
		};
	});
