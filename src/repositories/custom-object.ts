import {
  CustomObject,
  CustomObjectDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { checkConcurrentModification } from './errors'
import AbstractRepository from './abstract'
import { Writable } from '../types'
import { getBaseResourceProperties } from '../helpers'

export class CustomObjectRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'key-value-document'
  }

  create(projectKey: string, draft: Writable<CustomObjectDraft>): CustomObject {
    const current = this.getWithContainerAndKey(
      projectKey,
      draft.container,
      draft.key
    )

    const baseProperties = getBaseResourceProperties()
    if (current) {
      if (!draft.version) {
        draft.version = current.version
      }

      checkConcurrentModification(current, draft.version)
      if (draft.value === current.value) {
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
    }
    this.save(projectKey, resource)
    return resource
  }

  getWithContainerAndKey(projectKey: string, container: string, key: string) {
    const items = this._storage.all(projectKey, this.getTypeId()) as Array<
      CustomObject
    >
    return items.find(item => item.container === container && item.key === key)
  }
}
