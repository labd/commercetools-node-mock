import type {
	BaseAddress,
	Customer,
	CustomerAddAddressAction,
	CustomerAddBillingAddressIdAction,
	CustomerAddShippingAddressIdAction,
	CustomerChangeAddressAction,
	CustomerChangeEmailAction,
	CustomerSetAuthenticationModeAction,
	CustomerSetCompanyNameAction,
	CustomerSetCustomFieldAction,
	CustomerSetCustomTypeAction,
	CustomerSetCustomerNumberAction,
	CustomerSetExternalIdAction,
	CustomerSetFirstNameAction,
	CustomerSetKeyAction,
	CustomerSetLastNameAction,
	CustomerSetLocaleAction,
	CustomerSetSalutationAction,
	CustomerSetVatIdAction,
	CustomerUpdateAction,
	InvalidInputError,
	InvalidJsonInputError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import { generateRandomString } from "~src/helpers";
import { hashPassword } from "~src/lib/password";
import type { Writable } from "~src/types";
import {
	AbstractUpdateHandler,
	UpdateHandlerInterface,
	type RepositoryContext,
} from "../abstract";
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
		const address = resource.addresses.find((a) => {
			if (a.id != undefined && addressId != undefined && a.id === addressId) {
				return true;
			}

			return (
				a.key != undefined && addressKey != undefined && a.key === addressKey
			);
		});

		if (!address) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: `Address with id '${addressId}' or key '${addressKey}' not found.`,
				},
				400,
			);
		}

		const billingAddressId = String(address.id);
		if (resource.billingAddressIds?.length) {
			resource.billingAddressIds.push(billingAddressId);
		} else if (address) {
			resource.billingAddressIds = [billingAddressId];
		}
	}

	addShippingAddressId(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ addressId, addressKey }: CustomerAddShippingAddressIdAction,
	) {
		const address = resource.addresses.find((a) => {
			if (a.id != undefined && addressId != undefined && a.id === addressId) {
				return true;
			}

			return (
				a.key != undefined && addressKey != undefined && a.key === addressKey
			);
		});

		if (!address) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: `Address with id '${addressId}' or key '${addressKey}' not found.`,
				},
				400,
			);
		}

		const shippingAddressId = String(address.id);
		if (resource.shippingAddressIds?.length) {
			resource.shippingAddressIds.push(shippingAddressId);
		} else if (address) {
			resource.shippingAddressIds = [shippingAddressId];
		}
	}

	changeAddress(
		context: RepositoryContext,
		resource: Writable<Customer>,
		{ addressId, addressKey, address }: CustomerChangeAddressAction,
	) {
		const oldAddressIndex = resource.addresses.findIndex((a) => {
			if (a.id != undefined && addressId != undefined && a.id === addressId) {
				return true;
			}

			return (
				a.key != undefined && addressKey != undefined && a.key === addressKey
			);
		});

		if (oldAddressIndex === -1) {
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: `Address with id '${addressId}' or key '${addressKey}' not found.`,
				},
				400,
			);
		}

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

	setSalutation(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ salutation }: CustomerSetSalutationAction,
	) {
		resource.salutation = salutation;
	}

	setVatId(
		_context: RepositoryContext,
		resource: Writable<Customer>,
		{ vatId }: CustomerSetVatIdAction,
	) {
		resource.vatId = vatId;
	}
}
