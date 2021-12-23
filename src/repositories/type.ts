import { Type, TypeDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'

export class TypeRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'type'
  }

  create(projectKey: string, draft: TypeDraft): Type {
    const resource: Type = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      resourceTypeIds: draft.resourceTypeIds,
      fieldDefinitions: draft.fieldDefinitions || [],
      description: draft.description,
    }
    this.save(projectKey, resource)
    return resource
  }
}
