import type {
	OrderEdit,
	OrderEditDraft,
	OrderEditResult,
	OrderEditUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'

export class OrderEditRepository extends AbstractResourceRepository<'order-edit'> {
	getTypeId() {
		return 'order-edit' as const
	}

	create(context: RepositoryContext, draft: OrderEditDraft): OrderEdit {
		const resource: OrderEdit = {
			...getBaseResourceProperties(),
			stagedActions: draft.stagedActions ?? [],
			resource: draft.resource,
			result: {
				type: 'NotProcessed',
			} as OrderEditResult,
		}
		return this.saveNew(context, resource)
	}

	actions: Partial<
		Record<
			OrderEditUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<OrderEdit>,
				action: any
			) => void
		>
	> = {}
}
