import type {
	Channel,
	ChannelChangeDescriptionAction,
	ChannelChangeKeyAction,
	ChannelChangeNameAction,
	ChannelDraft,
	ChannelSetAddressAction,
	ChannelSetCustomFieldAction,
	ChannelSetCustomTypeAction,
	ChannelSetGeoLocationAction,
	ChannelUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from './abstract.js'
import { createAddress, createCustomFields } from './helpers.js'

export class ChannelRepository extends AbstractResourceRepository<'channel'> {
	getTypeId() {
		return 'channel' as const
	}

	create(context: RepositoryContext, draft: ChannelDraft): Channel {
		const resource: Channel = {
			...getBaseResourceProperties(),
			key: draft.key,
			name: draft.name,
			description: draft.description,
			roles: draft.roles || [],
			geoLocation: draft.geoLocation,
			address: createAddress(draft.address, context.projectKey, this._storage),
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
			ChannelUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<Channel>,
				action: any
			) => void
		>
	> = {
		changeKey: (
			context: RepositoryContext,
			resource: Writable<Channel>,
			{ key }: ChannelChangeKeyAction
		) => {
			resource.key = key
		},

		changeName: (
			context: RepositoryContext,
			resource: Writable<Channel>,
			{ name }: ChannelChangeNameAction
		) => {
			resource.name = name
		},

		changeDescription: (
			context: RepositoryContext,
			resource: Writable<Channel>,
			{ description }: ChannelChangeDescriptionAction
		) => {
			resource.description = description
		},

		setAddress: (
			context: RepositoryContext,
			resource: Writable<Channel>,
			{ address }: ChannelSetAddressAction
		) => {
			resource.address = createAddress(
				address,
				context.projectKey,
				this._storage
			)
		},

		setGeoLocation: (
			context: RepositoryContext,
			resource: Writable<Channel>,
			{ geoLocation }: ChannelSetGeoLocationAction
		) => {
			resource.geoLocation = geoLocation
		},

		setCustomType: (
			context: RepositoryContext,
			resource: Writable<Channel>,
			{ type, fields }: ChannelSetCustomTypeAction
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
			resource: Writable<Channel>,
			{ name, value }: ChannelSetCustomFieldAction
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
