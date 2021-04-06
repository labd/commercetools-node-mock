import {
  BaseResource,
  Cart,
  Customer,
  CustomObject,
  Order,
  PagedQueryResponse,
  QueryParam,
  ReferenceTypeId,
  ResourceIdentifier,
  Type,
} from '@commercetools/platform-sdk';
import { ResourceMap } from 'types';

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
    id: string
  ): ResourceMap[ReferenceTypeId] | null;
  abstract delete(typeId: ReferenceTypeId, id: string): BaseResource | null;
  abstract query(
    typeId: ReferenceTypeId,
    params: QueryParams
  ): PagedQueryResponse;
  abstract getByResourceIdentifier(
    identifier: ResourceIdentifier
  ): BaseResource | null;
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
    type: new Map<string, Type>(),
  };

  clear() {
    for (const [key, value] of Object.entries(this.resources)) {
      value?.clear()
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
    obj: ResourceMap[ReferenceTypeId]
  ) {
    this.resources[typeId]?.set(obj.id, obj);
  }

  get<ReferenceTypeId extends keyof ResourceMap>(
    typeId: ReferenceTypeId,
    id: string
  ) {
    const resource = this.resources[typeId]?.get(id);
    if (resource) {
      return resource as ResourceMap[ReferenceTypeId];
    }
    return null;
  }

  delete(typeId: ReferenceTypeId, id: string): BaseResource | null {
    const resource = this.get(typeId, id);
    if (resource) {
      this.resources[typeId]?.delete(id);
    }
    return resource;
  }

  query(typeId: ReferenceTypeId, params: QueryParams): PagedQueryResponse {
    const store = this.resources[typeId];
    if (!store) {
      throw new Error('No type');
    }

    const resources = Array.from(store.values());

    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const matchingResources = resources.slice(offset, offset + limit);

    return {
      count: matchingResources.length,
      total: resources.length,
      offset: offset,
      limit: limit,
      results: matchingResources,
    };
  }
  getByResourceIdentifier(identifier: ResourceIdentifier): BaseResource | null {
    if (identifier.id) {
      return this.get(identifier.typeId, identifier.id) || null;
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
          return resource;
        }
      } else {
        throw new Error(
          `No storage found for resource type: ${identifier.typeId}`
        );
      }
    }
    return null;
  }
}
