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

  abstract save(
    { projectKey }: RepositoryContext,
    resource: BaseResource | Project
  ): void

  processUpdateActions(
    context: RepositoryContext,
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
      updateFunc(context, modifiedResource, action)
    })

    if (!deepEqual(modifiedResource, resource)) {
      this.save(context, modifiedResource)
    }

    const result = this.postProcessResource(modifiedResource)
    if (!result) {
      throw new Error("invalid post process action")
    }
    return result
  }

  postProcessResource(resource: BaseResource | null): BaseResource | null {
    return resource
  }

}

export abstract class AbstractResourceRepository extends AbstractRepository {
  abstract create(context: RepositoryContext, draft: any): BaseResource
  abstract getTypeId(): RepositoryTypes

  constructor(storage: AbstractStorage) {
    super(storage)
    this._storage.assertStorage(this.getTypeId())
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
    const resource = this._storage.get(context.projectKey, this.getTypeId(), id, params)
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

  save(context: RepositoryContext, resource: BaseResource) {
    const current = this.get(context, resource.id)

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
    this._storage.add(context.projectKey, this.getTypeId(), resource as any)
  }
}
