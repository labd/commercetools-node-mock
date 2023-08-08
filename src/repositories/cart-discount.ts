import type {
	CartDiscount,
	CartDiscountChangeIsActiveAction,
	CartDiscountChangeSortOrderAction, CartDiscountChangeTargetAction,
	CartDiscountDraft,
	CartDiscountSetDescriptionAction,
	CartDiscountSetKeyAction,
	CartDiscountSetValidFromAction,
	CartDiscountSetValidFromAndUntilAction,
	CartDiscountSetValidUntilAction,
	CartDiscountUpdateAction,
	CartDiscountValueAbsolute,
	CartDiscountValueDraft,
	CartDiscountValueFixed,
	CartDiscountValueGiftLineItem,
	CartDiscountValueRelative,
} from '@commercetools/platform-sdk'
import {getBaseResourceProperties} from '../helpers.js'
import type {Writable} from '../types.js'
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from './abstract.js'
import {createTypedMoney, getStoreKeyReference} from './helpers.js'

export class CartDiscountRepository extends AbstractResourceRepository<'cart-discount'> {
	getTypeId() {
		return 'cart-discount' as const
	}

	create(context: RepositoryContext, draft: CartDiscountDraft): CartDiscount {
		const resource: CartDiscount = {
			...getBaseResourceProperties(),
			key: draft.key,
			description: draft.description,
			cartPredicate: draft.cartPredicate,
			isActive: draft.isActive || false,
			name: draft.name,
			stores:
				draft.stores?.map((s) =>
					getStoreKeyReference(s, context.projectKey, this._storage)
				) ?? [],
			references: [],
			target: draft.target,
			requiresDiscountCode: draft.requiresDiscountCode || false,
			sortOrder: draft.sortOrder,
			stackingMode: draft.stackingMode || 'Stacking',
			validFrom: draft.validFrom,
			validUntil: draft.validUntil,
			value: this.transformValueDraft(draft.value),
		}
		this.saveNew(context, resource)
		return resource
	}

	private transformValueDraft(value: CartDiscountValueDraft) {
		switch (value.type) {
			case 'absolute': {
				return {
					type: 'absolute',
					money: value.money.map(createTypedMoney),
				} as CartDiscountValueAbsolute
			}
			case 'fixed': {
				return {
					type: 'fixed',
					money: value.money.map(createTypedMoney),
				} as CartDiscountValueFixed
			}
			case 'giftLineItem': {
				return {
					...value,
				} as CartDiscountValueGiftLineItem
			}
			case 'relative': {
				return {
					...value,
				} as CartDiscountValueRelative
			}
		}

		return value
	}

	actions: Partial<
		Record<
			CartDiscountUpdateAction['action'],
			(
				context: RepositoryContext,
				resource: Writable<CartDiscount>,
				action: any
			) => void
		>
	> = {
		setKey: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{key}: CartDiscountSetKeyAction
		) => {
			resource.key = key
		},
		setDescription: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{description}: CartDiscountSetDescriptionAction
		) => {
			resource.description = description
		},
		setValidFrom: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{validFrom}: CartDiscountSetValidFromAction
		) => {
			resource.validFrom = validFrom
		},
		setValidUntil: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{validUntil}: CartDiscountSetValidUntilAction
		) => {
			resource.validUntil = validUntil
		},
		setValidFromAndUntil: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{validFrom, validUntil}: CartDiscountSetValidFromAndUntilAction
		) => {
			resource.validFrom = validFrom
			resource.validUntil = validUntil
		},
		changeSortOrder: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{sortOrder}: CartDiscountChangeSortOrderAction
		) => {
			resource.sortOrder = sortOrder
		},
		changeIsActive: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{isActive}: CartDiscountChangeIsActiveAction
		) => {
			resource.isActive = isActive
		},
		changeTarget: (
			context: RepositoryContext,
			resource: Writable<CartDiscount>,
			{target}: CartDiscountChangeTargetAction
		) => {
			resource.target = target
		},
	}
}
