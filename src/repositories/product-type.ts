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
import { AbstractResourceRepository, RepositoryContext } from './abstract'
import { Writable } from 'types'

export class ProductTypeRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'product-type'
  }

  create(context: RepositoryContext, draft: ProductTypeDraft): ProductType {
    const resource: ProductType = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      description: draft.description,
      attributes: (draft.attributes ?? []).map(a =>
        this.attributeDefinitionFromAttributeDefinitionDraft(context, a)
      ),
    }

    this.save(context, resource)
    return resource
  }

  attributeDefinitionFromAttributeDefinitionDraft = (
    _context: RepositoryContext,
    draft: AttributeDefinitionDraft
  ): AttributeDefinition => ({
    ...draft,
    attributeConstraint: draft.attributeConstraint ?? 'None',
    inputHint: draft.inputHint ?? 'SingleLine',
    isSearchable: draft.isSearchable ?? true,
  })

  getWithKey(context: RepositoryContext, key: string): ProductType | undefined {
    const result = this._storage.query(context.projectKey, this.getTypeId(), {
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
      (
        context: RepositoryContext,
        resource: Writable<ProductType>,
        action: any
      ) => void
    >
  > = {
    changeLocalizedEnumValueLabel: (
      context: RepositoryContext,
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
              if (v.key === newValue.key) {
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
        if (value.name === attributeName) {
          updateAttributeType(value.type)
        }
      })
    },
    changeLabel: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { attributeName, label }: ProductTypeChangeLabelAction
    ) => {
      resource.attributes?.forEach(value => {
        if (value.name === attributeName) {
          value.label = label
        }
      })
    },
  }
}
