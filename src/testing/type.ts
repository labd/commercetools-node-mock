import type { Type, TypeDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import supertest from "supertest";
import type { CommercetoolsMock } from "~src/ctMock";

export const typeDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<TypeDraft, TypeDraft, Type>(({ onCreate }) => {
		onCreate(async (draft) => {
			const response = await supertest(m.app).post("/dummy/types").send(draft);

			return response.body;
		});

		return {
			key: "type",
			name: { en: "Type Name" },
			resourceTypeIds: ["product"],
			description: { en: "Type description" },
		};
	});
