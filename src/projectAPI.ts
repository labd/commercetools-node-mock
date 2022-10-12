import { ReferenceTypeId } from '@commercetools/platform-sdk'
import { GetParams } from 'repositories/abstract'
import { getBaseResourceProperties } from './helpers'
import { AbstractStorage } from './storage'
import {
  Repositories,
  RepositoryTypes,
  ResourceMap,
} from './types'

export class ProjectAPI {
  private projectKey: string
  private _storage: AbstractStorage
  private _repositories: Repositories

  constructor(
    projectKey: string,
    repositories: Repositories,
    storage: AbstractStorage
  ) {
    this.projectKey = projectKey
    this._storage = storage
    this._repositories = repositories
  }

  add(typeId: ReferenceTypeId, resource: ResourceMap[ReferenceTypeId]) {
    const repository = this._repositories[typeId]
    if (repository) {
      this._storage.add(this.projectKey, typeId as ReferenceTypeId, {
        ...getBaseResourceProperties(),
        ...resource,
      })
    } else {
      throw new Error(`Service for ${typeId} not implemented yet`)
    }
  }

  get<RT extends RepositoryTypes>(
    typeId: RT,
    id: string,
    params?: GetParams
  ): ResourceMap[RT] {
    return this._storage.get(
      this.projectKey,
      typeId,
      id,
      params
    ) as ResourceMap[RT]
  }

  // TODO: Not sure if we want to expose this...
  getRepository<RT extends keyof Repositories>(
    typeId: RT
  ): Repositories[RT] {
    const repository = this._repositories[typeId]
    if (repository !== undefined) {
      return repository
    }
    throw new Error('No such repository')
  }
}
