import {
    CustomerGroup,
    CustomerGroupDraft,
    ReferenceTypeId,
  } from '@commercetools/platform-sdk'
  import { getBaseResourceProperties } from '../helpers'
  import AbstractRepository from './abstract'

  export class CustomerGroupRepository extends AbstractRepository {
    getTypeId(): ReferenceTypeId {
      return 'customer'
    }
    create(projectKey: string, draft: CustomerGroupDraft): CustomerGroup {
      const resource: CustomerGroup = {
        ...getBaseResourceProperties(),
        name: draft.groupName,
      }
      this.save(projectKey, resource)
      return resource
    }
  }
