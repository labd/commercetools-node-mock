import type { Zone, ZoneDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const zoneDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ZoneDraft, ZoneDraft, Zone>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/zones",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `zone-${sequence}`,
			name: `Zone ${sequence}`,
			locations: [{ country: "NL" }],
		};
	});
