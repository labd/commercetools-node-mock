import {
  Store,
  StoreDraft,
  ReferenceTypeId,
  StoreUpdateAction,
  StoreSetNameAction,
  ChannelReference,
  StoreSetDistributionChannelsAction,
  ChannelResourceIdentifier,
  StoreSetLanguagesAction,
  StoreSetCustomFieldAction,
  StoreSetCustomTypeAction,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import {
  getReferenceFromResourceIdentifier,
  createCustomFields,
} from './helpers'

export class StoreRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'store'
  }

  create(context: RepositoryContext, draft: StoreDraft): Store {
    const resource: Store = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      languages: draft.languages ?? [],
      distributionChannels: this.transformChannels(
        context,
        draft.distributionChannels
      ),
      supplyChannels: this.transformChannels(context, draft.supplyChannels),
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }
    this.save(context, resource)
    return resource
  }

  private transformChannels(
    context: RepositoryContext,
    channels?: ChannelResourceIdentifier[]
  ) {
    if (!channels) return []

    return channels.map(ref =>
      getReferenceFromResourceIdentifier<ChannelReference>(
        ref,
        context.projectKey,
        this._storage
      )
    )
  }

  getWithKey(context: RepositoryContext, key: string): Store | undefined {
    const result = this._storage.query(context.projectKey, this.getTypeId(), {
      where: [`key="${key}"`],
    })
    if (result.count === 1) {
      return result.results[0] as Store
    }

    if (result.count > 1) {
      throw new Error('Duplicate store key')
    }

    return
  }

  actions: Partial<
    Record<
      StoreUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<Store>,
        action: any
      ) => void
    >
  > = {
    setName: (
      context: RepositoryContext,
      resource: Writable<Store>,
      { name }: StoreSetNameAction
    ) => {
      resource.name = name
    },
    setDistributionChannels: (
      context: RepositoryContext,
      resource: Writable<Store>,
      { distributionChannels }: StoreSetDistributionChannelsAction
    ) => {
      resource.distributionChannels = this.transformChannels(
        context,
        distributionChannels
      )
    },
    setLanguages: (
      context: RepositoryContext,
      resource: Writable<Store>,
      { languages }: StoreSetLanguagesAction
    ) => {
      resource.languages = languages ?? []
    },
    setCustomType: (
      context: RepositoryContext,
      resource: Writable<Store>,
      { type, fields }: StoreSetCustomTypeAction
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
      resource: Writable<Store>,
      { name, value }: StoreSetCustomFieldAction
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
