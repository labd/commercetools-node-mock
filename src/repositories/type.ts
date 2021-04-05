import { Type, TypeDraft, ReferenceTypeId } from '@commercetools/platform-sdk';
import AbstractRepository from './abstract';

export class TypeRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'type';
  }

  create(draft: TypeDraft): Type {
    const resource: Type = {
      ...this.getResourceProperties(),
      key: draft.key,
      name: draft.name,
      resourceTypeIds: draft.resourceTypeIds,
      fieldDefinitions: draft.fieldDefinitions || [],
    };
    this.save(resource);
    return resource;
  }
}
