import assert from "node:assert";
import type {
	Address,
	Customer,
	CustomerAddAddressAction,
	CustomerAddBillingAddressIdAction,
	CustomerAddShippingAddressIdAction,
	CustomerAddStoreAction,
	CustomerChangeAddressAction,
	CustomerChangeEmailAction,
	CustomerRemoveAddressAction,
	CustomerRemoveBillingAddressIdAction,
	CustomerRemoveShippingAddressIdAction,
	CustomerRemoveStoreAction,
	CustomerSetAddressCustomFieldAction,
	CustomerSetAddressCustomTypeAction,
	CustomerSetAuthenticationModeAction,
	CustomerSetCompanyNameAction,
	CustomerSetCustomerGroupAction,
	CustomerSetCustomerNumberAction,
	CustomerSetCustomFieldAction,
	CustomerSetCustomTypeAction,
	CustomerSetDateOfBirthAction,
	CustomerSetDefaultBillingAddressAction,
	CustomerSetDefaultShippingAddressAction,
	CustomerSetExternalIdAction,
	CustomerSetFirstNameAction,
	CustomerSetKeyAction,
	CustomerSetLastNameAction,
	CustomerSetLocaleAction,
	CustomerSetMiddleNameAction,
	CustomerSetSalutationAction,
	CustomerSetStoresAction,
	CustomerSetTitleAction,
	CustomerSetVatIdAction,
	CustomerUpdateAction,
	InvalidInputError,
	InvalidJsonInputError,
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import { generateRandomString } from "#src/helpers.ts";
import { hashPassword } from "#src/lib/password.ts";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";
import {
	createAddress,
	getStoreKeyReference,
	getStoreKeyReferences,
} from "../helpers.ts";
import { checkEmailUniqueness } from "./helpers.ts";

export class CustomerUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Customer, CustomerUpdateAction>>
{
	async addAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ address }: CustomerAddAddressAction,
	) {
		resource.addresses.push(
			await createAddress(
				{ ...address, id: address.id ?? generateRandomString(5) },
				context.projectKey,
				this._storage,
			),
		);
	}

	addBillingAddressId(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ addressId, addressKey }: CustomerAddBillingAddressIdAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true

		if (resource.billingAddressIds === undefined) {
			resource.billingAddressIds = [];
		}

		if (!resource.billingAddressIds.includes(address.id)) {
			resource.billingAddressIds.push(address.id);
		}
	}

	addShippingAddressId(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ addressId, addressKey }: CustomerAddShippingAddressIdAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true

		if (resource.shippingAddressIds === undefined) {
			resource.shippingAddressIds = [];
		}

		if (!resource.shippingAddressIds.includes(address.id)) {
			resource.shippingAddressIds.push(address.id);
		}
	}

	async addStore(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ store }: CustomerAddStoreAction,
	) {
		const reference = await getStoreKeyReference(
			store,
			context.projectKey,
			this._storage,
		);

		const stores = resource.stores ?? [];
		if (stores.some((s) => s.key === reference.key)) {
			return;
		}

		// The customer enters a new uniqueness scope, so the email has to be
		// available in the store that is being added.
		await checkEmailUniqueness(
			this._storage,
			context.projectKey,
			resource.email,
			[reference.key],
			resource.id,
		);

		resource.stores = [...stores, reference];
	}

	async changeAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ addressId, addressKey, address }: CustomerChangeAddressAction,
	) {
		const current = this._findAddress(resource, addressId, addressKey, true);
		assert(current?.id); // always true since we set required to true

		const oldAddressIndex = resource.addresses.findIndex(
			(a) => a.id === current.id,
		);

		resource.addresses[oldAddressIndex] = await createAddress(
			{ ...address, id: current.id },
			context.projectKey,
			this._storage,
		);
	}

	async changeEmail(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ email }: CustomerChangeEmailAction,
	) {
		await checkEmailUniqueness(
			this._storage,
			context.projectKey,
			email,
			resource.stores?.map((store) => store.key) ?? [],
			resource.id,
		);

		resource.email = email;
	}

	removeAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerRemoveAddressAction,
	) {
		const address = this._findAddress(
			resource,
			action.addressId,
			action.addressKey,
			true,
		);
		assert(address?.id); // always true since we set required to true
		resource.addresses = resource.addresses.filter((a) => a.id !== address.id);

		if (resource.shippingAddressIds) {
			resource.shippingAddressIds = resource.shippingAddressIds.filter(
				(id) => id !== address.id,
			);
		}
		if (resource.billingAddressIds) {
			resource.billingAddressIds = resource.billingAddressIds.filter(
				(id) => id !== address.id,
			);
		}

		if (resource.defaultShippingAddressId === address.id) {
			resource.defaultShippingAddressId = undefined;
		}
		if (resource.defaultBillingAddressId === address.id) {
			resource.defaultBillingAddressId = undefined;
		}
	}

	removeBillingAddressId(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerRemoveBillingAddressIdAction,
	) {
		const address = this._findAddress(
			resource,
			action.addressId,
			action.addressKey,
			true,
		);
		assert(address?.id); // always true since we set required to true
		resource.billingAddressIds = resource.billingAddressIds?.filter(
			(id) => id !== address.id,
		);
		if (resource.defaultBillingAddressId === address.id) {
			resource.defaultBillingAddressId = undefined;
		}
	}

	removeShippingAddressId(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerRemoveShippingAddressIdAction,
	) {
		const address = this._findAddress(
			resource,
			action.addressId,
			action.addressKey,
			true,
		);
		assert(address?.id); // always true since we set required to true
		resource.shippingAddressIds = resource.shippingAddressIds?.filter(
			(id) => id !== address.id,
		);
		if (resource.defaultShippingAddressId === address.id) {
			resource.defaultShippingAddressId = undefined;
		}
	}

	async removeStore(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ store }: CustomerRemoveStoreAction,
	) {
		const reference = await getStoreKeyReference(
			store,
			context.projectKey,
			this._storage,
		);

		const stores = resource.stores ?? [];
		if (!stores.some((s) => s.key === reference.key)) {
			return;
		}

		const remaining = stores.filter((s) => s.key !== reference.key);

		// Without any stores left the customer becomes a global customer, which
		// requires the email to be unique across the project.
		if (remaining.length === 0) {
			await checkEmailUniqueness(
				this._storage,
				context.projectKey,
				resource.email,
				[],
				resource.id,
			);
		}

		resource.stores = remaining;
	}

	setAddressCustomField(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetAddressCustomFieldAction,
	) {
		throw new CommercetoolsError<InvalidOperationError>(
			{
				code: "InvalidOperation",
				message: "The action 'setAddressCustomField' is not implemented yet",
			},
			400,
		);
	}

	setAddressCustomType(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetAddressCustomTypeAction,
	) {
		throw new CommercetoolsError<InvalidOperationError>(
			{
				code: "InvalidOperation",
				message: "The action 'setAddressCustomType' is not implemented yet",
			},
			400,
		);
	}

	setAuthenticationMode(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ authMode, password }: CustomerSetAuthenticationModeAction,
	) {
		if (resource.authenticationMode === authMode) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: `The customer is already using the '${resource.authenticationMode}' authentication mode.`,
				},
				400,
			);
		}
		resource.authenticationMode = authMode;
		if (authMode === "ExternalAuth") {
			resource.password = undefined;
			return;
		}
		if (authMode === "Password") {
			resource.password = password ? hashPassword(password) : undefined;
			return;
		}
		throw new CommercetoolsError<InvalidJsonInputError>(
			{
				code: "InvalidJsonInput",
				message: "Request body does not contain valid JSON.",
				detailedErrorMessage: `actions -> authMode: Invalid enum value: '${authMode}'. Expected one of: 'Password','ExternalAuth'`,
			},
			400,
		);
	}

	setCompanyName(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ companyName }: CustomerSetCompanyNameAction,
	) {
		resource.companyName = companyName;
	}

	async setCustomerGroup(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetCustomerGroupAction,
	) {
		if (!action.customerGroup) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "CustomerGroup is required.",
				},
				400,
			);
		}

		const group = await this._storage.getByResourceIdentifier<"customer-group">(
			context.projectKey,
			action.customerGroup,
		);

		resource.customerGroup = {
			typeId: "customer-group",
			id: group.id,
		};
	}

	setCustomerNumber(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ customerNumber }: CustomerSetCustomerNumberAction,
	) {
		if (resource.customerNumber) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "A Customer number already exists and cannot be set again.",
				},
				400,
			);
		}
		resource.customerNumber = customerNumber;
	}

	setCustomField(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ name, value }: CustomerSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	async setCustomType(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ type, fields }: CustomerSetCustomTypeAction,
	) {
		await this._setCustomType(context, resource, { type, fields });
	}

	setDateOfBirth(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetDateOfBirthAction,
	) {
		resource.dateOfBirth = action.dateOfBirth;
	}

	setDefaultBillingAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetDefaultBillingAddressAction,
	) {
		const address = this._findAddress(
			resource,
			action.addressId,
			action.addressKey,
			true,
		);
		assert(address?.id); // always true since we set required to true

		resource.defaultBillingAddressId = address.id;
		if (resource.billingAddressIds === undefined) {
			resource.billingAddressIds = [];
		}
		if (!resource.billingAddressIds.includes(address.id)) {
			resource.billingAddressIds.push(address.id);
		}
	}

	setDefaultShippingAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetDefaultShippingAddressAction,
	) {
		const address = this._findAddress(
			resource,
			action.addressId,
			action.addressKey,
			true,
		);
		assert(address?.id); // always true since we set required to true

		resource.defaultShippingAddressId = address.id;
		if (resource.shippingAddressIds === undefined) {
			resource.shippingAddressIds = [];
		}
		if (!resource.shippingAddressIds.includes(address.id)) {
			resource.shippingAddressIds.push(address.id);
		}
	}

	setExternalId(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ externalId }: CustomerSetExternalIdAction,
	) {
		resource.externalId = externalId;
	}

	setFirstName(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ firstName }: CustomerSetFirstNameAction,
	) {
		resource.firstName = firstName;
	}

	setKey(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ key }: CustomerSetKeyAction,
	) {
		resource.key = key;
	}

	setLastName(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ lastName }: CustomerSetLastNameAction,
	) {
		resource.lastName = lastName;
	}

	setLocale(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ locale }: CustomerSetLocaleAction,
	) {
		resource.locale = locale;
	}

	setMiddleName(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetMiddleNameAction,
	) {
		resource.middleName = action.middleName;
	}

	setSalutation(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ salutation }: CustomerSetSalutationAction,
	) {
		resource.salutation = salutation;
	}

	async setStores(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ stores }: CustomerSetStoresAction,
	) {
		const references = await getStoreKeyReferences(
			stores,
			context.projectKey,
			this._storage,
		);

		const currentKeys = (resource.stores ?? []).map((s) => s.key);
		// Scopes the customer is already part of don't need to be re-validated.
		const addedKeys = references
			.map((s) => s.key)
			.filter((key) => !currentKeys.includes(key));

		if (references.length === 0) {
			// Becoming a global customer requires project wide uniqueness.
			await checkEmailUniqueness(
				this._storage,
				context.projectKey,
				resource.email,
				[],
				resource.id,
			);
		} else if (addedKeys.length > 0) {
			await checkEmailUniqueness(
				this._storage,
				context.projectKey,
				resource.email,
				addedKeys,
				resource.id,
			);
		}

		resource.stores = references;
	}

	setTitle(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetTitleAction,
	) {
		resource.title = action.title;
	}

	setVatId(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ vatId }: CustomerSetVatIdAction,
	) {
		resource.vatId = vatId;
	}

	private _findAddress(
		resource: Writable<Customer>,
		addressId: string | undefined,
		addressKey: string | undefined,
		required = false,
	): Address | undefined {
		if (addressKey) {
			const address = resource.addresses.find((a) => a.key === addressKey);
			if (!address) {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message: `Customer does not contain an address with the key ${addressKey}.`,
					},
					400,
				);
			}
			return address;
		}

		if (addressId) {
			const address = resource.addresses.find((a) => a.id === addressId);
			if (!address) {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message: `Customer does not contain an address with the id ${addressId}.`,
					},
					400,
				);
			}
			return address;
		}

		if (required) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "One of address 'addressId' or 'addressKey' is required.",
				},
				400,
			);
		}
	}
}
