import type {
	QuoteRequest,
	QuoteRequestDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const quoteRequestDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<QuoteRequestDraft, QuoteRequestDraft, QuoteRequest>(
		({ onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/quote-requests",
					payload: draft,
				});

				return response.json();
			});

			return {
				cart: {
					typeId: "cart" as const,
					id: "placeholder-cart-id",
				},
				cartVersion: 1,
			};
		},
	);
