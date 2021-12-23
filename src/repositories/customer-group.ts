import {
  CustomerGroup,
  CustomerGroupChangeNameAction,
  CustomerGroupDraft,
  CustomerGroupSetKeyAction,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'

export class CustomerGroupRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'customer'
  }
  create(projectKey: string, draft: CustomerGroupDraft): CustomerGroup {
    const resource: CustomerGroup = {
      ...getBaseResourceProperties(),
      key: draft.key,
      name: draft.groupName,
    }
    this.save(projectKey, resource)
    return resource
  }

  actions = {
    setKey: (
      projectKey: string,
      resource: Writable<CustomerGroup>,
      { key }: CustomerGroupSetKeyAction
    ) => {
      resource.key = key
    },
    changeName: (
      projectKey: string,
      resource: Writable<CustomerGroup>,
      { name }: CustomerGroupChangeNameAction
    ) => {
      resource.name = name
    },
  }
}
