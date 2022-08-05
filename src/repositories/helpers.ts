import { v4 as uuidv4 } from 'uuid'
import {
  Address,
  BaseAddress,
  CustomFields,
  CustomFieldsDraft,
  InvalidJsonInputError,
  Money,
  Price,
  PriceDraft,
  Reference,
  ReferencedResourceNotFoundError,
  ResourceIdentifier,
  Store,
  StoreKeyReference,
  StoreResourceIdentifier,
  Type,
  TypedMoney,
} from '@commercetools/platform-sdk'
import { Request } from 'express'
import { AbstractStorage } from '../storage'
import { RepositoryContext } from './abstract'
import { CommercetoolsError } from '../exceptions'

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

  // Taken from https://docs.adyen.com/development-resources/currency-codes
  let fractionDigits = 2
  switch (value.currencyCode.toUpperCase()) {
    case 'BHD':
    case 'IQD':
    case 'JOD':
    case 'KWD':
    case 'LYD':
    case 'OMR':
    case 'TND':
      fractionDigits = 3
      break
    case 'CVE':
    case 'DJF':
    case 'GNF':
    case 'IDR':
    case 'JPY':
    case 'KMF':
    case 'KRW':
    case 'PYG':
    case 'RWF':
    case 'UGX':
    case 'VND':
    case 'VUV':
    case 'XAF':
    case 'XOF':
    case 'XPF':
      fractionDigits = 0
      break
    default:
      fractionDigits = 2
  }

  return {
    type: 'centPrecision',
    ...value,
    fractionDigits: fractionDigits,
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
  if (!resourceIdentifier.id && !resourceIdentifier.key) {
    throw new CommercetoolsError<InvalidJsonInputError>(
      {
        code: 'InvalidJsonInput',
        message: `${resourceIdentifier.typeId}: ResourceIdentifier requires an 'id' xor a 'key'`,
      },
      400
    )
  }

  const resource = storage.getByResourceIdentifier(
    projectKey,
    resourceIdentifier
  )
  if (!resource) {
    const errIdentifier = resourceIdentifier.key
      ? `key '${resourceIdentifier.key}'`
      : `identifier '${resourceIdentifier.key}'`

    throw new CommercetoolsError<ReferencedResourceNotFoundError>(
      {
        code: 'ReferencedResourceNotFound',
        // @ts-ignore
        typeId: resourceIdentifier.typeId,
        message: `The referenced object of type '${resourceIdentifier.typeId}' with '${errIdentifier}' was not found. It either doesn't exist, or it can't be accessed from this endpoint (e.g., if the endpoint filters by store or customer account).`,
      },
      400
    )
  }

  return {
    typeId: resourceIdentifier.typeId,
    id: resource?.id,
  } as unknown as T
}

export const getRepositoryContext = (request: Request): RepositoryContext => {
  return {
    projectKey: request.params.projectKey,
    storeKey: request.params.storeKey,
  }
}
