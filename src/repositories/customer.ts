import type {
	Customer,
	CustomerChangeAddressAction,
	CustomerChangeEmailAction,
	CustomerDraft,
	CustomerSetAuthenticationModeAction,
	CustomerSetCompanyNameAction,
	CustomerSetCustomFieldAction,
	CustomerSetFirstNameAction,
	CustomerSetLastNameAction,
	CustomerSetVatIdAction,
	CustomerSetCustomerNumberAction,
	DuplicateFieldError,
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
import { hashPassword } from '../lib/password.js'
import { createAddress } from './helpers.js'

export class CustomerRepository extends AbstractResourceRepository<'customer'> {
	getTypeId() {
		return 'customer' as const
	}

	create(context: RepositoryContext, draft: CustomerDraft): Customer {
		// Check uniqueness
		const results = this._storage.query(context.projectKey, this.getTypeId(), {
			where: [`email="${draft.email.toLocaleLowerCase()}"`],
		})
		if (results.count > 0) {
			throw new CommercetoolsError<any>({
				code: 'CustomerAlreadyExists',
				statusCode: 400,
				message:
					'There is already an existing customer with the provided email.',
				errors: [
					{
						code: 'DuplicateField',
						message: `Customer with email '${draft.email}' already exists.`,
						duplicateValue: draft.email,
						field: 'email',
					} as DuplicateFieldError,
				],
			})
		}

		const resource: Customer = {
			...getBaseResourceProperties(),
			authenticationMode: draft.authenticationMode || 'Password',
			email: draft.email.toLowerCase(),
			password: draft.password ? hashPassword(draft.password) : undefined,
			isEmailVerified: draft.isEmailVerified || false,
			addresses: [],
			customerNumber: draft.customerNumber,
		}
		this.saveNew(context, resource)
		return resource
	}

	getMe(context: RepositoryContext): Customer | undefined {
		// grab the first customer you can find for now. In the future we should
		// use the customer id from the scope of the token
		const results = this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{}
		)

		if (results.count > 0) {
			return results.results[0] as Customer
		}

		return
	}

	deleteMe(context: RepositoryContext): Customer | undefined {
		// grab the first customer you can find for now. In the future we should
		// use the customer id from the scope of the token
		const results = this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{}
		)

		if (results.count > 0) {
			return this.delete(context, results.results[0].id) as Customer
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
		setFirstName: (
			_context: RepositoryContext,
			resource: Writable<Customer>,
			{ firstName }: CustomerSetFirstNameAction
		) => {
			resource.firstName = firstName
		},
		setLastName: (
			_context: RepositoryContext,
			resource: Writable<Customer>,
			{ lastName }: CustomerSetLastNameAction
		) => {
			resource.lastName = lastName
		},
		setCompanyName: (
			_context: RepositoryContext,
			resource: Writable<Customer>,
			{ companyName }: CustomerSetCompanyNameAction
		) => {
			resource.companyName = companyName
		},
		setVatId: (
			_context: RepositoryContext,
			resource: Writable<Customer>,
			{ vatId }: CustomerSetVatIdAction
		) => {
			resource.vatId = vatId
		},
		changeAddress: (
			context: RepositoryContext,
			resource: Writable<Customer>,
			{ addressId, addressKey, address }: CustomerChangeAddressAction
		) => {
			const oldAddressIndex = resource.addresses.findIndex((a) => {
				if (a.id != undefined && addressId != undefined && a.id === addressId) {
					return true
				}

				return (
					a.key != undefined && addressKey != undefined && a.key === addressKey
				)
			})

			if (oldAddressIndex === -1) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: 'InvalidInput',
						message: `Address with id '${addressId}' or key '${addressKey}' not found.`,
					},
					400
				)
			}

			const newAddress = createAddress(
				address,
				context.projectKey,
				this._storage
			)

			if (newAddress) {
				resource.addresses[oldAddressIndex] = {
					id: addressId,
					...newAddress,
				}
			}
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
				resource.password = password ? hashPassword(password) : undefined
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
		setCustomerNumber: (
			_context: RepositoryContext,
			resource: Writable<Customer>,
			{ customerNumber }: CustomerSetCustomerNumberAction
		) => {
			if (resource.customerNumber) {
				throw new Error(
					'A Customer number already exists and cannot be set again.'
				)
			}
			resource.customerNumber = customerNumber
		},
	}
}
