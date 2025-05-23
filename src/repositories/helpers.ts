import type {
	AssociateRoleReference,
	BusinessUnitKeyReference,
	BusinessUnitReference,
	BusinessUnitResourceIdentifier,
	RoundingMode,
} from "@commercetools/platform-sdk";
import type {
	Address,
	Associate,
	AssociateDraft,
	AssociateRoleAssignment,
	AssociateRoleAssignmentDraft,
	AssociateRoleKeyReference,
	AssociateRoleResourceIdentifier,
	BaseAddress,
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
	Store,
	StoreKeyReference,
	StoreReference,
	StoreResourceIdentifier,
	Type,
	_Money,
} from "@commercetools/platform-sdk";
import { Decimal } from "decimal.js/decimal";
import type { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { CommercetoolsError } from "~src/exceptions";
import type { AbstractStorage } from "../storage";
import type { RepositoryContext } from "./abstract";

export const createAddress = (
	base: BaseAddress | undefined,
	projectKey: string,
	storage: AbstractStorage,
): Address | undefined => {
	if (!base) return undefined;

	if (!base?.country) {
		throw new Error("Country is required");
	}

	return {
		...base,
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

export const createCentPrecisionMoney = (value: _Money): CentPrecisionMoney => {
	// Taken from https://docs.adyen.com/development-resources/currency-codes
	let fractionDigits = 2;
	switch (value.currencyCode.toUpperCase()) {
		case "BHD":
		case "IQD":
		case "JOD":
		case "KWD":
		case "LYD":
		case "OMR":
		case "TND":
			fractionDigits = 3;
			break;
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
			fractionDigits = 0;
			break;
		default:
			fractionDigits = 2;
	}

	if ((value as HighPrecisionMoney & HighPrecisionMoneyDraft).preciseAmount) {
		throw new Error("HighPrecisionMoney not supported");
	}

	return {
		type: "centPrecision",
		// centAmont is only optional on HighPrecisionMoney, so this should never
		// fallback to 0
		centAmount: value.centAmount ?? 0,
		currencyCode: value.currencyCode,
		fractionDigits: fractionDigits,
	};
};

export const createTypedMoney = (value: _Money): CentPrecisionMoney => {
	const result = createCentPrecisionMoney(value);
	return result;
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
				// @ts-ignore
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

	const value = getReferenceFromResourceIdentifier<BusinessUnitReference>(
		id,
		projectKey,
		storage,
	);

	if (!value.obj?.key) {
		throw new Error("No business-unit found for reference");
	}

	return {
		typeId: "business-unit",
		key: value.obj?.key,
	};
};
