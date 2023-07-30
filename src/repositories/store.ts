import {
  ChannelReference,
  ChannelResourceIdentifier,
  Store,
  StoreDraft,
  StoreSetCustomFieldAction,
  StoreSetCustomTypeAction,
  StoreSetDistributionChannelsAction,
  StoreSetLanguagesAction,
  StoreSetNameAction,
  StoreUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { Writable } from '../types'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import {
  createCustomFields,
  getReferenceFromResourceIdentifier,
} from './helpers'

export class StoreRepository extends AbstractResourceRepository<'store'> {
  getTypeId() {
    return 'store' as const
  }

  create(context: RepositoryContext, draft: StoreDraft): Store {
    const resource: Store = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      languages: draft.languages ?? [],
      countries: draft.countries ?? [],
      distributionChannels: this.transformChannels(
        context,
        draft.distributionChannels
      ),
      supplyChannels: this.transformChannels(context, draft.supplyChannels),
      productSelections: [],
      custom: createCustomFields(
        draft.custom,
        context.projectKey,
        this._storage
      ),
    }
    this.saveNew(context, resource)
    return resource
  }

  private transformChannels(
    context: RepositoryContext,
    channels?: ChannelResourceIdentifier[]
  ) {
    if (!channels) return []

    return channels.map((ref) =>
      getReferenceFromResourceIdentifier<ChannelReference>(
        ref,
        context.projectKey,
        this._storage
      )
    )
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
