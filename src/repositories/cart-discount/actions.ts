import type {
	CartDiscount,
	CartDiscountChangeIsActiveAction,
	CartDiscountChangeSortOrderAction,
	CartDiscountChangeTargetAction,
	CartDiscountSetCustomFieldAction,
	CartDiscountSetCustomTypeAction,
	CartDiscountSetDescriptionAction,
	CartDiscountSetKeyAction,
	CartDiscountSetStoresAction,
	CartDiscountSetValidFromAction,
	CartDiscountSetValidFromAndUntilAction,
	CartDiscountSetValidUntilAction,
	CartDiscountUpdateAction,
} from "@commercetools/platform-sdk";
import { getStoreKeyReference } from "#src/repositories/helpers.ts";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

export class CartDiscountUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<CartDiscount, CartDiscountUpdateAction>>
{
	changeIsActive(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ isActive }: CartDiscountChangeIsActiveAction,
	) {
		resource.isActive = isActive;
	}

	changeSortOrder(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ sortOrder }: CartDiscountChangeSortOrderAction,
	) {
		resource.sortOrder = sortOrder;
	}

	changeTarget(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ target }: CartDiscountChangeTargetAction,
	) {
		resource.target = target;
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ name, value }: CartDiscountSetCustomFieldAction,
	) {
		this._setCustomFieldValues(resource, { name, value });
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ type, fields }: CartDiscountSetCustomTypeAction,
	) {
		this._setCustomType(context, resource, { type, fields });
	}

	setDescription(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ description }: CartDiscountSetDescriptionAction,
	) {
		resource.description = description;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ key }: CartDiscountSetKeyAction,
	) {
		resource.key = key;
	}

	setStores(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ stores }: CartDiscountSetStoresAction,
	) {
		resource.stores = stores?.map((s) =>
			getStoreKeyReference(s, context.projectKey, this._storage),
		);
	}

	setValidFrom(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ validFrom }: CartDiscountSetValidFromAction,
	) {
		resource.validFrom = validFrom;
	}

	setValidFromAndUntil(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ validFrom, validUntil }: CartDiscountSetValidFromAndUntilAction,
	) {
		resource.validFrom = validFrom;
		resource.validUntil = validUntil;
	}

	setValidUntil(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ validUntil }: CartDiscountSetValidUntilAction,
	) {
		resource.validUntil = validUntil;
	}
}
