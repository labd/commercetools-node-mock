import { v4 as uuidv4 } from 'uuid';
import {
  CustomFields,
  CustomFieldsDraft,
  Money,
  Price,
  PriceDraft,
  Type,
  TypedMoney,
} from '@commercetools/platform-sdk';
import { AbstractStorage } from 'storage';

export const createCustomFields = (
  draft: CustomFieldsDraft | undefined,
  storage: AbstractStorage
): CustomFields | undefined => {
  if (!draft) return undefined;
  if (!draft.fields) return undefined;

  const typeResource = storage.getByResourceIdentifier(draft.type) as Type;
  if (!typeResource) {
    throw new Error(
      `No type '${draft.type.typeId}' with id=${draft.type.id} or key=${draft.type.key}`
    );
  }

  return {
    type: {
      typeId: draft.type.typeId,
      id: typeResource.id,
    },
    fields: draft.fields,
  };
};

export const createPrice = (draft: PriceDraft): Price => {
  return {
    id: uuidv4(),
    value: createTypedMoney(draft.value),
  };
};

export const createTypedMoney = (value: Money): TypedMoney => {
  return {
    type: 'centPrecision',
    fractionDigits: 2,
    ...value,
  };
};
