import { Cart, Category, CategoryDraft, ReferenceTypeId } from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import AbstractRepository from './abstract'
import { createCustomFields } from './helpers'

export class CategoryRepository extends AbstractRepository {
  getTypeId(): ReferenceTypeId {
    return 'category'
  }

  create(projectKey: string, draft: CategoryDraft): Category {
    const resource: Category = {
      ...getBaseResourceProperties(),
      name: draft.name,
      slug: draft.slug,
      orderHint: draft.orderHint || "",
      ancestors: [], // TODO
    }
    this.save(projectKey, resource)
    return resource
  }
}
