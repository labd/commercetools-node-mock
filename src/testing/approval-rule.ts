import type {
	ApprovalRule,
	ApprovalRuleDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

type ApprovalRuleFactoryDraft = ApprovalRuleDraft & {
	businessUnit?: { typeId: "business-unit"; key: string };
};

export const approvalRuleDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<
		ApprovalRuleFactoryDraft,
		ApprovalRuleFactoryDraft,
		ApprovalRule
	>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/approval-rules",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `approval-rule-${sequence}`,
			name: `Approval Rule ${sequence}`,
			status: "Active",
			predicate: "1=1",
			approvers: { tiers: [] },
			requesters: [],
			businessUnit: { typeId: "business-unit", key: "business-unit" },
		};
	});
