import type {
	RecurrencePolicy,
	RecurrencePolicyDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const recurrencePolicyDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<
		RecurrencePolicyDraft,
		RecurrencePolicyDraft,
		RecurrencePolicy
	>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/recurrence-policies",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `recurrence-policy-${sequence}`,
			name: { en: `Recurrence Policy ${sequence}` },
			schedule: {
				type: "standard",
				value: 1,
				intervalUnit: "Months",
			},
		};
	});
