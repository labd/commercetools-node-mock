import type {
	CustomObject,
	CustomObjectDraft,
} from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const customObjectDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<CustomObjectDraft, CustomObjectDraft, CustomObject>(
		({ sequence, onCreate }) => {
			onCreate(async (draft) => {
				const response = await m.app.inject({
					method: "POST",
					url: "/dummy/custom-objects",
					payload: draft,
				});

				return response.json();
			});

			return {
				container: `container-${sequence}`,
				key: `key-${sequence}`,
				value: `value-${sequence}`,
			};
		},
	);
