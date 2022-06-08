import {
  CustomerGroup,
  CustomerGroupChangeNameAction,
  CustomerGroupDraft,
  CustomerGroupSetKeyAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository, RepositoryContext } from './abstract'

export class CustomerGroupRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'customer'
  }
  create(context: RepositoryContext, draft: CustomerGroupDraft): CustomerGroup {
    const resource: CustomerGroup = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.groupName,
    }
    this.save(context, resource)
    return resource
  }

  actions = {
    setKey: (
      context: RepositoryContext,
      resource: Writable<CustomerGroup>,
      { key }: CustomerGroupSetKeyAction
    ) => {
      resource.key = key
    },
    changeName: (
      context: RepositoryContext,
      resource: Writable<CustomerGroup>,
      { name }: CustomerGroupChangeNameAction
    ) => {
      resource.name = name
    },
  }
}
