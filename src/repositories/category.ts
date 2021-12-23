import {
  Category,
  CategoryDraft,
  CategorySetDescriptionAction,
  CategorySetKeyAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'

export class CategoryRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'category'
  }

  create(projectKey: string, draft: CategoryDraft): Category {
    const resource: Category = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.name,
      slug: draft.slug,
      orderHint: draft.orderHint || '',
      parent: draft.parent
        ? { typeId: 'category', id: draft.parent.id! }
        : undefined,
      ancestors: [], // TODO
    }
    this.save(projectKey, resource)
    return resource
  }

  actions = {
    setKey: (
      projectKey: string,
      resource: Writable<Category>,
      { key }: CategorySetKeyAction
    ) => {
      resource.key = key
    },
    setDescription: (
      projectKey: string,
      resource: Writable<Category>,
      { description }: CategorySetDescriptionAction
    ) => {
      resource.description = description
    },
  }
}
