import type {
	StandalonePrice,
	StandalonePriceDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const standalonePriceDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<StandalonePriceDraft, StandalonePriceDraft, StandalonePrice>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/standalone-prices",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `standalone-price-${sequence}`,
				sku: `sku-${sequence}`,
				value: {
					centAmount: 1000,
					currencyCode: "EUR",
				},
				active: true,
			};
		},
	);
