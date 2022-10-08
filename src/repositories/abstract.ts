import { RepositoryTypes, Writable } from './../types'
import deepEqual from 'deep-equal'

import {
  BaseResource,
  Project,
  ResourceNotFoundError,
  UpdateAction,
} from '@commercetools/platform-sdk'
import { AbstractStorage } from '../storage'
import { checkConcurrentModification } from './errors'
import { CommercetoolsError } from '../exceptions'
import { cloneObject } from '../helpers'

export type QueryParams = {
  expand?: string[]
  where?: string[]
  offset?: number
  limit?: number
}

export type GetParams = {
  expand?: string[]
}

export type RepositoryContext = {
  projectKey: string
  storeKey?: string
}
export abstract class AbstractRepository {
  protected _storage: AbstractStorage
  protected actions: Partial<
    Record<
      any,
      (context: RepositoryContext, resource: any, action: any) => void
    >
  > = {}

  constructor(storage: AbstractStorage) {
    this._storage = storage
  }

  abstract saveNew(
    { projectKey }: RepositoryContext,
    resource: BaseResource | Project
  ): void

  abstract saveUpdate(
    { projectKey }: RepositoryContext,
    version: number,
    resource: BaseResource | Project
  ): void

  processUpdateActions<T extends BaseResource | Project>(
    context: RepositoryContext,
    resource: T,
    version: number,
    actions: UpdateAction[]
  ): T {
    // Deep-copy
    const updatedResource = cloneObject(resource) as Writable<
      BaseResource | Project
    >
    const identifier = (resource as BaseResource).id
      ? (resource as BaseResource).id
      : (resource as Project).key

    actions.forEach((action) => {
      const updateFunc = this.actions[action.action]

      if (!updateFunc) {
        console.error(`No mock implemented for update action ${action.action}`)
        throw new Error(
          `No mock implemented for update action ${action.action}`
        )
      }

      const beforeUpdate = cloneObject(resource)
      updateFunc(context, updatedResource, action)

      // Check if the object is updated. We need to increase the version of
      // an object per action which does an actual modification.
      // This isn't the most performant method to do this (the update action
      // should return a flag) but for now the easiest.
      if (!deepEqual(beforeUpdate, updatedResource)) {
        // We only check the version when there is an actual modification to
        // be stored.
        checkConcurrentModification(version, resource.version, identifier)

        updatedResource.version += 1
      }
    })

    // If all actions succeeded we write the new version
    // to the storage.
    if (resource.version != updatedResource.version) {
      this.saveUpdate(context, version, updatedResource)
    }

    const result = this.postProcessResource(updatedResource)
    if (!result) {
      throw new Error('invalid post process action')
    }
    return result as T
  }

  postProcessResource<T extends BaseResource | Project | null>(resource: T): T {
    return resource
  }
}

export abstract class AbstractResourceRepository extends AbstractRepository {
  abstract create(context: RepositoryContext, draft: any): BaseResource
  abstract getTypeId(): RepositoryTypes

  constructor(storage: AbstractStorage) {
    super(storage)
  }

  query(context: RepositoryContext, params: QueryParams = {}) {
    const result = this._storage.query(context.projectKey, this.getTypeId(), {
      expand: params.expand,
      where: params.where,
      offset: params.offset,
      limit: params.limit,
    })

    // @ts-ignore
    result.results = result.results.map(this.postProcessResource)

    return result
  }

  get(
    context: RepositoryContext,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    const resource = this._storage.get(
      context.projectKey,
      this.getTypeId(),
      id,
      params
    )
    return this.postProcessResource(resource)
  }

  getByKey(
    context: RepositoryContext,
    key: string,
    params: GetParams = {}
  ): BaseResource | null {
    const resource = this._storage.getByKey(
      context.projectKey,
      this.getTypeId(),
      key,
      params
    )
    return this.postProcessResource(resource)
  }

  delete(
    context: RepositoryContext,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    const resource = this._storage.delete(
      context.projectKey,
      this.getTypeId(),
      id,
      params
    )
    return this.postProcessResource(resource)
  }

  saveNew(context: RepositoryContext, resource: Writable<BaseResource>) {
    resource.version = 1
    this._storage.add(context.projectKey, this.getTypeId(), resource as any)
  }

  saveUpdate(
    context: RepositoryContext,
    version: number,
    resource: Writable<BaseResource>
  ) {
    // Check if the resource still exists.
    const current = this._storage.get(
      context.projectKey,
      this.getTypeId(),
      resource.id
    )
    if (!current) {
      throw new CommercetoolsError<ResourceNotFoundError>(
        {
          code: 'ResourceNotFound',
          message: 'Resource not found while updating',
        },
        400
      )
    }

    checkConcurrentModification(current.version, version, resource.id)

    if (current.version === resource.version) {
      throw new Error('Internal error: no changes to save')
    }
    resource.lastModifiedAt = new Date().toISOString()

    this._storage.add(context.projectKey, this.getTypeId(), resource as any)

    return resource
  }
}
