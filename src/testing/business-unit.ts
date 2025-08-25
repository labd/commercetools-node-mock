import type {
	BusinessUnit,
	BusinessUnitDraft,
	CompanyDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import supertest from "supertest";
import type { CommercetoolsMock } from "~src/ctMock";

export const businessUnitDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<BusinessUnitDraft, BusinessUnitDraft, BusinessUnit>(
		({ onCreate }) => {
			onCreate(async (draft) => {
				const response = await supertest(m.app)
					.post("/dummy/business-units")
					.send(draft);

				return response.body;
			});

			return {
				key: "test-business-unit",
				unitType: "Company",
				name: "Test Business Unit",
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
