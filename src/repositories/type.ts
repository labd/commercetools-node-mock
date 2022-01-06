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
      // TODO
    },
    changeEnumValueLabel: (
      projectKey: string,
      resource: Writable<Type>,
      { fieldName, value }: TypeChangeEnumValueLabelAction
    ) => {
      // TODO
    },
  }
}
