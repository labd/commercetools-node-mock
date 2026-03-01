import type { Channel, ChannelDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const channelDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ChannelDraft, ChannelDraft, Channel>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/channels",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `channel-${sequence}`,
				roles: ["InventorySupply"],
			};
		},
	);
