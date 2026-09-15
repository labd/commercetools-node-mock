import type {
	Address,
	Customer,
	CustomerCreatePasswordResetToken,
	CustomerDraft,
	CustomerResetPassword,
	CustomerToken,
	InvalidInputError,
	MyCustomerResetPassword,
	RequiredFieldError,
	ResourceNotFoundError,
	StoreKeyReference,
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
import { CustomerDraftSchema } from "#src/schemas/generated/customer.ts";
import type { ResourceMap, ShallowWritable, Writable } from "#src/types.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import {
	createAddress,
	createCustomFields,
	getStoreByPathKey,
	getStoreKeyReferences,
} from "../helpers.ts";
import { CustomerUpdateHandler } from "./actions.ts";
import { checkEmailUniqueness } from "./helpers.ts";

export class CustomerRepository extends AbstractResourceRepository<"customer"> {
	constructor(config: Config) {
		super("customer", config);
		this.actions = new CustomerUpdateHandler(config.storage);
		this.draftSchema = CustomerDraftSchema;
	}

	async create(
		context: RepositoryContext,
		draft: CustomerDraft,
	): Promise<Customer> {
		const storesForCustomer = await this.getStores(context, draft);

		// Email uniqueness is scoped to the stores the customer is assigned to
		await checkEmailUniqueness(
			this._storage,
			context.projectKey,
			draft.email,
			storesForCustomer.map((store) => store.key),
		);

		const addresses = await Promise.all(
			draft.addresses?.map((address) =>
				createAddress(
					{ ...address, id: generateRandomString(5) },
					context.projectKey,
					this._storage,
				),
			) ?? [],
		);

		const lookupAdressId = (
			addresses: Address[],
			addressId: number,
		): string => {
			if (addressId < addresses.length) {
				const id = addresses[addressId].id;
				if (!id) {
					throw new CommercetoolsError<RequiredFieldError>(
						{
							code: "RequiredField",
							message: "Address ID is missing",
							field: "addressId",
						},
						400,
					);
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

		const resource: Customer = {
			...getBaseResourceProperties(context.clientId),
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
			custom: await createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			stores: storesForCustomer,
			customerGroupAssignments: [],
		} satisfies unknown as Customer;

		return await this.saveNew(context, resource);
	}

	async saveUpdate(
		context: RepositoryContext,
		version: number,
		resource: ShallowWritable<ResourceMap["customer"]>,
	): Promise<ShallowWritable<ResourceMap["customer"]>> {
		// Also update lowercaseEmail attribute
		const updatedResource: Customer = {
			...resource,
			lowercaseEmail: resource.email.toLowerCase(),
		} satisfies unknown as Customer;

		return await super.saveUpdate(context, version, updatedResource);
	}

	async passwordResetToken(
		context: RepositoryContext,
		request: CustomerCreatePasswordResetToken,
	): Promise<CustomerToken> {
		const results = await this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{
				where: [`email="${request.email.toLocaleLowerCase()}"`],
			},
		);
		if (results.count === 0) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID '${request.email}' was not found.`,
			});
		}

		const ttlMinutes = request.ttlMinutes ?? 34560; // 34560 is CT default

		const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
		const customer = results.results[0] as Customer;
		const rest = getBaseResourceProperties(context.clientId);

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

	async passwordReset(
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

		const customer = (await this._storage.get(
			context.projectKey,
			"customer",
			customerId,
		)) as Writable<Customer> | undefined;

		if (!customer) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID 'Token(${tokenValue})' was not found.`,
			});
		}

		customer.password = hashPassword(newPassword);
		customer.version += 1;

		// Update storage
		await this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	async emailToken(
		context: RepositoryContext,
		id: string,
	): Promise<CustomerToken> {
		const results = await this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{
				where: [`id="${id.toLocaleLowerCase()}"`],
			},
		);
		if (results.count === 0) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID '${id}' was not found.`,
			});
		}
		const expiresAt = new Date(Date.now() + 30 * 60);
		const customer = results.results[0] as Customer;
		const rest = getBaseResourceProperties(context.clientId);

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

	async emailTokenConfirm(
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

		const customer = (await this._storage.get(
			context.projectKey,
			"customer",
			customerId,
		)) as Writable<Customer> | undefined;

		if (!customer) {
			throw new CommercetoolsError<ResourceNotFoundError>({
				code: "ResourceNotFound",
				message: `The Customer with ID 'Token(${request.tokenValue})' was not found.`,
			});
		}

		customer.isEmailVerified = true;
		customer.version += 1;

		// Update storage
		await this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	/**
	 * Resolve the stores the customer will be assigned to. When the customer is
	 * created through an in-store endpoint that store is always part of the
	 * assignment.
	 */
	private async getStores(
		context: RepositoryContext,
		draft: CustomerDraft,
	): Promise<StoreKeyReference[]> {
		const references = await getStoreKeyReferences(
			draft.stores ?? [],
			context.projectKey,
			this._storage,
		);

		if (context.storeKey) {
			// An unknown store in the path is a 404, not a bad reference in the draft
			const store = await getStoreByPathKey(
				context.storeKey,
				context.projectKey,
				this._storage,
			);
			if (!references.some((r) => r.key === store.key)) {
				references.push({ typeId: "store", key: store.key });
			}
		}

		return references;
	}
}
