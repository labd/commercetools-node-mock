import type { State, StateDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const stateDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<StateDraft, StateDraft, State>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/states",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `state-${sequence}`,
			type: "PaymentState",
		};
	});
