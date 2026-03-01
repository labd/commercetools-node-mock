import type {
	AssociateRole,
	AssociateRoleDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const associateRoleDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<AssociateRoleDraft, AssociateRoleDraft, AssociateRole>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/associate-roles",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `associate-role-${sequence}`,
				name: `Associate Role ${sequence}`,
				buyerAssignable: false,
				permissions: ["ViewMyQuotes", "ViewMyOrders", "ViewMyCarts"],
			};
		},
	);
