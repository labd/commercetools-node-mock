import type { Review, ReviewDraft } from "@commercetools/platform-sdk";
import { Factory } from "fishery";
import type { CommercetoolsMock } from "#src/ctMock.ts";

export const reviewDraftFactory = (m: CommercetoolsMock) =>
	Factory.define<ReviewDraft, ReviewDraft, Review>(({ sequence, onCreate }) => {
		onCreate(async (draft) => {
			const response = await m.app.inject({
				method: "POST",
				url: "/dummy/reviews",
				payload: draft,
			});

			return response.json();
		});

		return {
			key: `review-${sequence}`,
			authorName: `Author ${sequence}`,
			title: `Review ${sequence}`,
			text: `Review text ${sequence}`,
			rating: 5,
		};
	});
