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
} from '@commercetools/platform-sdk';

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
  abstract all(typeId: ReferenceTypeId): Array<BaseResource>;
  abstract add(typeId: ReferenceTypeId, obj: BaseResource): void;
  abstract get(typeId: ReferenceTypeId, id: string): BaseResource | null;
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
  };

  all(typeId: ReferenceTypeId) {
    const store = this.resources[typeId];
    if (store) {
      return Array.from(store.values());
    }
    return [];
  }

  add(typeId: ReferenceTypeId, obj: BaseResource) {
    this.resources[typeId]?.set(obj.id, obj);
  }

  get(typeId: ReferenceTypeId, id: string): BaseResource | null {
    return this.resources[typeId]?.get(id) || null;
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
    return null;

    // except KeyError:
    //     raise ValueError("No resource found with id %r", obj.id)
    // if obj.key:
    //     for item in store.values():
    //         if item.key == obj.key:
    //             return item
  }
}
