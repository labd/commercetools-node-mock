import type {
  Customer,
  CustomerChangeEmailAction,
  CustomerDraft,
  CustomerSetAuthenticationModeAction,
  CustomerSetCustomFieldAction,
  GeneralError,
  InvalidInputError,
  InvalidJsonInputError,
} from '@commercetools/platform-sdk'
import { CommercetoolsError } from '../exceptions.js'
import { getBaseResourceProperties } from '../helpers.js'
import type { Writable } from '../types.js'
import {
  AbstractResourceRepository,
  type RepositoryContext,
} from './abstract.js'

export class CustomerRepository extends AbstractResourceRepository<'customer'> {
  getTypeId() {
    return 'customer' as const
  }

  create(context: RepositoryContext, draft: CustomerDraft): Customer {
    const resource: Customer = {
      ...getBaseResourceProperties(),
      authenticationMode: draft.authenticationMode || 'Password',
      email: draft.email,
      password: draft.password
        ? Buffer.from(draft.password).toString('base64')
        : undefined,
      isEmailVerified: draft.isEmailVerified || false,
      addresses: [],
    }
    this.saveNew(context, resource)
    return resource
  }

  getMe(context: RepositoryContext): Customer | undefined {
    const results = this._storage.query(
      context.projectKey,
      this.getTypeId(),
      {}
    ) // grab the first customer you can find
    if (results.count > 0) {
      return results.results[0] as Customer
    }

    return
  }

  actions = {
    changeEmail: (
      _context: RepositoryContext,
      resource: Writable<Customer>,
      { email }: CustomerChangeEmailAction
    ) => {
      resource.email = email
    },
    setAuthenticationMode: (
      _context: RepositoryContext,
      resource: Writable<Customer>,
      { authMode, password }: CustomerSetAuthenticationModeAction
    ) => {
      if (resource.authenticationMode === authMode) {
        throw new CommercetoolsError<InvalidInputError>(
          {
            code: 'InvalidInput',
            message: `The customer is already using the '${resource.authenticationMode}' authentication mode.`,
          },
          400
        )
      }
      resource.authenticationMode = authMode
      if (authMode === 'ExternalAuth') {
        delete resource.password
        return
      }
      if (authMode === 'Password') {
        resource.password = password
          ? Buffer.from(password).toString('base64')
          : undefined
        return
      }
      throw new CommercetoolsError<InvalidJsonInputError>(
        {
          code: 'InvalidJsonInput',
          message: 'Request body does not contain valid JSON.',
          detailedErrorMessage: `actions -> authMode: Invalid enum value: '${authMode}'. Expected one of: 'Password','ExternalAuth'`,
        },
        400
      )
    },
    setCustomField: (
      _context: RepositoryContext,
      resource: Writable<Customer>,
      { name, value }: CustomerSetCustomFieldAction
    ) => {
      if (!resource.custom) {
        throw new Error('Resource has no custom field')
      }
      resource.custom.fields[name] = value
    },
  }
}
