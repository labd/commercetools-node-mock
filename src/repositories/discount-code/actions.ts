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
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

export class DiscountCodeUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<DiscountCode, DiscountCodeUpdateAction>>
{
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

	changeIsActive(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ isActive }: DiscountCodeChangeIsActiveAction,
	) {
		resource.isActive = isActive;
	}

	setCartPredicate(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ cartPredicate }: DiscountCodeSetCartPredicateAction,
	) {
		resource.cartPredicate = cartPredicate;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ name, value }: DiscountCodeSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ type, fields }: DiscountCodeSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ description }: DiscountCodeSetDescriptionAction,
	) {
		resource.description = description;
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

	setName(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ name }: DiscountCodeSetNameAction,
	) {
		resource.name = name;
	}

	setValidFrom(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ validFrom }: DiscountCodeSetValidFromAction,
	) {
		resource.validFrom = validFrom;
	}

	setValidFromAndUntil(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ validFrom, validUntil }: DiscountCodeSetValidFromAndUntilAction,
	) {
		resource.validFrom = validFrom;
		resource.validUntil = validUntil;
	}

	setValidUntil(
		context: RepositoryContext,
		resource: Writable<DiscountCode>,
		{ validUntil }: DiscountCodeSetValidUntilAction,
	) {
		resource.validUntil = validUntil;
	}
}
