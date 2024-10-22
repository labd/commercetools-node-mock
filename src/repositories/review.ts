import type {
	ChannelReference,
	ProductReference,
} from "@commercetools/platform-sdk";
import {
	type Review,
	type ReviewDraft,
	type StateReference,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "~src/storage";
import { getBaseResourceProperties } from "../helpers";
import type { RepositoryContext } from "./abstract";
import { AbstractResourceRepository } from "./abstract";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "./helpers";

export class ReviewRepository extends AbstractResourceRepository<"review"> {
	constructor(storage: AbstractStorage) {
		super("review", storage);
	}

	create(context: RepositoryContext, draft: ReviewDraft): Review {
		if (!draft.target) throw new Error("Missing target");
		const resource: Review = {
			...getBaseResourceProperties(),

			locale: draft.locale,
			authorName: draft.authorName,
			title: draft.title,
			text: draft.text,
			rating: draft.rating,
			uniquenessValue: draft.uniquenessValue,
			state: draft.state
				? getReferenceFromResourceIdentifier<StateReference>(
						draft.state,
						context.projectKey,
						this._storage,
					)
				: undefined,
			target: draft.target
				? getReferenceFromResourceIdentifier<
						ProductReference | ChannelReference
					>(draft.target, context.projectKey, this._storage)
				: undefined,
			includedInStatistics: false,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}
}
