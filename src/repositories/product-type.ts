import { getBaseResourceProperties } from '../helpers'
import {
  AttributeDefinition,
  AttributeDefinitionDraft,
  AttributeType,
  ProductType,
  ProductTypeAddAttributeDefinitionAction,
  ProductTypeChangeAttributeOrderAction,
  ProductTypeChangeLabelAction,
  ProductTypeChangeLocalizedEnumValueLabelAction,
  ProductTypeDraft,
  ProductTypeRemoveAttributeDefinitionAction,
  ProductTypeRemoveEnumValuesAction,
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

    this.saveNew(context, resource)
    return resource
  }

  attributeDefinitionFromAttributeDefinitionDraft = (
    _context: RepositoryContext,
    draft: AttributeDefinitionDraft
  ): AttributeDefinition => {
    return {
      ...draft,
      attributeConstraint: draft.attributeConstraint ?? 'None',
      inputHint: draft.inputHint ?? 'SingleLine',
      inputTip:
        draft.inputTip && Object.keys(draft.inputTip).length > 0
          ? draft.inputTip
          : undefined,
      isSearchable: draft.isSearchable ?? true,
    }
  }

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
    addAttributeDefinition: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { attribute }: ProductTypeAddAttributeDefinitionAction
    ) => {
      resource.attributes?.push(
        this.attributeDefinitionFromAttributeDefinitionDraft(context, attribute)
      )
    },
    changeAttributeOrder: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { attributes }: ProductTypeChangeAttributeOrderAction
    ) => {
      const attrs = new Map(resource.attributes?.map(item => [item.name, item]))
      const result: AttributeDefinition[] = []
      let current = resource.attributes

      attributes.forEach(iAttr => {
        const attr = attrs.get(iAttr.name)
        if (attr === undefined) {
          throw new Error('New attr')
        }
        result.push(attr)

        // Remove from current items
        current = current?.filter(f => {
          return f.name !== iAttr.name
        })
      })

      resource.attributes = result
      // Add attrs which were not specified in the order as last items. Not
      // sure if this follows commercetools
      if (current) {
        resource.attributes.push(...current)
      }
    },
    removeAttributeDefinition: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { name }: ProductTypeRemoveAttributeDefinitionAction
    ) => {
      resource.attributes = resource.attributes?.filter(f => {
        return f.name !== name
      })
    },
    removeEnumValues: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { attributeName, keys }: ProductTypeRemoveEnumValuesAction
    ) => {
      resource.attributes?.forEach(attr => {
        if (attr.name == attributeName) {
          if (attr.type.name == 'enum') {
            attr.type.values = attr.type.values.filter(v => {
              return !keys.includes(v.key)
            })
          }

          if (attr.type.name == 'set') {
            if (attr.type.elementType.name == 'enum') {
              attr.type.elementType.values = attr.type.elementType.values.filter(
                v => {
                  return !keys.includes(v.key)
                }
              )
            }
          }
        }
      })
    },
  }
}
