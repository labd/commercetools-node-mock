import type { Extension, ExtensionDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const extensionDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ExtensionDraft, ExtensionDraft, Extension>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/extensions",
					payload: draft,
				});

				return response.json();
			});

			return {
				key: `extension-${sequence}`,
				destination: {
					type: "HTTP",
					url: `https://example.com/webhook-${sequence}`,
				},
				triggers: [
					{
						resourceTypeId: "order",
						actions: ["Create"],
					},
				],
			};
		},
	);
