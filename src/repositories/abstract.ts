import { v4 as uuidv4 } from 'uuid';
import deepEqual from 'deep-equal';

import {
  BaseResource,
  InvalidOperationError,
  ReferenceTypeId,
  UpdateAction,
} from '@commercetools/platform-sdk';
import { AbstractStorage } from '../storage';
import { checkConcurrentModification } from './errors';
import { CommercetoolsError } from '../exceptions';

type QueryParams = {
  expand?: string[];
  where?: string[];
};

type GetParams = {
  expand?: string[];
};

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

  query(params: QueryParams = {}) {
    return this._storage.query(this.getTypeId(), {
      expand: params.expand,
      where: params.where,
    });
  }

  get(id: string, params: GetParams = {}): BaseResource | null {
    return this._storage.get(this.getTypeId(), id, params);
  }

  delete(id: string): BaseResource | null {
    return this._storage.delete(this.getTypeId(), id);
  }

  save(resource: BaseResource) {
    const typeId = this.getTypeId();

    const current = this.get(resource.id);
    if (current) {
      checkConcurrentModification(current, resource.version);
    } else {
      if (resource.version != 0) {
        throw new CommercetoolsError<InvalidOperationError>(
          {
            code: 'InvalidOperation',
            message: 'version on create must be 0',
          },
          400
        );
      }
    }

    // @ts-ignore
    resource.version += 1;
    this._storage.add(typeId, resource as any);
  }

  processUpdateActions(
    resource: BaseResource,
    actions: UpdateAction[]
  ): BaseResource {
    // Deep-copy
    const modifiedResource = JSON.parse(JSON.stringify(resource));

    actions.forEach(action => {
      const updateFunc = this.actions[action.action];
      if (!updateFunc) {
        console.error(`No mock implemented for update action ${action.action}`);
        return;
      }
      updateFunc(modifiedResource, action);
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
      version: 0,
    };
  }
}
