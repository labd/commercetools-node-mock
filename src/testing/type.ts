import type { Type, TypeDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const typeDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<TypeDraft, TypeDraft, Type>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/types",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `type-${sequence}`,
			name: { en: `Type Name ${sequence}` },
			resourceTypeIds: ["product"],
			description: { en: "Type description" },
		};
	});
