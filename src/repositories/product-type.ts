import { getBaseResourceProperties } from '../helpers'
import {
  AttributeDefinition,
  AttributeDefinitionDraft,
  ProductType,
  ProductTypeDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import AbstractRepository from './abstract'

export class ProductTypeRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'product-type'
  }

  create(projectKey: string, draft: ProductTypeDraft): ProductType {
    const resource: ProductType = {
      ...getBaseResourceProperties(),
      ...draft,
      attributes: (draft.attributes ?? []).map(a =>
        this.attributeDefinitionFromAttributeDefinitionDraft(projectKey, a)
      ),
    }

    this.save(projectKey, resource)
    return resource
  }

  attributeDefinitionFromAttributeDefinitionDraft = (
    _projectKey: string,
    draft: AttributeDefinitionDraft
  ): AttributeDefinition => ({
    ...draft,
    attributeConstraint: draft.attributeConstraint ?? 'None',
    inputHint: draft.inputHint ?? 'SingleLine',
    isSearchable: draft.isSearchable ?? true,
  })

  getWithKey(projectKey: string, key: string): ProductType | undefined {
    const result = this._storage.query(projectKey, this.getTypeId(), {
      where: [`key="${key}"`],
    })
    if (result.count === 1) {
      return result.results[0] as ProductType
    }

    // Catch this for now, should be checked when creating/updating
    if (result.count > 1) {
      throw new Error('Duplicate product type key')
    }

    return
  }

  actions = {}
}
