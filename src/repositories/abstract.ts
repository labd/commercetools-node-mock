import { RepositoryTypes } from './../types'
import deepEqual from 'deep-equal'

import {
  BaseResource,
  InvalidOperationError,
  Project,
  UpdateAction,
} from '@commercetools/platform-sdk'
import { AbstractStorage } from '../storage'
import { checkConcurrentModification } from './errors'
import { CommercetoolsError } from '../exceptions'

export type QueryParams = {
  expand?: string[]
  where?: string[]
}

export type GetParams = {
  expand?: string[]
}

export abstract class AbstractRepository {
  protected _storage: AbstractStorage
  protected actions: Partial<Record<
    any,
    (projectKey: string, resource: any, action: any) => void
  >> = {}

  constructor(storage: AbstractStorage) {
    this._storage = storage
  }

  abstract save(projectKey: string, resource: BaseResource | Project): void

  processUpdateActions(
    projectKey: string,
    resource: BaseResource | Project,
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

export abstract class AbstractResourceRepository extends AbstractRepository {
  abstract create(projectKey: string, draft: any): BaseResource
  abstract getTypeId(): RepositoryTypes

  constructor(storage: AbstractStorage) {
    super(storage)
    this._storage.assertStorage(this.getTypeId())
  }

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

  getByKey(
    projectKey: string,
    key: string,
    params: GetParams = {}
  ): BaseResource | null {
    return this._storage.getByKey(projectKey, this.getTypeId(), key, params)
  }

  delete(
    projectKey: string,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    return this._storage.delete(projectKey, this.getTypeId(), id, params)
  }

  save(projectKey: string, resource: BaseResource) {
    const current = this.get(projectKey, resource.id)

    if (current) {
      checkConcurrentModification(current, resource.version)
    } else {
      if (resource.version !== 0) {
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
    this._storage.add(projectKey, this.getTypeId(), resource as any)
  }
}
