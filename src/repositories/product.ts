import { v4 as uuidv4 } from 'uuid'
import {
  Product,
  ProductDraft,
  ReferenceTypeId,
  State,
  StateDraft,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'

export class ProductRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'product'
  }

  create(projectKey: string, draft: ProductDraft): Product {
    const resource: Product = {
      ...getBaseResourceProperties(),
      masterData: {
        current: {
          name: draft.name,
          slug: draft.slug,
          categories: [],
          masterVariant: {
            id: 0,
            sku: draft.masterVariant?.sku,
          },
          variants: [],

          // @ts-ignore
          searchKeywords: draft.searchKeywords,
        },
      },
    }

    return resource
  }

  actions = {}
}
