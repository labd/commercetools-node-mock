import type {
	Customer,
	DuplicateFieldError,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { AbstractStorage } from "#src/storage/index.ts";

/**
 * Customer email uniqueness is scoped to the Stores the Customer is assigned
 * to. Customers assigned to one or more Stores only conflict when they share
 * at least one Store, while Customers without any Store share a single global
 * scope.
 *
 * See https://docs.commercetools.com/api/projects/customers#customer-uniqueness
 */
export const checkEmailUniqueness = async (
	storage: AbstractStorage,
	projectKey: string,
	email: string,
	storeKeys: string[],
	excludeCustomerId?: string,
): Promise<void> => {
	const results = await storage.query(projectKey, "customer", {
		where: [`lowercaseEmail="${email.toLowerCase()}"`],
	});

	const conflicts = (results.results as Customer[]).some((customer) => {
		if (excludeCustomerId !== undefined && customer.id === excludeCustomerId) {
			return false;
		}

		const customerStoreKeys = customer.stores?.map((store) => store.key) ?? [];

		// Global customers (without stores) only conflict with other global
		// customers.
		if (storeKeys.length === 0 || customerStoreKeys.length === 0) {
			return storeKeys.length === 0 && customerStoreKeys.length === 0;
		}

		return customerStoreKeys.some((key) => storeKeys.includes(key));
	});

	if (!conflicts) {
		return;
	}

	throw new CommercetoolsError<any>({
		code: "CustomerAlreadyExists",
		statusCode: 400,
		message: "There is already an existing customer with the provided email.",
		errors: [
			{
				code: "DuplicateField",
				message: `Customer with email '${email}' already exists.`,
				duplicateValue: email,
				field: "email",
			} as DuplicateFieldError,
		],
	});
};
