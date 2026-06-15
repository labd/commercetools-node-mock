import type { ApprovalFlow } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";
import type { ApprovalFlowDraft } from "#src/repositories/approval-flow.ts";

export const approvalFlowDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ApprovalFlowDraft, ApprovalFlowDraft, ApprovalFlow>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/approval-flows",
					payload: draft,
				});

				return response.json();
			});

			return {
				order: {
					typeId: "order",
					id: `order-id-placeholder-${sequence}`,
				},
				businessUnit: {
					typeId: "business-unit",
					key: "business-unit",
				},
				status: "Pending",
			};
		},
	);
