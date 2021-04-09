import {
  CustomObject,
  CustomObjectDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk';
import { checkConcurrentModification} from './errors';
import AbstractRepository from './abstract';
import { Writable } from 'types';

export class CustomObjectRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'key-value-document';
  }

  create(draft: Writable<CustomObjectDraft>): CustomObject {
    const current = this.getWithContainerAndKeygetBy(draft.container, draft.key)

    const baseProperties = this.getResourceProperties()
    if (current) {
      if (!draft.version) {
        draft.version = current.version
      }

      checkConcurrentModification(current, draft.version)
      if (draft.value == current.value) {
        return current
      }

      baseProperties.version = current.version
    } else {
      if (draft.version) {
        baseProperties.version = draft.version
      }
    }

    const resource: CustomObject = {
      ...baseProperties,
      container: draft.container,
      key: draft.key,
      value: draft.value,
    };
    this.save(resource);
    return resource;
  }

  getWithContainerAndKeygetBy(container: string, key: string) {
    const items = this._storage.all(this.getTypeId()) as Array<CustomObject>;
    return items.find(item => item.container == container && item.key == key);
  }
}
