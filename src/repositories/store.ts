import {
  Store,
  StoreDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk';
import AbstractRepository from './abstract';

export class StoreRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'store';
  }

  create(draft: StoreDraft): Store {
    const resource: Store = {
      ...this.getResourceProperties(),
      key: draft.key,
      distributionChannels: [],
    };
    this.save(resource);
    return resource;
  }
}
