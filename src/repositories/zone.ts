import {
  ReferenceTypeId,
  Zone,
  ZoneAddLocationAction,
  ZoneChangeNameAction,
  ZoneDraft,
  ZoneRemoveLocationAction,
  ZoneSetDescriptionAction,
  ZoneSetKeyAction,
  ZoneUpdateAction,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class ZoneRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'zone'
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
      resource.locations = resource.locations.filter(loc => {
        return !(
          loc.country === location.country && loc.state === location.state
        )
      })
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
