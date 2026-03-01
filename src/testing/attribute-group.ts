import type {
	AttributeGroup,
	AttributeGroupDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const attributeGroupDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<AttributeGroupDraft, AttributeGroupDraft, AttributeGroup>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/attribute-groups",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `attribute-group-${sequence}`,
				name: { en: `Attribute Group ${sequence}` },
				attributes: [{ key: `attribute-${sequence}` }],
			};
		},
	);
