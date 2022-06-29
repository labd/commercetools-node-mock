import {
  Channel,
  ChannelDraft,
  ChannelSetCustomFieldAction,
  ChannelSetCustomTypeAction,
  ChannelUpdateAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { createAddress, createCustomFields } from './helpers'

export class ChannelRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'channel'
  }

  create(context: RepositoryContext, draft: ChannelDraft): Channel {
    const resource: Channel = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      description: draft.description,
      roles: draft.roles || [],
      geoLocation: draft.geoLocation,
      address: createAddress(
        draft.address,
        context.projectKey,
        this._storage
      ),
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }
    this.save(context, resource)
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
