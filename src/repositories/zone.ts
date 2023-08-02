import type {
	Zone,
	ZoneAddLocationAction,
	ZoneChangeNameAction,
	ZoneDraft,
	ZoneRemoveLocationAction,
	ZoneSetDescriptionAction,
	ZoneSetKeyAction,
	ZoneUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'

export class ZoneRepository extends AbstractResourceRepository<'zone'> {
	getTypeId() {
		return 'zone' as const
	}

	create(context: RepositoryContext, draft: ZoneDraft): Zone {
		const resource: Zone = {
			...getBaseResourceProperties(),
			key: draft.key,
			locations: draft.locations || [],
			name: draft.name,
			description: draft.description,
		}
		this.saveNew(context, resource)
		return resource
	}

	actions: Partial<
		Record<
			ZoneUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<Zone>,
				action: any
			) => void
		>
	> = {
		addLocation: (
			context: RepositoryContext,
			resource: Writable<Zone>,
			{ location }: ZoneAddLocationAction
		) => {
			resource.locations.push(location)
		},
		removeLocation: (
			context: RepositoryContext,
			resource: Writable<Zone>,
			{ location }: ZoneRemoveLocationAction
		) => {
			resource.locations = resource.locations.filter(
				(loc) =>
					!(loc.country === location.country && loc.state === location.state)
			)
		},
		changeName: (
			context: RepositoryContext,
			resource: Writable<Zone>,
			{ name }: ZoneChangeNameAction
		) => {
			resource.name = name
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<Zone>,
			{ description }: ZoneSetDescriptionAction
		) => {
			resource.description = description
		},
		setKey: (
			context: RepositoryContext,
			resource: Writable<Zone>,
			{ key }: ZoneSetKeyAction
		) => {
			resource.key = key
		},
	}
}
