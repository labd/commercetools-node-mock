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
  ResourceIdentifier,
  Product,
  Store,
  Type,
  Payment,
  State,
  TaxCategory,
  ShippingMethod,
  ProductType,
  InvalidInputError,
  ProductProjection,
  ShoppingList,
} from '@commercetools/platform-sdk'
import { parseExpandClause } from './lib/expandParser'
import { RepositoryTypes, ResourceMap, Writable } from './types'
import { parseQueryExpression } from './lib/predicateParser'
import { CommercetoolsError } from './exceptions'

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

  abstract assertStorage(typeId: RepositoryTypes): void

  abstract all(projectKey: string, typeId: RepositoryTypes): Array<BaseResource>

  abstract add<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    typeId: RepositoryTypes,
    obj: ResourceMap[RepositoryTypes]
  ): void

  abstract get<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    typeId: RepositoryTypes,
    id: string,
    params: GetParams
  ): ResourceMap[RepositoryTypes] | null

  abstract getByKey<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    typeId: RepositoryTypes,
    key: string,
    params: GetParams
  ): ResourceMap[RepositoryTypes] | null

  abstract delete(
    projectKey: string,
    typeId: RepositoryTypes,
    id: string,
    params: GetParams
  ): BaseResource | null

  abstract query(
    projectKey: string,
    typeId: RepositoryTypes,
    params: QueryParams
  ): PagedQueryResponse

  abstract getByResourceIdentifier(
    projectKey: string,
    identifier: ResourceIdentifier
  ): BaseResource | undefined
}

type ProjectStorage = Partial<
  {
    [index in RepositoryTypes]: Map<string, BaseResource>
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
        product: new Map<string, Product>(),
        'product-projection': new Map<string, ProductProjection>(),
        'shipping-method': new Map<string, ShippingMethod>(),
        state: new Map<string, State>(),
        store: new Map<string, Store>(),
        'shopping-list': new Map<string, ShoppingList>(),
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

  assertStorage(typeId: RepositoryTypes) {}

  all(projectKey: string, typeId: RepositoryTypes) {
    const store = this.forProjectKey(projectKey)[typeId]
    if (store) {
      return Array.from(store.values())
    }
    return []
  }

  add<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    typeId: RepositoryTypes,
    obj: ResourceMap[RepositoryTypes],
    params: GetParams = {}
  ): ResourceMap[RepositoryTypes] {
    this.forProjectKey(projectKey)[typeId]?.set(obj.id, obj)

    const resource = this.get(projectKey, typeId, obj.id, params)
    assert(resource, `resource of type ${typeId} with id ${obj.id} not created`)
    return resource
  }

  get<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    typeId: RepositoryTypes,
    id: string,
    params: GetParams = {}
  ): ResourceMap[RepositoryTypes] | null {
    const resource = this.forProjectKey(projectKey)[typeId]?.get(id)
    if (resource) {
      return this.expand(
        projectKey,
        resource,
        params.expand
      ) as ResourceMap[RepositoryTypes]
    }
    return null
  }

  getByKey<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    typeId: RepositoryTypes,
    key: string,
    params: GetParams = {}
  ): ResourceMap[RepositoryTypes] | null {
    const store = this.forProjectKey(projectKey)[typeId]
    if (!store) {
      throw new Error('No type')
    }

    const resources: any[] = Array.from(store.values())
    const resource = resources.find(e => e.key === key)
    if (params.expand) return this.expand(projectKey, resource, params.expand)
    return resource
  }

  delete(
    projectKey: string,
    typeId: RepositoryTypes,
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
      ) as ResourceMap[RepositoryTypes]
    }
    return resource
  }

  query(
    projectKey: string,
    typeId: RepositoryTypes,
    params: QueryParams
  ): PagedQueryResponse {
    const store = this.forProjectKey(projectKey)[typeId]
    if (!store) {
      throw new Error('No type')
    }

    let resources = Array.from(store.values())

    // Apply predicates
    if (params.where) {
      try {
        const filterFunc = parseQueryExpression(params.where)
        resources = resources.filter(resource => filterFunc(resource, {}))
      } catch (err) {
        throw new CommercetoolsError<InvalidInputError>(
          {
            code: 'InvalidInput',
            message: err.message,
          },
          400
        )
      }
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

  getByResourceIdentifier<RepositoryTypes extends keyof ResourceMap>(
    projectKey: string,
    identifier: ResourceIdentifier
  ): ResourceMap[RepositoryTypes] | undefined {
    if (identifier.id) {
      const resource = this.get(projectKey, identifier.typeId, identifier.id)
      if (resource) {
        return resource as ResourceMap[RepositoryTypes]
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
          return resource as ResourceMap[RepositoryTypes]
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
