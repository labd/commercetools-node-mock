import { v4 as uuidv4 } from 'uuid';
import deepEqual from 'deep-equal';

import {
  BaseResource,
  ReferenceTypeId,
  UpdateAction,
} from '@commercetools/platform-sdk';
import { AbstractStorage } from '../storage';

export default abstract class AbstractRepository {
  protected _storage: AbstractStorage;

  protected actions: {
    [key: string]: (resource: any, actions: any) => void;
  } = {};

  constructor(storage: AbstractStorage) {
    this._storage = storage;
    this._storage.assertStorage(this.getTypeId());
  }

  abstract getTypeId(): ReferenceTypeId;
  abstract create(draft: any): BaseResource;

  query() {
    return this._storage.query(this.getTypeId(), {});
  }

  get(id: string): BaseResource | null {
    return this._storage.get(this.getTypeId(), id);
  }

  delete(id: string): BaseResource | null {
    return this._storage.delete(this.getTypeId(), id);
  }

  save(resource: BaseResource) {
    const typeId = this.getTypeId();

    const current = this.get(resource.id);
    if (current) {
      if (current.version != resource.version) {
        throw new Error('Concurrent modification');
      }

      // @ts-ignore
      resource.version += 1;
    }

    this._storage.add(typeId, resource);
  }

  processUpdateActions(
    resource: BaseResource,
    actions: UpdateAction[]
  ): BaseResource {
    // Deep-copy
    const modifiedResource = JSON.parse(JSON.stringify(resource));

    actions.forEach(action => {
      this.actions[action.action](modifiedResource, action);
    });

    if (!deepEqual(modifiedResource, resource)) {
      this.save(modifiedResource);
    }
    return modifiedResource;
  }

  getResourceProperties() {
    return {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      version: 1,
    };
  }
}
