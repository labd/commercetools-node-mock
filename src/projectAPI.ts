import { GetParams } from 'repositories/abstract'
import { getBaseResourceProperties } from './helpers'
import { AbstractStorage } from './storage'
import { RepositoryMap, ResourceMap, Services } from './types'

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

  add<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId | 'custom-object',
    resource: ResourceMap[ReferenceTypeId]
  ) {
    //@ts-ignore
    if (typeId === 'custom-object') typeId = 'key-value-document'

    const parsedTypeId = typeId as ReferenceTypeId

    const service = this._services[parsedTypeId]
    if (service) {
      this._storage.add(this.projectKey, parsedTypeId, {
        ...getBaseResourceProperties(),
        ...resource,
      })
    } else {
      throw new Error(`Service for ${typeId} not implemented yet`)
    }
  }

  get<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    id: string,
    params?: GetParams
  ): ResourceMap[ReferenceTypeId] {
    return this._storage.get(
      this.projectKey,
      typeId,
      id,
      params
    ) as ResourceMap[ReferenceTypeId]
  }

  // TODO: Not sure if we want to expose this...
  getRepository<ReferenceTypeId extends keyof RepositoryMap>(
    typeId: ReferenceTypeId
  ): RepositoryMap[ReferenceTypeId] {
    const service = this._services[typeId]
    if (service !== undefined) {
      return service.repository as RepositoryMap[ReferenceTypeId]
    }
    throw new Error('No such repository')
  }
}
