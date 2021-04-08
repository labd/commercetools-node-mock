import assert from 'assert';
import {
  BaseResource,
  Cart,
  Customer,
  CustomObject,
  Order,
  PagedQueryResponse,
  Store,
  QueryParam,
  ReferenceTypeId,
  ResourceIdentifier,
  Type,
  Reference,
} from '@commercetools/platform-sdk';
import { parseExpandClause } from './lib/expandParser';
import { ResourceMap, Writable } from 'types';
import { matchesPredicate } from './lib/predicateParser';

type GetParams = {
  expand?: string[];
};

type QueryParams = {
  expand?: string | string[];
  sort?: string | string[];
  limit?: number;
  offset?: number;
  withTotal?: boolean;
  where?: string | string[];
  [key: string]: QueryParam;
};

export abstract class AbstractStorage {
  abstract clear(): void;
  abstract assertStorage(typeId: ReferenceTypeId): void;
  abstract all(typeId: ReferenceTypeId): Array<BaseResource>;
  abstract add<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    obj: ResourceMap[ReferenceTypeId]
  ): void;
  abstract get<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams
  ): ResourceMap[ReferenceTypeId] | null;
  abstract delete(typeId: ReferenceTypeId, id: string): BaseResource | null;
  abstract query(
    typeId: ReferenceTypeId,
    params: QueryParams
  ): PagedQueryResponse;
  abstract getByResourceIdentifier(
    identifier: ResourceIdentifier
  ): BaseResource | undefined;
}

export class InMemoryStorage extends AbstractStorage {
  protected resources: Partial<
    {
      [index in ReferenceTypeId]: Map<string, BaseResource>;
    }
  > = {
    cart: new Map<string, Cart>(),
    customer: new Map<string, Customer>(),
    'key-value-document': new Map<string, CustomObject>(),
    order: new Map<string, Order>(),
    store: new Map<string, Store>(),
    type: new Map<string, Type>(),
  };

  clear() {
    for (const [key, value] of Object.entries(this.resources)) {
      value?.clear();
    }
  }

  assertStorage(typeId: ReferenceTypeId) {
    if (this.resources[typeId] === undefined) {
      throw new Error(`Storage not available for type: ${typeId}`);
    }
  }

  all(typeId: ReferenceTypeId) {
    const store = this.resources[typeId];
    if (store) {
      return Array.from(store.values());
    }
    return [];
  }

  add<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    obj: ResourceMap[ReferenceTypeId],
    params: GetParams = {}
  ): ResourceMap[ReferenceTypeId] {
    this.resources[typeId]?.set(obj.id, obj);

    const resource = this.get(typeId, obj.id, params);
    assert(resource);
    return resource;
  }

  get<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams = {}
  ): ResourceMap[ReferenceTypeId] | null {
    const resource = this.resources[typeId]?.get(id);
    if (resource) {
      return this.expand(
        resource,
        params.expand
      ) as ResourceMap[ReferenceTypeId];
    }
    return null;
  }

  delete(
    typeId: ReferenceTypeId,
    id: string,
    params: GetParams = {}
  ): BaseResource | null {
    const resource = this.get(typeId, id);
    if (resource) {
      this.resources[typeId]?.delete(id);
      return this.expand(
        resource,
        params.expand
      ) as ResourceMap[ReferenceTypeId];
    }
    return resource;
  }

  query(typeId: ReferenceTypeId, params: QueryParams): PagedQueryResponse {
    const store = this.resources[typeId];
    if (!store) {
      throw new Error('No type');
    }

    let resources = Array.from(store.values());

    // Apply predicates
    if (params.where) {
      resources = resources.filter(resource =>
        matchesPredicate(params.where, resource)
      );
    }

    // Get the total before slicing the array
    const totalResources = resources.length

    // Apply offset, limit
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    resources = resources.slice(offset, offset + limit);

    // Expand the resources
    if (params.expand !== undefined) {
      resources = resources.map(resource => {
        return this.expand(resource, params.expand);
      });
    }

    return {
      count: totalResources,
      total: resources.length,
      offset: offset,
      limit: limit,
      results: resources,
    };
  }

  getByResourceIdentifier<ReferenceTypeId extends keyof ResourceMap>(
    identifier: ResourceIdentifier
  ): ResourceMap[ReferenceTypeId] | undefined {
    if (identifier.id) {
      const resource = this.get(identifier.typeId, identifier.id);
      if (resource) {
        return resource as ResourceMap[ReferenceTypeId];
      }
      console.error(
        `No resource found with typeId=${identifier.typeId}, id=${identifier.id}`
      );
      return undefined;
    }

    if (identifier.key) {
      const store = this.resources[identifier.typeId];
      if (store) {
        // TODO: BaseResource has no key attribute, but the subclasses should
        // have them all.
        const resource = Array.from(store.values()).find(
          // @ts-ignore
          r => r.key == identifier.key
        );
        if (resource) {
          return resource as ResourceMap[ReferenceTypeId];
        }
      } else {
        throw new Error(
          `No storage found for resource type: ${identifier.typeId}`
        );
      }
    }
    return undefined;
  }

  private expand = <T>(obj: T, clause: undefined | string | string[]): T => {
    if (!clause) return obj;
    const newObj = JSON.parse(JSON.stringify(obj));
    if (Array.isArray(clause)) {
      clause.forEach(c => {
        this._resolveResource(newObj, c);
      });
    } else {
      this._resolveResource(newObj, clause);
    }
    return newObj;
  };

  private _resolveResource = (obj: any, expand: string) => {
    const params = parseExpandClause(expand);

    if (!params.index) {
      const reference = obj[params.element];
      if (reference === undefined) {
        return;
      }
      this._resolveReference(reference, params.rest);
    } else if (params.index == '*') {
      const reference = obj[params.element];
      if (reference === undefined || !Array.isArray(reference)) return;
      reference.map((itemRef: Writable<Reference>) => {
        this._resolveReference(itemRef, params.rest);
      });
    } else {
      const reference = obj[params.element][params.index];
      if (reference === undefined) return;
      this._resolveReference(reference, params.rest);
    }
  };

  private _resolveReference(reference: any, expand: string | undefined) {
    if (reference === undefined) return;

    if (reference.typeId !== undefined && reference.id !== undefined) {
      // @ts-ignore
      reference.obj = this.getByResourceIdentifier({
        typeId: reference.typeId,
        id: reference.id,
      } as ResourceIdentifier);
      if (expand) {
        this._resolveResource(reference.obj, expand);
      }
    } else {
      if (expand) {
        this._resolveResource(reference, expand);
      }
    }
  }
}
