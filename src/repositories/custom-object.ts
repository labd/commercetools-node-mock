import {
  CustomObject,
  CustomObjectDraft,
  InvalidOperationError,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { checkConcurrentModification } from './errors'
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { Writable } from '../types'
import { cloneObject, getBaseResourceProperties } from '../helpers'
import { CommercetoolsError } from '../exceptions'

export class CustomObjectRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'key-value-document'
  }

  create(
    context: RepositoryContext,
    draft: Writable<CustomObjectDraft>
  ): CustomObject {
    const current = this.getWithContainerAndKey(
      context,
      draft.container,
      draft.key
    ) as Writable<CustomObject | undefined>

    if (current) {

      // Only check version if it is passed in the draft
      if (draft.version) {
        checkConcurrentModification(current.version, draft.version, current.id)
      } else {
        draft.version = current.version
      }

      if (draft.value !== current.value) {
        const updated = cloneObject(current)
        updated.value = draft.value
        updated.version += 1
        this.saveUpdate(context, draft.version, updated)
        return updated
      }
      return current

    } else  {
      // If the resource is new the only valid version is 0
      if (draft.version) {
        throw new CommercetoolsError<InvalidOperationError>(
          {
            code: 'InvalidOperation',
            message: 'version on create must be 0',
          },
          400
        )
      }
      const baseProperties = getBaseResourceProperties()
      const resource: CustomObject = {
        ...baseProperties,
        container: draft.container,
        key: draft.key,
        value: draft.value,
      }

      this.saveNew(context, resource)
      return resource
    }
  }

  getWithContainerAndKey(
    context: RepositoryContext,
    container: string,
    key: string
  ) {
    const items = this._storage.all(
      context.projectKey,
      this.getTypeId()
    ) as Array<CustomObject>
    return items.find(
      (item) => item.container === container && item.key === key
    )
  }
}
