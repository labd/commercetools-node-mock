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
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import type { Writable } from "~src/types";
import type { UpdateHandlerInterface } from "../abstract";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract";

import { CommercetoolsError } from "~src/exceptions";
import { getStoreKeyReference } from "~src/repositories/helpers";

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
		if (!resource.custom) {
			return;
		}
		if (value === null) {
			if (name in resource.custom.fields) {
				delete resource.custom.fields[name];
			} else {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message:
							"Cannot remove custom field " +
							name +
							" because it does not exist.",
					},
					400,
				);
			}
		} else {
			resource.custom.fields[name] = value;
		}
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<CartDiscount>,
		{ type, fields }: CartDiscountSetCustomTypeAction,
	) {
		if (!type) {
			resource.custom = undefined;
		} else {
			const resolvedType = this._storage.getByResourceIdentifier(
				context.projectKey,
				type,
			);
			if (!resolvedType) {
				throw new Error(`Type ${type} not found`);
			}

			resource.custom = {
				type: {
					typeId: "type",
					id: resolvedType.id,
				},
				fields: fields || {},
			};
		}
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
