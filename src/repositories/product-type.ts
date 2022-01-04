import { getBaseResourceProperties } from '../helpers'
import {
  AttributeDefinition,
  AttributeDefinitionDraft,
  AttributeType,
  ProductType,
  ProductTypeChangeLabelAction,
  ProductTypeChangeLocalizedEnumValueLabelAction,
  ProductTypeDraft,
  ProductTypeUpdateAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { AbstractResourceRepository } from './abstract'
import { Writable } from 'types'

export class ProductTypeRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'product-type'
  }

  create(projectKey: string, draft: ProductTypeDraft): ProductType {
    const resource: ProductType = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      description: draft.description,
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

  actions: Partial<
    Record<
      ProductTypeUpdateAction['action'],
      (projectKey: string, resource: Writable<ProductType>, action: any) => void
    >
  > = {
    changeLocalizedEnumValueLabel: (
      projectKey: string,
      resource: Writable<ProductType>,
      {
        attributeName,
        newValue,
      }: ProductTypeChangeLocalizedEnumValueLabelAction
    ) => {
      const updateAttributeType = (type: Writable<AttributeType>) => {
        switch (type.name) {
          case 'lenum':
            type.values.forEach(v => {
              if (v.key == newValue.key) {
                v.label = newValue.label
              }
            })
            return
          case 'set':
            updateAttributeType(type.elementType)
            return
        }
      }

      resource.attributes?.forEach(value => {
        if (value.name == attributeName) {
          updateAttributeType(value.type)
        }
      })
    },
    changeLabel: (
      projectKey: string,
      resource: Writable<ProductType>,
      { attributeName, label }: ProductTypeChangeLabelAction
    ) => {
      resource.attributes?.forEach(value => {
        if (value.name == attributeName) {
          value.label = label
        }
      })
    },
  }
}
