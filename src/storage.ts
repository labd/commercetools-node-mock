import assert from 'assert'
import {
  BaseResource,
  Cart,
  Customer,
  CustomObject,
  InventoryEntry,
  Order,
  PagedQueryResponse,
  QueryParam,
  Reference,
  ReferenceTypeId,
  ResourceIdentifier,
  Store,
  Type,
  Payment,
  State,
  TaxCategory,
  ShippingMethod,
  ProductType,
} from '@commercetools/platform-sdk'
import { parseExpandClause } from './lib/expandParser'
import { ResourceMap, Writable } from 'types'
import { matchesPredicate } from './lib/predicateParser'

type GetParams = {
  expand?: string[]
}

type QueryParams = {
  expand?: string | string[]
  sort?: string | string[]
  limit?: number
  offset?: number
  withTotal?: boolean
  where?: string | string[]
  [key: string]: QueryParam
}

export abstract class AbstractStorage {
  abstract clear(): void

  abstract assertStorage(typeId: ReferenceTypeId): void

  abstract all(projectKey: string, typeId: ReferenceTypeId): Array<BaseResource>

  abstract add<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    typeId: ReferenceTypeId,
    obj: ResourceMap[ReferenceTypeId]
  ): void

  abstract get<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams
  ): ResourceMap[ReferenceTypeId] | null

  abstract delete(
    projectKey: string,
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams
  ): BaseResource | null

  abstract query(
    projectKey: string,
    typeId: ReferenceTypeId,
    params: QueryParams
  ): PagedQueryResponse

  abstract getByResourceIdentifier(
    projectKey: string,
    identifier: ResourceIdentifier
  ): BaseResource | undefined
}

type ProjectStorage = Partial<
  {
    [index in ReferenceTypeId]: Map<string, BaseResource>
  }
>

export class InMemoryStorage extends AbstractStorage {
  protected resources: {
    [projectKey: string]: ProjectStorage
  } = {}

  private forProjectKey(projectKey: string) {
    let projectStorage = this.resources[projectKey]
    if (!projectStorage) {
      projectStorage = this.resources[projectKey] = {
        cart: new Map<string, Cart>(),
        customer: new Map<string, Customer>(),
        'inventory-entry': new Map<string, InventoryEntry>(),
        'key-value-document': new Map<string, CustomObject>(),
        order: new Map<string, Order>(),
        payment: new Map<string, Payment>(),
        'product-type': new Map<string, ProductType>(),
        'shipping-method': new Map<string, ShippingMethod>(),
        state: new Map<string, State>(),
        store: new Map<string, Store>(),
        'tax-category': new Map<string, TaxCategory>(),
        type: new Map<string, Type>(),
      }
    }
    return projectStorage
  }

  clear() {
    for (const [, projectStorage] of Object.entries(this.resources)) {
      for (const [, value] of Object.entries(projectStorage)) {
        value?.clear()
      }
    }
  }

  assertStorage(typeId: ReferenceTypeId) {}

  all(projectKey: string, typeId: ReferenceTypeId) {
    const store = this.forProjectKey(projectKey)[typeId]
    if (store) {
      return Array.from(store.values())
    }
    return []
  }

  add<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    typeId: ReferenceTypeId,
    obj: ResourceMap[ReferenceTypeId],
    params: GetParams = {}
  ): ResourceMap[ReferenceTypeId] {
    this.forProjectKey(projectKey)[typeId]?.set(obj.id, obj)

    const resource = this.get(projectKey, typeId, obj.id, params)
    assert(resource)
    return resource
  }

  get<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams = {}
  ): ResourceMap[ReferenceTypeId] | null {
    const resource = this.forProjectKey(projectKey)[typeId]?.get(id)
    if (resource) {
      return this.expand(
        projectKey,
        resource,
        params.expand
      ) as ResourceMap[ReferenceTypeId]
    }
    return null
  }

  delete(
    projectKey: string,
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    const resource = this.get(projectKey, typeId, id)
    if (resource) {
      this.forProjectKey(projectKey)[typeId]?.delete(id)
      return this.expand(
        projectKey,
        resource,
        params.expand
      ) as ResourceMap[ReferenceTypeId]
    }
    return resource
  }

  query(
    projectKey: string,
    typeId: ReferenceTypeId,
    params: QueryParams
  ): PagedQueryResponse {
    const store = this.forProjectKey(projectKey)[typeId]
    if (!store) {
      throw new Error('No type')
    }

    let resources = Array.from(store.values())

    // Apply predicates
    if (params.where) {
      resources = resources.filter(resource =>
        matchesPredicate(params.where, resource)
      )
    }

    // Get the total before slicing the array
    const totalResources = resources.length

    // Apply offset, limit
    const offset = params.offset || 0
    const limit = params.limit || 20
    resources = resources.slice(offset, offset + limit)

    // Expand the resources
    if (params.expand !== undefined) {
      resources = resources.map(resource => {
        return this.expand(projectKey, resource, params.expand)
      })
    }

    return {
      count: totalResources,
      total: resources.length,
      offset: offset,
      limit: limit,
      results: resources,
    }
  }

  getByResourceIdentifier<ReferenceTypeId extends keyof ResourceMap>(
    projectKey: string,
    identifier: ResourceIdentifier
  ): ResourceMap[ReferenceTypeId] | undefined {
    if (identifier.id) {
      const resource = this.get(projectKey, identifier.typeId, identifier.id)
      if (resource) {
        return resource as ResourceMap[ReferenceTypeId]
      }
      console.error(
        `No resource found with typeId=${identifier.typeId}, id=${identifier.id}`
      )
      return undefined
    }

    if (identifier.key) {
      const store = this.forProjectKey(projectKey)[identifier.typeId]

      if (store) {
        // TODO: BaseResource has no key attribute, but the subclasses should
        // have them all.
        const resource = Array.from(store.values()).find(
          // @ts-ignore
          r => r.key === identifier.key
        )
        if (resource) {
          return resource as ResourceMap[ReferenceTypeId]
        }
      } else {
        throw new Error(
          `No storage found for resource type: ${identifier.typeId}`
        )
      }
    }
    return undefined
  }

  private expand = <T>(
    projectKey: string,
    obj: T,
    clause: undefined | string | string[]
  ): T => {
    if (!clause) return obj
    const newObj = JSON.parse(JSON.stringify(obj))
    if (Array.isArray(clause)) {
      clause.forEach(c => {
        this._resolveResource(projectKey, newObj, c)
      })
    } else {
      this._resolveResource(projectKey, newObj, clause)
    }
    return newObj
  }

  private _resolveResource = (projectKey: string, obj: any, expand: string) => {
    const params = parseExpandClause(expand)

    if (!params.index) {
      const reference = obj[params.element]
      if (reference === undefined) {
        return
      }
      this._resolveReference(projectKey, reference, params.rest)
    } else if (params.index === '*') {
      const reference = obj[params.element]
      if (reference === undefined || !Array.isArray(reference)) return
      reference.forEach((itemRef: Writable<Reference>) => {
        this._resolveReference(projectKey, itemRef, params.rest)
      })
    } else {
      const reference = obj[params.element][params.index]
      if (reference === undefined) return
      this._resolveReference(projectKey, reference, params.rest)
    }
  }

  private _resolveReference(
    projectKey: string,
    reference: any,
    expand: string | undefined
  ) {
    if (reference === undefined) return

    if (
      reference.typeId !== undefined &&
      (reference.id !== undefined || reference.key !== undefined)
    ) {
      // @ts-ignore
      reference.obj = this.getByResourceIdentifier(projectKey, {
        typeId: reference.typeId,
        id: reference.id,
        key: reference.key,
      } as ResourceIdentifier)
      if (expand) {
        this._resolveResource(projectKey, reference.obj, expand)
      }
    } else {
      if (expand) {
        this._resolveResource(projectKey, reference, expand)
      }
    }
  }
}
