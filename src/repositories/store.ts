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
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'
import { getReferenceFromResourceIdentifier } from './helpers'

export class StoreRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'store'
  }

  create(projectKey: string, draft: StoreDraft): Store {
    const resource: Store = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      languages: draft.languages,
      distributionChannels: this.transformChannels(
        projectKey,
        draft.distributionChannels
      ),
      supplyChannels: this.transformChannels(projectKey, draft.supplyChannels),
    }
    this.save(projectKey, resource)
    return resource
  }

  private transformChannels(
    projectKey: string,
    channels?: ChannelResourceIdentifier[]
  ) {
    if (!channels) return []

    return channels.map(ref =>
      getReferenceFromResourceIdentifier<ChannelReference>(
        ref,
        projectKey,
        this._storage
      )
    )
  }

    getWithKey(projectKey: string, key: string): Store | undefined {
    const result = this._storage.query(projectKey, this.getTypeId(), {
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
      (projectKey: string, resource: Writable<Store>, action: any) => void
    >
  > = {
    setName: (
      projectKey: string,
      resource: Writable<Store>,
      { name }: StoreSetNameAction
    ) => {
      resource.name = name
    },
    setDistributionChannels: (
      projectKey: string,
      resource: Writable<Store>,
      { distributionChannels }: StoreSetDistributionChannelsAction
    ) => {
      resource.distributionChannels = this.transformChannels(
        projectKey,
        distributionChannels
      )
    },
    setLanguages: (
      projectKey: string,
      resource: Writable<Store>,
      { languages }: StoreSetLanguagesAction
    ) => {
      resource.languages = languages
    },
  }
}
