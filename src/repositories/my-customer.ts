import {
	Customer,
	InvalidCurrentPasswordError,
	MyCustomerChangePassword,
	MyCustomerEmailVerify,
	ResourceNotFoundError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "~src/exceptions";
import { hashPassword, validateEmailVerifyToken } from "../lib/password";
import { Writable } from "../types";
import { type RepositoryContext } from "./abstract";
import { CustomerRepository } from "./customer";

export class MyCustomerRepository extends CustomerRepository {
	changePassword(
		context: RepositoryContext,
		changePassword: MyCustomerChangePassword,
	) {
		const { currentPassword, newPassword } = changePassword;
		const encodedPassword = hashPassword(currentPassword);

		const result = this._storage.query(context.projectKey, "customer", {
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
		this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	confirmEmail(
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

		customer.isEmailVerified = true;
		customer.version += 1;

		// Update storage
		this._storage.add(context.projectKey, "customer", customer);
		return customer;
	}

	deleteMe(context: RepositoryContext): Customer | undefined {
		// grab the first customer you can find for now. In the future we should
		// use the customer id from the scope of the token
		const results = this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{},
		);

		if (results.count > 0) {
			return this.delete(context, results.results[0].id) as Customer;
		}

		return;
	}

	getMe(context: RepositoryContext): Customer | undefined {
		// grab the first customer you can find for now. In the future we should
		// use the customer id from the scope of the token
		const results = this._storage.query(
			context.projectKey,
			this.getTypeId(),
			{},
		);

		if (results.count > 0) {
			return results.results[0] as Customer;
		}

		return;
	}
}
