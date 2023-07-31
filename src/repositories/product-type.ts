import type {
  AttributeDefinition,
  AttributeDefinitionDraft,
  AttributeType,
  ProductType,
  ProductTypeAddAttributeDefinitionAction,
  ProductTypeChangeAttributeOrderByNameAction,
  ProductTypeChangeLabelAction,
  ProductTypeChangeLocalizedEnumValueLabelAction,
  ProductTypeDraft,
  ProductTypeRemoveAttributeDefinitionAction,
  ProductTypeRemoveEnumValuesAction,
  ProductTypeUpdateAction,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import { AbstractResourceRepository, RepositoryContext } from './abstract.js'

export class ProductTypeRepository extends AbstractResourceRepository<'product-type'> {
  getTypeId() {
    return 'product-type' as const
  }

  create(context: RepositoryContext, draft: ProductTypeDraft): ProductType {
    const resource: ProductType = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      description: draft.description,
      attributes: (draft.attributes ?? []).map((a) =>
        this.attributeDefinitionFromAttributeDefinitionDraft(context, a)
      ),
    }

    this.saveNew(context, resource)
    return resource
  }

  attributeDefinitionFromAttributeDefinitionDraft = (
    _context: RepositoryContext,
    draft: AttributeDefinitionDraft
  ): AttributeDefinition => ({
    ...draft,
    attributeConstraint: draft.attributeConstraint ?? 'None',
    inputHint: draft.inputHint ?? 'SingleLine',
    inputTip:
      draft.inputTip && Object.keys(draft.inputTip).length > 0
        ? draft.inputTip
        : undefined,
    isSearchable: draft.isSearchable ?? true,
  })

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
            type.values.forEach((v) => {
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

      resource.attributes?.forEach((value) => {
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
      resource.attributes?.forEach((value) => {
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
    changeAttributeOrderByName: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { attributeNames }: ProductTypeChangeAttributeOrderByNameAction
    ) => {
      const attrs = new Map(
        resource.attributes?.map((item) => [item.name, item])
      )
      const result: AttributeDefinition[] = []
      let current = resource.attributes

      attributeNames.forEach((attrName) => {
        const attr = attrs.get(attrName)
        if (attr === undefined) {
          throw new Error('New attr')
        }
        result.push(attr)

        // Remove from current items
        current = current?.filter((f) => f.name !== attrName)
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
      resource.attributes = resource.attributes?.filter((f) => f.name !== name)
    },
    removeEnumValues: (
      context: RepositoryContext,
      resource: Writable<ProductType>,
      { attributeName, keys }: ProductTypeRemoveEnumValuesAction
    ) => {
      resource.attributes?.forEach((attr) => {
        if (attr.name == attributeName) {
          if (attr.type.name == 'enum') {
            attr.type.values = attr.type.values.filter(
              (v) => !keys.includes(v.key)
            )
          }

          if (attr.type.name == 'set') {
            if (attr.type.elementType.name == 'enum') {
              attr.type.elementType.values =
                attr.type.elementType.values.filter(
                  (v) => !keys.includes(v.key)
                )
            }
          }
        }
      })
    },
  }
}
