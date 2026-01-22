import type {
	Address,
	Customer,
	CustomerCreatePasswordResetToken,
	CustomerDraft,
	CustomerResetPassword,
	CustomerToken,
	DuplicateFieldError,
	InvalidInputError,
	MyCustomerResetPassword,
	ResourceNotFoundError,
	Store,
	StoreKeyReference,
	StoreResourceIdentifier,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import {
	generateRandomString,
	getBaseResourceProperties,
} from "#src/helpers.ts";
import {
	createEmailVerifyToken,
	createPasswordResetToken,
	hashPassword,
	validateEmailVerifyToken,
	validatePasswordResetToken,
} from "#src/lib/password.ts";
import type { ResourceMap, ShallowWritable, Writable } from "#src/types.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { createCustomFields } from "../helpers.ts";
import { CustomerUpdateHandler } from "./actions.ts";

export class CustomerRepository extends AbstractResourceRepository<"customer"> {
	constructor(config: Config) {
		super("customer", config);
		this.actions = new CustomerUpdateHandler(config.storage);
	}

	create(context: RepositoryContext, draft: CustomerDraft): Customer {
		// Check uniqueness
		const results = this._storage.query(context.projectKey, this.getTypeId(), {
			where: [`lowercaseEmail="${draft.email.toLowerCase()}"`],
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

		const addresses: Address[] =
			draft.addresses?.map((address) => ({
				...address,
				id: generateRandomString(5),
			})) ?? [];

		const lookupAdressId = (
			addresses: Address[],
			addressId: number,
		): string => {
			if (addressId < addresses.length) {
				const id = addresses[addressId].id;
				if (!id) {
					throw new Error("Address ID is missing");
				}
				return id;
			}
			throw new CommercetoolsError<InvalidInputError>({
				code: "InvalidInput",
				message: `Address with ID '${addressId}' not found.`,
				errors: [
					{
						code: "InvalidInput",
						message: `Address with ID '${addressId}' not found.`,
						field: "addressId",
					},
				],
			});
		};

		const defaultBillingAddressId =
			draft.defaultBillingAddress !== undefined
				? lookupAdressId(addresses, draft.defaultBillingAddress)
				: undefined;
		const defaultShippingAddressId =
			draft.defaultShippingAddress !== undefined
				? lookupAdressId(addresses, draft.defaultShippingAddress)
				: undefined;
		const shippingAddressIds =
			draft.shippingAddresses?.map((addressId) =>
				lookupAdressId(addresses, addressId),
			) ?? [];
		const billingAddressIds =
			draft.billingAddresses?.map((addressId) =>
				lookupAdressId(addresses, addressId),
			) ?? [];

		let storesForCustomer: StoreKeyReference[] = [];

		if (draft.stores && draft.stores.length > 0) {
			storesForCustomer = this.storeReferenceToStoreKeyReference(
				draft.stores,
				context.projectKey,
			);
		}

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
			lowercaseEmail: draft.email.toLowerCase(),
			password: draft.password ? hashPassword(draft.password) : undefined,
			isEmailVerified: draft.isEmailVerified || false,
			addresses: addresses,
			customerNumber: draft.customerNumber,
			externalId: draft.externalId,
			defaultBillingAddressId: defaultBillingAddressId,
			defaultShippingAddressId: defaultShippingAddressId,
			shippingAddressIds: shippingAddressIds,
			billingAddressIds: billingAddressIds,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			stores: storesForCustomer,
		} satisfies unknown as Customer;

		return this.saveNew(context, resource);
	}

	saveUpdate(
		context: RepositoryContext,
		version: number,
		resource: ShallowWritable<ResourceMap["customer"]>,
	): ShallowWritable<ResourceMap["customer"]> {
		// Also update lowercaseEmail attribute
		const updatedResource: Customer = {
			...resource,
			lowercaseEmail: resource.email.toLowerCase(),
		} satisfies unknown as Customer;

		return super.saveUpdate(context, version, updatedResource);
	}

	passwordResetToken(
		context: RepositoryContext,
		request: CustomerCreatePasswordResetToken,
	): CustomerToken {
		const results = this._storage.query(context.projectKey, this.getTypeId(), {
			where: [`email="${request.email.toLocaleLowerCase()}"`],
		});
		if (results.count === 0) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID '${request.email}' was not found.`,
			});
		}

		const ttlMinutes = request.ttlMinutes ?? 34560; // 34560 is CT default

		const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
		const customer = results.results[0] as Customer;
		const rest = getBaseResourceProperties();

		const token = createPasswordResetToken(customer, expiresAt);

		return {
			id: rest.id,
			createdAt: rest.createdAt,
			lastModifiedAt: rest.lastModifiedAt,
			customerId: customer.id,
			expiresAt: expiresAt.toISOString(),
			value: token,
			invalidateOlderTokens: request.invalidateOlderTokens || false,
		};
	}

	passwordReset(
		context: RepositoryContext,
		resetPassword: CustomerResetPassword | MyCustomerResetPassword,
	) {
		const { newPassword, tokenValue } = resetPassword;

		const customerId = validatePasswordResetToken(tokenValue);
		if (!customerId) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID 'Token(${tokenValue})' was not found.`,
			});
		}

		const customer = this._storage.get(
			context.projectKey,
			"customer",
			customerId,
		) as Writable<Customer> | undefined;

		if (!customer) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID 'Token(${tokenValue})' was not found.`,
			});
		}

		customer.password = hashPassword(newPassword);
		customer.version += 1;

		// Update storage
		this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	emailToken(context: RepositoryContext, id: string): CustomerToken {
		const results = this._storage.query(context.projectKey, this.getTypeId(), {
			where: [`id="${id.toLocaleLowerCase()}"`],
		});
		if (results.count === 0) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID '${id}' was not found.`,
			});
		}
		const expiresAt = new Date(Date.now() + 30 * 60);
		const customer = results.results[0] as Customer;
		const rest = getBaseResourceProperties();

		const token = createEmailVerifyToken(customer);
		return {
			id: rest.id,
			createdAt: rest.createdAt,
			lastModifiedAt: rest.lastModifiedAt,
			customerId: customer.id,
			expiresAt: expiresAt.toISOString(),
			value: token,
			invalidateOlderTokens: false,
		};
	}

	emailTokenConfirm(
		context: RepositoryContext,
		request: { tokenValue: string },
	) {
		const customerId = validateEmailVerifyToken(request.tokenValue);
		if (!customerId) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID 'Token(${request.tokenValue})' was not found.`,
			});
		}

		const customer = this._storage.get(
			context.projectKey,
			"customer",
			customerId,
		) as Writable<Customer> | undefined;

		if (!customer) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID 'Token(${request.tokenValue})' was not found.`,
			});
		}

		customer.isEmailVerified = true;
		customer.version += 1;

		// Update storage
		this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	private storeReferenceToStoreKeyReference(
		draftStores: StoreResourceIdentifier[],
		projectKey: string,
	): StoreKeyReference[] {
		const storeIds = draftStores
			.map((storeReference) => storeReference.id)
			.filter(Boolean);

		let stores: Store[] = [];

		if (storeIds.length > 0) {
			stores = this._storage.query(projectKey, "store", {
				where: storeIds.map((id) => `id="${id}"`),
			}).results;

			if (storeIds.length !== stores.length) {
				throw new CommercetoolsError<ResourceNotFoundError>({
					code: "ResourceNotFound",
					message: `Store with ID '${storeIds.find((id) => !stores.some((store) => store.id === id))}' was not found.`,
				});
			}
		}

		return draftStores.map((storeReference) => ({
			typeId: "store",
			key:
				storeReference.key ??
				(stores.find((store) => store.id === storeReference.id)?.key as string),
		}));
	}
}
