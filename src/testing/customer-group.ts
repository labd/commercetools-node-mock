import type {
	CustomerGroup,
	CustomerGroupDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const customerGroupDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<CustomerGroupDraft, CustomerGroupDraft, CustomerGroup>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/customer-groups",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `customer-group-${sequence}`,
				groupName: `Customer Group ${sequence}`,
			};
		},
	);
