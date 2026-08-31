import type {
	Customer,
	InsufficientScopeError,
	InvalidCurrentPasswordError,
	MyCustomerChangePassword,
	MyCustomerEmailVerify,
	ResourceNotFoundError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import { hashPassword, validateEmailVerifyToken } from "../lib/password.ts";
import type { Writable } from "../types.ts";
import type { RepositoryContext } from "./abstract.ts";
import { CustomerRepository } from "./customer/index.ts";

/**
 * `/me` answers for the customer the token was issued to. Without one there is
 * no answer to give, so the request is refused rather than served with whichever
 * customer happens to be stored first.
 */
const requireCustomerId = (context: RepositoryContext): string => {
	if (!context.customerId) {
		throw new CommercetoolsError<InsufficientScopeError>(
			{
				code: "insufficient_scope",
				message: "This endpoint requires a token issued for a customer.",
			},
			403,
		);
	}
	return context.customerId;
};

export class MyCustomerRepository extends CustomerRepository {
	async changePassword(
		context: RepositoryContext,
		changePassword: MyCustomerChangePassword,
	) {
		const { currentPassword, newPassword } = changePassword;
		const encodedPassword = hashPassword(currentPassword);

		const result = await this._storage.query(context.projectKey, "customer", {
			where: [`password = "${encodedPassword}"`],
		});
		if (result.count === 0) {
			throw new CommercetoolsError<InvalidCurrentPasswordError>({
				code: "InvalidCurrentPassword",
				message: "Account with the given credentials not found.",
			});
		}

		const customer = result.results[0] as Writable<Customer>;
		if (customer.password !== hashPassword(currentPassword)) {
			throw new CommercetoolsError<InvalidCurrentPasswordError>({
				code: "InvalidCurrentPassword",
				message: "The current password is invalid.",
			});
		}

		customer.password = hashPassword(newPassword);
		customer.version += 1;

		// Update storage
		await this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	async confirmEmail(
		context: RepositoryContext,
		resetPassword: MyCustomerEmailVerify,
	) {
		const { tokenValue } = resetPassword;

		const customerId = validateEmailVerifyToken(tokenValue);
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

		customer.isEmailVerified = true;
		customer.version += 1;

		// Update storage
		await this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	async deleteMe(context: RepositoryContext): Promise<Customer | undefined> {
		const customerId = requireCustomerId(context);
		const deleted = await this.delete(context, customerId);
		return deleted as Customer | undefined;
	}

	async getMe(context: RepositoryContext): Promise<Customer | undefined> {
		const customerId = requireCustomerId(context);
		return (await this._storage.get(
			context.projectKey,
			"customer",
			customerId,
		)) as Customer | undefined;
	}
}
