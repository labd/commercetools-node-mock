import type {
	CustomerGroup,
	CustomerGroupChangeNameAction,
	CustomerGroupDraft,
	CustomerGroupSetCustomFieldAction,
	CustomerGroupSetCustomTypeAction,
	CustomerGroupSetKeyAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from './abstract.js'
import { createCustomFields } from './helpers.js'

export class CustomerGroupRepository extends AbstractResourceRepository<'customer-group'> {
	getTypeId() {
		return 'customer-group' as const
	}
	create(context: RepositoryContext, draft: CustomerGroupDraft): CustomerGroup {
		const resource: CustomerGroup = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.groupName,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage
			),
		}
		this.saveNew(context, resource)
		return resource
	}

	actions = {
		setKey: (
			context: RepositoryContext,
			resource: Writable<CustomerGroup>,
			{ key }: CustomerGroupSetKeyAction
		) => {
			resource.key = key
		},
		changeName: (
			context: RepositoryContext,
			resource: Writable<CustomerGroup>,
			{ name }: CustomerGroupChangeNameAction
		) => {
			resource.name = name
		},
		setCustomType: (
			context: RepositoryContext,
			resource: Writable<CustomerGroup>,
			{ type, fields }: CustomerGroupSetCustomTypeAction
		) => {
			if (type) {
				resource.custom = createCustomFields(
					{ type, fields },
					context.projectKey,
					this._storage
				)
			} else {
				resource.custom = undefined
			}
		},
		setCustomField: (
			context: RepositoryContext,
			resource: Writable<CustomerGroup>,
			{ name, value }: CustomerGroupSetCustomFieldAction
		) => {
			if (!resource.custom) {
				return
			}
			if (value === null) {
				delete resource.custom.fields[name]
			} else {
				resource.custom.fields[name] = value
			}
		},
	}
}
