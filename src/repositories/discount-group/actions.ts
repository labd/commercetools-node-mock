import type {
	DiscountGroup,
	DiscountGroupSetDescriptionAction,
	DiscountGroupSetIsActiveAction,
	DiscountGroupSetKeyAction,
	DiscountGroupSetNameAction,
	DiscountGroupSetSortOrderAction,
	DiscountGroupUpdateAction,
} from "@commercetools/platform-sdk";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

export class DiscountGroupUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<DiscountGroup, DiscountGroupUpdateAction>>
{
	setDescription(
		context: RepositoryContext,
		resource: Writable<DiscountGroup>,
		{ description }: DiscountGroupSetDescriptionAction,
	) {
		resource.description = description;
	}

	setIsActive(
		context: RepositoryContext,
		resource: Writable<DiscountGroup>,
		{ isActive }: DiscountGroupSetIsActiveAction,
	) {
		resource.isActive = isActive;
	}

	setKey(
		context: RepositoryContext,
		resource: Writable<DiscountGroup>,
		{ key }: DiscountGroupSetKeyAction,
	) {
		resource.key = key;
	}

	setName(
		context: RepositoryContext,
		resource: Writable<DiscountGroup>,
		{ name }: DiscountGroupSetNameAction,
	) {
		resource.name = name;
	}

	setSortOrder(
		context: RepositoryContext,
		resource: Writable<DiscountGroup>,
		{ sortOrder }: DiscountGroupSetSortOrderAction,
	) {
		resource.sortOrder = sortOrder;
	}
}
