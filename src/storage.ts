import assert from 'assert'
import {
  BaseResource,
  Cart,
  Category,
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
  Project,
  State,
  TaxCategory,
  ShippingMethod,
  ProductType,
  InvalidInputError,
  ProductProjection,
  ShoppingList,
  Extension,
  CartDiscount,
  CustomerGroup,
  DiscountCode,
  Zone,
  Channel,
  Subscription,
  ProductDiscount,
} from '@commercetools/platform-sdk'
import { parseExpandClause } from './lib/expandParser'
import { RepositoryTypes, ResourceMap, Writable } from './types'
import { parseQueryExpression } from './lib/predicateParser'
import { CommercetoolsError } from './exceptions'
import { cloneObject } from './helpers'

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

  abstract all<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT
  ): Array<ResourceMap[RT]>

  abstract add<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    obj: ResourceMap[RT]
  ): void

  abstract get<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    id: string,
    params?: GetParams
  ): ResourceMap[RT] | null

  abstract getByKey<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    key: string,
    params: GetParams
  ): ResourceMap[RT] | null

  abstract addProject(projectKey: string): Project
  abstract getProject(projectKey: string): Project
  abstract saveProject(project: Project): Project

  abstract delete<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    id: string,
    params: GetParams
  ): BaseResource | null

  abstract query(
    projectKey: string,
    typeId: RepositoryTypes,
    params: QueryParams
  ): PagedQueryResponse

  abstract getByResourceIdentifier<RT extends RepositoryTypes>(
    projectKey: string,
    identifier: ResourceIdentifier
  ): ResourceMap[RT] | undefined

  abstract expand<T>(
    projectKey: string,
    obj: T,
    clause: undefined | string | string[]
  ): T
}

type ProjectStorage = {
  [index in RepositoryTypes]: Map<string, BaseResource>
}

export class InMemoryStorage extends AbstractStorage {
  protected resources: {
    [projectKey: string]: ProjectStorage
  } = {}

  protected projects: {
    [projectKey: string]: Project
  } = {}

  private forProjectKey(projectKey: string): ProjectStorage {
    this.addProject(projectKey)

    let projectStorage = this.resources[projectKey]
    if (!projectStorage) {
      projectStorage = this.resources[projectKey] = {
        cart: new Map<string, Cart>(),
        'cart-discount': new Map<string, CartDiscount>(),
        category: new Map<string, Category>(),
        channel: new Map<string, Channel>(),
        customer: new Map<string, Customer>(),
        'customer-group': new Map<string, CustomerGroup>(),
        'discount-code': new Map<string, DiscountCode>(),
        extension: new Map<string, Extension>(),
        'inventory-entry': new Map<string, InventoryEntry>(),
        'key-value-document': new Map<string, CustomObject>(),
        order: new Map<string, Order>(),
        'order-edit': new Map<string, any>(),
        payment: new Map<string, Payment>(),
        product: new Map<string, Product>(),
        'product-discount': new Map<string, ProductDiscount>(),
        'product-price': new Map<string, any>(),
        'product-selection': new Map<string, any>(),
        'product-type': new Map<string, ProductType>(),
        'product-projection': new Map<string, ProductProjection>(),
        review: new Map<string, any>(),
        'shipping-method': new Map<string, ShippingMethod>(),
        state: new Map<string, State>(),
        store: new Map<string, Store>(),
        'shopping-list': new Map<string, ShoppingList>(),
        'standalone-price': new Map<string, any>(),
        subscription: new Map<string, Subscription>(),
        'tax-category': new Map<string, TaxCategory>(),
        type: new Map<string, Type>(),
        zone: new Map<string, Zone>(),
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

  all<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT
  ): ResourceMap[RT][] {
    const store = this.forProjectKey(projectKey)[typeId]
    if (store) {
      return Array.from(store.values()) as ResourceMap[RT][]
    }
    return []
  }

  add<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    obj: ResourceMap[RT],
    params: GetParams = {}
  ): ResourceMap[RT] {
    const store = this.forProjectKey(projectKey)
    store[typeId]?.set(obj.id, obj)

    const resource = this.get(projectKey, typeId, obj.id, params)
    assert(resource, `resource of type ${typeId} with id ${obj.id} not created`)
    return resource
  }

  get<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    id: string,
    params: GetParams = {}
  ): ResourceMap[RT] | null {
    const resource = this.forProjectKey(projectKey)[typeId]?.get(id)
    if (resource) {
      return this.expand(projectKey, resource, params.expand) as ResourceMap[RT]
    }
    return null
  }

  getByKey<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    key: string,
    params: GetParams = {}
  ): ResourceMap[RT] | null {
    const store = this.forProjectKey(projectKey)
    const resourceStore = store[typeId]
    if (!store) {
      throw new Error('No type')
    }

    const resources: any[] = Array.from(resourceStore.values())
    const resource = resources.find(e => e.key === key)
    if (resource) {
      return this.expand(projectKey, resource, params.expand) as ResourceMap[RT]
    }
    return null
  }

  delete<RT extends RepositoryTypes>(
    projectKey: string,
    typeId: RT,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    const resource = this.get(projectKey, typeId, id)

    if (resource) {
      this.forProjectKey(projectKey)[typeId]?.delete(id)
      return this.expand(projectKey, resource, params.expand) as ResourceMap[RT]
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
            message: (err as any).message,
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

  search(
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
            message: (err as any).message,
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

  getByResourceIdentifier<RT extends RepositoryTypes>(
    projectKey: string,
    identifier: ResourceIdentifier
  ): ResourceMap[RT] | undefined {
    if (identifier.id) {
      const resource = this.get(projectKey, identifier.typeId, identifier.id)
      if (resource) {
        return resource as ResourceMap[RT]
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
          return resource as ResourceMap[RT]
        }
      } else {
        throw new Error(
          `No storage found for resource type: ${identifier.typeId}`
        )
      }
    }
    return undefined
  }

  addProject = (projectKey: string): Project => {
    if (!this.projects[projectKey]) {
      this.projects[projectKey] = {
        key: projectKey,
        name: '',
        countries: [],
        currencies: [],
        languages: [],
        createdAt: '2018-10-04T11:32:12.603Z',
        trialUntil: '2018-12',
        carts: {
          countryTaxRateFallbackEnabled: false,
          deleteDaysAfterLastModification: 90,
        },
        messages: { enabled: false, deleteDaysAfterCreation: 15 },
        shippingRateInputType: undefined,
        externalOAuth: undefined,
        searchIndexing: {
          products: {
            status: 'Deactivated',
          },
          orders: {
            status: 'Deactivated',
          },
        },
        version: 1,
      }
    }
    return this.projects[projectKey]
  }

  saveProject = (project: Project): Project => {
    this.projects[project.key] = project
    return project
  }

  getProject = (projectKey: string): Project => {
    return this.addProject(projectKey)
  }

  public expand = <T>(
    projectKey: string,
    obj: T,
    clause: undefined | string | string[]
  ): T => {
    if (!clause) return obj
    const newObj = cloneObject(obj)
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
