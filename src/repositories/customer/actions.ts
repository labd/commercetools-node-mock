import type {
	Address,
	BaseAddress,
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
	CustomerSetCustomFieldAction,
	CustomerSetCustomTypeAction,
	CustomerSetCustomerGroupAction,
	CustomerSetCustomerNumberAction,
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
import assert from "node:assert";
import { CommercetoolsError } from "~src/exceptions";
import { generateRandomString } from "~src/helpers";
import { hashPassword } from "~src/lib/password";
import type { Writable } from "~src/types";
import type { UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract";
import { createAddress, createCustomFields } from "../helpers";

export class CustomerUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Customer, CustomerUpdateAction>>
{
	addAddress(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ address }: CustomerAddAddressAction,
	) {
		resource.addresses.push({
			...address,
			id: address.id ?? generateRandomString(5),
		} as BaseAddress);
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
		return resource;
	}

	addStore(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerAddStoreAction,
	) {
		throw new Error("Method not implemented.");
	}

	changeAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ addressId, addressKey, address }: CustomerChangeAddressAction,
	) {
		const current = this._findAddress(resource, addressId, addressKey, true);
		assert(current?.id); // always true since we set required to true

		const oldAddressIndex = resource.addresses.findIndex(
			(a) => a.id === current.id,
		);

		const newAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);

		if (newAddress) {
			resource.addresses[oldAddressIndex] = {
				id: addressId,
				...newAddress,
			};
		}
	}

	changeEmail(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ email }: CustomerChangeEmailAction,
	) {
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

	removeStore(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerRemoveStoreAction,
	) {
		throw new Error("Method not implemented.");
	}

	setAddressCustomField(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetAddressCustomFieldAction,
	) {
		throw new Error("Method not implemented.");
	}

	setAddressCustomType(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetAddressCustomTypeAction,
	) {
		throw new Error("Method not implemented.");
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
			delete resource.password;
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

	setCustomerGroup(
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

		const group = this._storage.getByResourceIdentifier<"customer-group">(
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
			throw new Error(
				"A Customer number already exists and cannot be set again.",
			);
		}
		resource.customerNumber = customerNumber;
	}

	setCustomField(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ name, value }: CustomerSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom field");
		}
		resource.custom.fields[name] = value;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ type, fields }: CustomerSetCustomTypeAction,
	) {
		if (type) {
			resource.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
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

	setStores(
		context: RepositoryContext,
		resource: Writable<Customer>,
		action: CustomerSetStoresAction,
	) {
		throw new Error("Method not implemented.");
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
		required: boolean = false,
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
