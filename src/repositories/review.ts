import type {
	ChannelReference,
	ProductReference,
} from "@commercetools/platform-sdk";
import type {
	Review,
	ReviewDraft,
	ReviewSetAuthorNameAction,
	ReviewSetCustomFieldAction,
	ReviewSetCustomTypeAction,
	ReviewSetCustomerAction,
	ReviewSetKeyAction,
	ReviewSetLocaleAction,
	ReviewSetRatingAction,
	ReviewSetTargetAction,
	ReviewSetTextAction,
	ReviewSetTitleAction,
	ReviewTransitionStateAction,
	ReviewUpdateAction,
	StateReference,
} from "@commercetools/platform-sdk";
import type { Config } from "~src/config";
import { getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import type { RepositoryContext, UpdateHandlerInterface } from "./abstract";
import { AbstractResourceRepository, AbstractUpdateHandler } from "./abstract";
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from "./helpers";

export class ReviewRepository extends AbstractResourceRepository<"review"> {
	constructor(config: Config) {
		super("review", config);
		this.actions = new ReviewUpdateHandler(config.storage);
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

class ReviewUpdateHandler
	extends AbstractUpdateHandler
	implements UpdateHandlerInterface<Review, ReviewUpdateAction>
{
	setAuthorName(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ authorName }: ReviewSetAuthorNameAction,
	) {
		resource.authorName = authorName;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ name, value }: ReviewSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ type, fields }: ReviewSetCustomTypeAction,
	) {
		if (!type) {
			resource.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
			}

			resource.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields ?? {},
			};
		}
	}

	setCustomer(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ customer }: ReviewSetCustomerAction,
	) {
		resource.customer = customer
			? getReferenceFromResourceIdentifier(
					customer,
					context.projectKey,
					this._storage,
				)
			: undefined;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ key }: ReviewSetKeyAction,
	) {
		resource.key = key;
	}

	setLocale(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ locale }: ReviewSetLocaleAction,
	) {
		resource.locale = locale;
	}

	setRating(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ rating }: ReviewSetRatingAction,
	) {
		resource.rating = rating;
	}

	setTarget(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ target }: ReviewSetTargetAction,
	) {
		resource.target = getReferenceFromResourceIdentifier<
			ProductReference | ChannelReference
		>(target, context.projectKey, this._storage);
	}

	setText(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ text }: ReviewSetTextAction,
	) {
		resource.text = text;
	}

	setTitle(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ title }: ReviewSetTitleAction,
	) {
		resource.title = title;
	}

	transitionState(
		context: RepositoryContext,
		resource: Writable<Review>,
		{ state }: ReviewTransitionStateAction,
	) {
		resource.state = getReferenceFromResourceIdentifier<StateReference>(
			state,
			context.projectKey,
			this._storage,
		);
	}
}
