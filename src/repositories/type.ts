import {
  Type,
  TypeDraft,
  ReferenceTypeId,
  TypeUpdateAction,
  TypeSetDescriptionAction,
  TypeChangeNameAction,
  TypeAddFieldDefinitionAction,
  TypeChangeEnumValueLabelAction,
  TypeAddEnumValueAction,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
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
  actions: Partial<
    Record<
      TypeUpdateAction['action'],
      (projectKey: string, resource: Writable<Type>, action: any) => void
    >
  > = {
    addFieldDefinition: (
      projectKey: string,
      resource: Writable<Type>,
      { fieldDefinition }: TypeAddFieldDefinitionAction
    ) => {
      resource.fieldDefinitions.push(fieldDefinition)
    },
    setDescription: (
      projectKey: string,
      resource: Writable<Type>,
      { description }: TypeSetDescriptionAction
    ) => {
      resource.description = description
    },
    changeName: (
      projectKey: string,
      resource: Writable<Type>,
      { name }: TypeChangeNameAction
    ) => {
      resource.name = name
    },
    addEnumValue: (
      projectKey: string,
      resource: Writable<Type>,
      { fieldName, value }: TypeAddEnumValueAction
    ) => {
      resource.fieldDefinitions.forEach(field => {
        if (field.name == fieldName) {
          // TODO, should be done better i suppose
          if (field.type.name == 'Enum') {
            field.type.values.push(value)
          } else if (
            field.type.name == 'Set' &&
            field.type.elementType.name == 'Enum'
          ) {
            field.type.elementType.values.push(value)
          } else {
            throw new Error('Type is not a Enum (or Set of Enum)')
          }
        }
      })
    },
    changeEnumValueLabel: (
      projectKey: string,
      resource: Writable<Type>,
      { fieldName, value }: TypeChangeEnumValueLabelAction
    ) => {
      resource.fieldDefinitions.forEach(field => {
        if (field.name == fieldName) {
          // TODO, should be done better i suppose
          if (field.type.name == 'Enum') {
            field.type.values.forEach(v => {
              if (v.key == value.key) {
                v.label = value.label
              }
            })
          } else if (
            field.type.name == 'Set' &&
            field.type.elementType.name == 'Enum'
          ) {
            field.type.elementType.values.forEach(v => {
              if (v.key == value.key) {
                v.label = value.label
              }
            })
          } else {
            throw new Error('Type is not a Enum (or Set of Enum)')
          }
        }
      })
    },
  }
}
