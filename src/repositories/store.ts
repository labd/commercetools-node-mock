import { Store, StoreDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class StoreRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'store'
  }

  create(projectKey: string, draft: StoreDraft): Store {
    const resource: Store = {
      ...getBaseResourceProperties(),
      key: draft.key,
      distributionChannels: [],
    }
    this.save(projectKey, resource)
    return resource
  }
}
