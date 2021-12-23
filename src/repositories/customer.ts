import {
  Customer,
  CustomerDraft,
  ReferenceTypeId,
} from '@commercetools/platform-sdk'
import { getBaseResourceProperties } from '../helpers'
import { AbstractResourceRepository } from './abstract'

export class CustomerRepository extends AbstractResourceRepository {
  getTypeId(): ReferenceTypeId {
    return 'customer'
  }
  create(projectKey: string, draft: CustomerDraft): Customer {
    const resource: Customer = {
      ...getBaseResourceProperties(),
      email: draft.email,
      password: draft.password,
      isEmailVerified: draft.isEmailVerified || false,
      addresses: [],
    }
    this.save(projectKey, resource)
    return resource
  }
}
