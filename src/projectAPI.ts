import { ReferenceTypeId } from '@commercetools/platform-sdk'
import { GetParams } from 'repositories/abstract'
import { getBaseResourceProperties } from './helpers'
import { AbstractStorage } from './storage'
import {
  RepositoryMap,
  RepositoryTypes,
  ResourceMap,
  Services,
  ServiceTypes,
} from './types'

export class ProjectAPI {
  private projectKey: string
  private _storage: AbstractStorage
  private _services: Services

  constructor(
    projectKey: string,
    services: Services,
    storage: AbstractStorage
  ) {
    this.projectKey = projectKey
    this._storage = storage
    this._services = services
  }

  add(typeId: ReferenceTypeId, resource: ResourceMap[ReferenceTypeId]) {
    const service = this._services[typeId]
    if (service) {
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
  getRepository<RT extends keyof RepositoryMap>(
    typeId: ServiceTypes
  ): RepositoryMap[RT] {
    const service = this._services[typeId]
    if (service !== undefined) {
      return service.repository as RepositoryMap[RT]
    }
    throw new Error('No such repository')
  }
}
