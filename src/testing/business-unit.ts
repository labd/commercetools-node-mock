import type {
	BusinessUnit,
	BusinessUnitDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const businessUnitDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<BusinessUnitDraft, BusinessUnitDraft, BusinessUnit>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/business-units",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `business-unit-${sequence}`,
				unitType: "Company",
				name: `Test Business Unit ${sequence}`,
				status: "Active",
				contactEmail: "contact@businessunit.com",
				storeMode: "Explicit",
				associateMode: "Explicit",
				approvalRuleMode: "Explicit",
				addresses: [
					{
						firstName: "Business",
						lastName: "Contact",
						streetName: "Business Street",
						streetNumber: "100",
						postalCode: "1000 AA",
						city: "Business City",
						country: "NL",
						company: "Test Business Unit",
						phone: "+31612345678",
						email: "contact@businessunit.com",
					},
				],
				stores: [],
				associates: [],
			};
		},
	);
