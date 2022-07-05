import { v4 as uuidv4 } from 'uuid'
import {
  Address,
  BaseAddress,
  CustomFields,
  CustomFieldsDraft,
  Money,
  Price,
  PriceDraft,
  Reference,
  ResourceIdentifier,
  Store,
  StoreKeyReference,
  StoreResourceIdentifier,
  Type,
  TypedMoney,
} from '@commercetools/platform-sdk'
import { AbstractStorage } from '../storage'
import { RepositoryContext } from './abstract'
import { Request } from 'express'

export const createAddress = (
  base: BaseAddress | undefined,
  projectKey: string,
  storage: AbstractStorage
): Address | undefined => {
  if (!base) return undefined

  if (!base?.country) {
    throw new Error('Country is required')
  }

  return {
    ...base,
  }
}

export const createCustomFields = (
  draft: CustomFieldsDraft | undefined,
  projectKey: string,
  storage: AbstractStorage
): CustomFields | undefined => {
  if (!draft) return undefined
  if (!draft.type) return undefined
  if (!draft.type.typeId) return undefined
  if (!draft.fields) return undefined
  const typeResource = storage.getByResourceIdentifier(
    projectKey,
    draft.type
  ) as Type

  if (!typeResource) {
    throw new Error(
      `No type '${draft.type.typeId}' with id=${draft.type.id} or key=${draft.type.key}`
    )
  }

  return {
    type: {
      typeId: draft.type.typeId,
      id: typeResource.id,
    },
    fields: draft.fields,
  }
}

export const createPrice = (draft: PriceDraft): Price => {
  return {
    id: uuidv4(),
    value: createTypedMoney(draft.value),
  }
}

export const createTypedMoney = (value: Money): TypedMoney => {
  return {
    type: 'centPrecision',
    fractionDigits: 2,
    ...value,
  }
}

export const resolveStoreReference = (
  ref: StoreResourceIdentifier | undefined,
  projectKey: string,
  storage: AbstractStorage
): StoreKeyReference | undefined => {
  if (!ref) return undefined
  const resource = storage.getByResourceIdentifier(projectKey, ref)
  if (!resource) {
    throw new Error('No such store')
  }

  const store = resource as Store
  return {
    typeId: 'store',
    key: store.key,
  }
}

export const getReferenceFromResourceIdentifier = <T extends Reference>(
  resourceIdentifier: ResourceIdentifier,
  projectKey: string,
  storage: AbstractStorage
): T => {
  const resource = storage.getByResourceIdentifier(
    projectKey,
    resourceIdentifier
  )
  if (!resource)
    throw new Error(
      `resource type ${resourceIdentifier.typeId} with id ${resourceIdentifier.id} and key ${resourceIdentifier.key} not found`
    )

  return ({
    typeId: resourceIdentifier.typeId,
    id: resource?.id,
  } as unknown) as T
}

export const getRepositoryContext = (request: Request): RepositoryContext => {
  return {
    projectKey: request.params.projectKey,
    storeKey: request.params.storeKey,
  }
}
