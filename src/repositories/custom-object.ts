import {
  CustomObject,
  CustomObjectDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk';
import AbstractRepository from './abstract';

export class CustomObjectRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'key-value-document';
  }

  create(draft: CustomObjectDraft): CustomObject {
    const resource: CustomObject = {
      ...this.getResourceProperties(),
      container: draft.container,
      key: draft.key,
      value: draft.value,
    };
    this.save(resource);
    return resource;
  }

  getWithContainerAndKeygetBy(container: string, key: string) {
    const items = this._storage.all('key-value-document') as Array<
      CustomObject
    >;
    return items.find(item => item.container == container && item.key == key);
  }
}
