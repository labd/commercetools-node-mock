import { v4 as uuidv4 } from 'uuid'
import deepEqual from 'deep-equal'

import {
  BaseResource,
  InvalidOperationError,
  ReferenceTypeId,
  UpdateAction,
} from '@commercetools/platform-sdk'
import { AbstractStorage } from '../storage'
import { checkConcurrentModification } from './errors'
import { CommercetoolsError } from '../exceptions'

type QueryParams = {
  expand?: string[]
  where?: string[]
}

type GetParams = {
  expand?: string[]
}

export default abstract class AbstractRepository {
  protected _storage: AbstractStorage

  protected actions: {
    [key: string]: (projectKey: string, resource: any, actions: any) => void
  } = {}

  constructor(storage: AbstractStorage) {
    this._storage = storage
    this._storage.assertStorage(this.getTypeId())
  }

  abstract getTypeId(): ReferenceTypeId
  abstract create(projectKey: string, draft: any): BaseResource

  query(projectKey: string, params: QueryParams = {}) {
    return this._storage.query(projectKey, this.getTypeId(), {
      expand: params.expand,
      where: params.where,
    })
  }

  get(
    projectKey: string,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    return this._storage.get(projectKey, this.getTypeId(), id, params)
  }

  delete(
    projectKey: string,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    return this._storage.delete(projectKey, this.getTypeId(), id, params)
  }

  save(projectKey: string, resource: BaseResource) {
    const typeId = this.getTypeId()

    const current = this.get(projectKey, resource.id)
    if (current) {
      checkConcurrentModification(current, resource.version)
    } else {
      if (resource.version != 0) {
        throw new CommercetoolsError<InvalidOperationError>(
          {
            code: 'InvalidOperation',
            message: 'version on create must be 0',
          },
          400
        )
      }
    }

    // @ts-ignore
    resource.version += 1
    this._storage.add(projectKey, typeId, resource as any)
  }

  processUpdateActions(
    projectKey: string,
    resource: BaseResource,
    actions: UpdateAction[]
  ): BaseResource {
    // Deep-copy
    const modifiedResource = JSON.parse(JSON.stringify(resource))

    actions.forEach(action => {
      const updateFunc = this.actions[action.action]
      if (!updateFunc) {
        console.error(`No mock implemented for update action ${action.action}`)
        return
      }
      updateFunc(projectKey, modifiedResource, action)
    })

    if (!deepEqual(modifiedResource, resource)) {
      this.save(projectKey, modifiedResource)
    }
    return modifiedResource
  }
}
