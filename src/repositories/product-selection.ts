import type {
	ProductSelection,
	ProductSelectionChangeNameAction,
	ProductSelectionDraft,
	ProductSelectionUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'

export class ProductSelectionRepository extends AbstractResourceRepository<'product-selection'> {
	getTypeId() {
		return 'product-selection' as const
	}

	create(
		context: RepositoryContext,
		draft: ProductSelectionDraft
	): ProductSelection {
		const resource: ProductSelection = {
			...getBaseResourceProperties(),
			productCount: 0,
			key: draft.key,
			name: draft.name,
			mode: 'Individual',
		}
		this.saveNew(context, resource)
		return resource
	}

	actions: Partial<
		Record<
			ProductSelectionUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<ProductSelection>,
				action: any
			) => void
		>
	> = {
		changeName: (
			context: RepositoryContext,
			resource: Writable<ProductSelection>,
			{ name }: ProductSelectionChangeNameAction
		) => {
			resource.name = name
		},
	}
}
