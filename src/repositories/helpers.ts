import type {
	_Money,
	Address,
	Associate,
	AssociateDraft,
	AssociateRoleAssignment,
	AssociateRoleAssignmentDraft,
	AssociateRoleKeyReference,
	AssociateRoleReference,
	AssociateRoleResourceIdentifier,
	BaseAddress,
	BusinessUnitKeyReference,
	BusinessUnitResourceIdentifier,
	CentPrecisionMoney,
	CustomFields,
	CustomFieldsDraft,
	HighPrecisionMoney,
	HighPrecisionMoneyDraft,
	InvalidJsonInputError,
	Price,
	PriceDraft,
	Reference,
	ReferencedResourceNotFoundError,
	ResourceIdentifier,
	RoundingMode,
	Store,
	StoreKeyReference,
	StoreReference,
	StoreResourceIdentifier,
	Type,
	TypedMoney,
} from "@commercetools/platform-sdk";
import { Decimal } from "decimal.js/decimal";
import type { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { AbstractStorage } from "../storage/index.ts";
import type { RepositoryContext } from "./abstract.ts";

export const createAddress = (
	base: BaseAddress | undefined,
	projectKey: string,
	storage: AbstractStorage,
): Address | undefined => {
	if (!base) return undefined;

	if (!base?.country) {
		throw new Error("Country is required");
	}

	// Generate a random 8-character alphanumeric string
	// which is what addresses use instead of uuid
	const generateRandomId = (): string =>
		Math.random().toString(36).substring(2, 10).padEnd(8, "0");
	return {
		...base,
		id: base.id ?? generateRandomId(),
	};
};

export const createCustomFields = (
	draft: CustomFieldsDraft | undefined,
	projectKey: string,
	storage: AbstractStorage,
): CustomFields | undefined => {
	if (!draft) return undefined;
	if (!draft.type) return undefined;
	if (!draft.type.typeId) return undefined;
	const typeResource = storage.getByResourceIdentifier(
		projectKey,
		draft.type,
	) as Type;

	if (!typeResource) {
		throw new Error(
			`No type '${draft.type.typeId}' with id=${draft.type.id} or key=${draft.type.key}`,
		);
	}

	return {
		type: {
			typeId: draft.type.typeId,
			id: typeResource.id,
		},
		fields: draft.fields ?? {},
	};
};

export const createPrice = (draft: PriceDraft): Price => ({
	id: uuidv4(),
	value: createTypedMoney(draft.value),
});

/**
 * Rounds a decimal to the nearest whole number using the specified
 * (Commercetools) rounding mode.
 *
 * @see https://docs.commercetools.com/api/projects/carts#roundingmode
 */
export const roundDecimal = (decimal: Decimal, roundingMode: RoundingMode) => {
	switch (roundingMode) {
		case "HalfEven":
			return decimal.toDecimalPlaces(0, Decimal.ROUND_HALF_EVEN);
		case "HalfUp":
			return decimal.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
		case "HalfDown":
			return decimal.toDecimalPlaces(0, Decimal.ROUND_HALF_DOWN);
		default:
			throw new Error(`Unknown rounding mode: ${roundingMode}`);
	}
};

export const getCurrencyFractionDigits = (currencyCode: string): number => {
	// Taken from https://docs.adyen.com/development-resources/currency-codes
	switch (currencyCode.toUpperCase()) {
		case "BHD":
		case "IQD":
		case "JOD":
		case "KWD":
		case "LYD":
		case "OMR":
		case "TND":
			return 3;
		case "CVE":
		case "DJF":
		case "GNF":
		case "IDR":
		case "JPY":
		case "KMF":
		case "KRW":
		case "PYG":
		case "RWF":
		case "UGX":
		case "VND":
		case "VUV":
		case "XAF":
		case "XOF":
		case "XPF":
			return 0;
		default:
			return 2;
	}
};

export const calculateCentAmountFromPreciseAmount = (
	preciseAmount: number,
	fractionDigits: number,
	currencyCode: string,
	roundingMode: RoundingMode = "HalfEven",
): number => {
	const centFractionDigits = getCurrencyFractionDigits(currencyCode);
	const diff = fractionDigits - centFractionDigits;
	const scale = new Decimal(10).pow(Math.abs(diff));
	const decimal =
		diff >= 0
			? new Decimal(preciseAmount).div(scale)
			: new Decimal(preciseAmount).mul(scale);

	return roundDecimal(decimal, roundingMode).toNumber();
};

export const createCentPrecisionMoney = (value: _Money): CentPrecisionMoney => {
	const fractionDigits = getCurrencyFractionDigits(value.currencyCode);
	const preciseValue = value as HighPrecisionMoney & HighPrecisionMoneyDraft;
	let centAmount: number;

	centAmount = value.centAmount ?? 0;

	if (
		preciseValue.preciseAmount !== undefined &&
		preciseValue.fractionDigits !== undefined
	) {
		centAmount = calculateCentAmountFromPreciseAmount(
			preciseValue.preciseAmount,
			preciseValue.fractionDigits,
			value.currencyCode,
			"HalfEven",
		);
	}

	return {
		type: "centPrecision",
		centAmount,
		currencyCode: value.currencyCode,
		fractionDigits,
	};
};

export const createHighPrecisionMoney = (
	value: HighPrecisionMoney | HighPrecisionMoneyDraft,
): HighPrecisionMoney => {
	if (value.preciseAmount === undefined) {
		throw new Error("HighPrecisionMoney requires preciseAmount");
	}

	if (value.fractionDigits === undefined) {
		throw new Error("HighPrecisionMoney requires fractionDigits");
	}

	const centAmount =
		value.centAmount ??
		calculateCentAmountFromPreciseAmount(
			value.preciseAmount,
			value.fractionDigits,
			value.currencyCode,
			"HalfEven",
		);

	return {
		type: "highPrecision",
		centAmount,
		currencyCode: value.currencyCode,
		fractionDigits: value.fractionDigits,
		preciseAmount: value.preciseAmount,
	};
};

export const createTypedMoney = (value: _Money): TypedMoney => {
	const preciseValue = value as HighPrecisionMoney & HighPrecisionMoneyDraft;
	if (
		("type" in value && value.type === "highPrecision") ||
		preciseValue.preciseAmount !== undefined
	) {
		return createHighPrecisionMoney(
			value as HighPrecisionMoney | HighPrecisionMoneyDraft,
		);
	}

	return createCentPrecisionMoney(value);
};

export const calculateMoneyTotalCentAmount = (
	money: _Money,
	quantity: number,
	roundingMode: RoundingMode = "HalfEven",
): number => {
	const preciseValue = money as HighPrecisionMoney & HighPrecisionMoneyDraft;

	if (
		preciseValue.preciseAmount === undefined ||
		preciseValue.fractionDigits === undefined
	) {
		return (money.centAmount ?? 0) * quantity;
	}

	const totalPrecise = new Decimal(preciseValue.preciseAmount).mul(quantity);
	return calculateCentAmountFromPreciseAmount(
		totalPrecise.toNumber(),
		preciseValue.fractionDigits,
		money.currencyCode,
		roundingMode,
	);
};

export const resolveStoreReference = (
	ref: StoreResourceIdentifier | undefined,
	projectKey: string,
	storage: AbstractStorage,
): StoreKeyReference | undefined => {
	if (!ref) return undefined;
	const resource = storage.getByResourceIdentifier(projectKey, ref);
	if (!resource) {
		throw new Error("No such store");
	}

	const store = resource as Store;
	return {
		typeId: "store",
		key: store.key,
	};
};

export const getReferenceFromResourceIdentifier = <T extends Reference>(
	resourceIdentifier: ResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): T => {
	if (!resourceIdentifier.id && !resourceIdentifier.key) {
		throw new CommercetoolsError<InvalidJsonInputError>(
			{
				code: "InvalidJsonInput",
				message: `${resourceIdentifier.typeId}: ResourceIdentifier requires an 'id' xor a 'key'`,
				detailedErrorMessage: `ResourceIdentifier requires an 'id' xor a 'key'`,
			},
			400,
		);
	}

	const resource = storage.getByResourceIdentifier(
		projectKey,
		resourceIdentifier,
	);
	if (!resource) {
		const errIdentifier = resourceIdentifier.key
			? `key '${resourceIdentifier.key}'`
			: `identifier '${resourceIdentifier.id}'`;

		throw new CommercetoolsError<ReferencedResourceNotFoundError>(
			{
				code: "ReferencedResourceNotFound",
				typeId: resourceIdentifier.typeId,
				message: `The referenced object of type '${resourceIdentifier.typeId}' with '${errIdentifier}' was not found. It either doesn't exist, or it can't be accessed from this endpoint (e.g., if the endpoint filters by store or customer account).`,
			},
			400,
		);
	}

	return {
		typeId: resourceIdentifier.typeId,
		id: resource?.id,
	} as unknown as T;
};

export const getStoreKeyReference = (
	id: StoreResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): StoreKeyReference => {
	if (id.key) {
		return {
			typeId: "store",
			key: id.key,
		};
	}
	const value = getReferenceFromResourceIdentifier<StoreReference>(
		id,
		projectKey,
		storage,
	);

	if (!value.obj?.key) {
		throw new Error("No store found for reference");
	}
	return {
		typeId: "store",
		key: value.obj?.key,
	};
};

export const getRepositoryContext = (request: Request): RepositoryContext => ({
	projectKey: request.params.projectKey,
	storeKey: request.params.storeKey,
});

export const createAssociate = (
	a: AssociateDraft,
	projectKey: string,
	storage: AbstractStorage,
): Associate | undefined => {
	if (!a) return undefined;

	if (!a.associateRoleAssignments) {
		throw new Error("AssociateRoleAssignments is required");
	}

	return {
		customer: getReferenceFromResourceIdentifier(
			a.customer,
			projectKey,
			storage,
		),
		associateRoleAssignments: a.associateRoleAssignments?.map(
			(a: AssociateRoleAssignmentDraft): AssociateRoleAssignment => ({
				associateRole: getAssociateRoleKeyReference(
					a.associateRole,
					projectKey,
					storage,
				),
				inheritance: a.inheritance as string,
			}),
		),
	};
};

export const getAssociateRoleKeyReference = (
	id: AssociateRoleResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): AssociateRoleKeyReference => {
	if (id.key) {
		return {
			typeId: "associate-role",
			key: id.key,
		};
	}

	const value = getReferenceFromResourceIdentifier<AssociateRoleReference>(
		id,
		projectKey,
		storage,
	);

	if (!value.obj?.key) {
		throw new Error("No associate-role found for reference");
	}

	return {
		typeId: "associate-role",
		key: value.obj?.key,
	};
};

export const getBusinessUnitKeyReference = (
	id: BusinessUnitResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): BusinessUnitKeyReference => {
	if (id.key) {
		return {
			typeId: "business-unit",
			key: id.key,
		};
	}

	const resource = storage.getByResourceIdentifier<"business-unit">(
		projectKey,
		id,
	);

	if (!resource?.key) {
		throw new Error("No business-unit found for reference");
	}

	return {
		typeId: "business-unit",
		key: resource.key,
	};
};
