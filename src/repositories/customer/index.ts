import type {
	Customer,
	CustomerDraft,
	CustomerToken,
	DuplicateFieldError,
	ResourceNotFoundError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import { generateRandomString, getBaseResourceProperties } from "~src/helpers";
import { createPasswordResetToken, hashPassword } from "~src/lib/password";
import { AbstractStorage } from "~src/storage/abstract";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract";
import { createCustomFields } from "../helpers";
import { CustomerUpdateHandler } from "./actions";

export class CustomerRepository extends AbstractResourceRepository<"customer"> {
	constructor(storage: AbstractStorage) {
		super("customer", storage);
		this.actions = new CustomerUpdateHandler(storage);
	}

	create(context: RepositoryContext, draft: CustomerDraft): Customer {
		// Check uniqueness
		const results = this._storage.query(context.projectKey, this.getTypeId(), {
			where: [`email="${draft.email.toLocaleLowerCase()}"`],
		});
		if (results.count > 0) {
			throw new CommercetoolsError<any>({
				code: "CustomerAlreadyExists",
				statusCode: 400,
				message:
					"There is already an existing customer with the provided email.",
				errors: [
					{
						code: "DuplicateField",
						message: `Customer with email '${draft.email}' already exists.`,
						duplicateValue: draft.email,
						field: "email",
					} as DuplicateFieldError,
				],
			});
		}

		const addresses =
			draft.addresses?.map((address) => ({
				...address,
				id: generateRandomString(5),
			})) ?? [];

		const defaultBillingAddressId =
			addresses.length > 0 && draft.defaultBillingAddress !== undefined
				? addresses[draft.defaultBillingAddress].id
				: undefined;
		const defaultShippingAddressId =
			addresses.length > 0 && draft.defaultShippingAddress !== undefined
				? addresses[draft.defaultShippingAddress].id
				: undefined;

		const resource: Customer = {
			...getBaseResourceProperties(),
			key: draft.key,
			authenticationMode: draft.authenticationMode || "Password",
			firstName: draft.firstName,
			lastName: draft.lastName,
			middleName: draft.middleName,
			title: draft.title,
			dateOfBirth: draft.dateOfBirth,
			companyName: draft.companyName,
			email: draft.email.toLowerCase(),
			password: draft.password ? hashPassword(draft.password) : undefined,
			isEmailVerified: draft.isEmailVerified || false,
			addresses: addresses,
			customerNumber: draft.customerNumber,
			externalId: draft.externalId,
			defaultBillingAddressId: defaultBillingAddressId,
			defaultShippingAddressId: defaultShippingAddressId,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
		};
		return this.saveNew(context, resource);
	}

	passwordResetToken(context: RepositoryContext, email: string): CustomerToken {
		const results = this._storage.query(context.projectKey, this.getTypeId(), {
			where: [`email="${email.toLocaleLowerCase()}"`],
		});
		if (results.count === 0) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID '${email}' was not found.`,
			});
		}
		const expiresAt = new Date(Date.now() + 30 * 60);
		const customer = results.results[0] as Customer;
		const rest = getBaseResourceProperties();

		const token = createPasswordResetToken(customer);
		return {
			id: rest.id,
			createdAt: rest.createdAt,
			lastModifiedAt: rest.lastModifiedAt,
			customerId: customer.id,
			expiresAt: expiresAt.toISOString(),
			value: token,
		};
	}
}
