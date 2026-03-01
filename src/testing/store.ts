import type { Store, StoreDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const storeDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<StoreDraft, StoreDraft, Store>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/stores",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `store-${sequence}`,
			name: { en: `Store ${sequence}` },
			languages: [],
			countries: [],
			distributionChannels: [],
			supplyChannels: [],
			productSelections: [],
		};
	});
