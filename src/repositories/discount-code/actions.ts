import type {
	CartDiscountReference,
	DiscountCode,
	DiscountCodeChangeCartDiscountsAction,
	DiscountCodeChangeIsActiveAction,
	DiscountCodeSetCartPredicateAction,
	DiscountCodeSetCustomFieldAction,
	DiscountCodeSetCustomTypeAction,
	DiscountCodeSetDescriptionAction,
	DiscountCodeSetMaxApplicationsAction,
	DiscountCodeSetMaxApplicationsPerCustomerAction,
	DiscountCodeSetNameAction,
	DiscountCodeSetValidFromAction,
	DiscountCodeSetValidFromAndUntilAction,
	DiscountCodeSetValidUntilAction,
	DiscountCodeUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "~src/types";
import {
	AbstractUpdateHandler,
	UpdateHandlerInterface,
	type RepositoryContext,
} from "../abstract";
import { createCustomFields } from "../helpers";

export class DiscountCodeUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<DiscountCode, DiscountCodeUpdateAction>>
{
	changeIsActive(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ isActive }: DiscountCodeChangeIsActiveAction,
	) {
		resource.isActive = isActive;
	}

	changeCartDiscounts(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ cartDiscounts }: DiscountCodeChangeCartDiscountsAction,
	) {
		resource.cartDiscounts = cartDiscounts.map(
			(obj): CartDiscountReference => ({
				typeId: "cart-discount",
				id: obj.id!,
			}),
		);
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ description }: DiscountCodeSetDescriptionAction,
	) {
		resource.description = description;
	}

	setCartPredicate(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ cartPredicate }: DiscountCodeSetCartPredicateAction,
	) {
		resource.cartPredicate = cartPredicate;
	}

	setName(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ name }: DiscountCodeSetNameAction,
	) {
		resource.name = name;
	}

	setMaxApplications(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ maxApplications }: DiscountCodeSetMaxApplicationsAction,
	) {
		resource.maxApplications = maxApplications;
	}

	setMaxApplicationsPerCustomer(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{
			maxApplicationsPerCustomer,
		}: DiscountCodeSetMaxApplicationsPerCustomerAction,
	) {
		resource.maxApplicationsPerCustomer = maxApplicationsPerCustomer;
	}

	setValidFrom(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ validFrom }: DiscountCodeSetValidFromAction,
	) {
		resource.validFrom = validFrom;
	}

	setValidUntil(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ validUntil }: DiscountCodeSetValidUntilAction,
	) {
		resource.validUntil = validUntil;
	}

	setValidFromAndUntil(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ validFrom, validUntil }: DiscountCodeSetValidFromAndUntilAction,
	) {
		resource.validFrom = validFrom;
		resource.validUntil = validUntil;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ type, fields }: DiscountCodeSetCustomTypeAction,
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

	setCustomField(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ name, value }: DiscountCodeSetCustomFieldAction,
	) {
		if (!resource.custom) {
			return;
		}
		if (value === null) {
			delete resource.custom.fields[name];
		} else {
			resource.custom.fields[name] = value;
		}
	}
}
