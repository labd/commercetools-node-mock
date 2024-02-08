import {
	ChannelReference,
	ProductReference,
	type Review,
	type ReviewDraft,
	type ReviewUpdateAction,
	type StateReference,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'
import {
	createCustomFields,
	getReferenceFromResourceIdentifier,
} from './helpers.js'

export class ReviewRepository extends AbstractResourceRepository<'review'> {
	getTypeId() {
		return 'review' as const
	}

	create(context: RepositoryContext, draft: ReviewDraft): Review {
		if (!draft.target) throw new Error('Missing target')
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
						this._storage
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
				this._storage
			),
		}
		this.saveNew(context, resource)
		return resource
	}

	actions: Partial<
		Record<
			ReviewUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<Review>,
				action: any
			) => void
		>
	> = {}
}
