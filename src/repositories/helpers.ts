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
	InvalidInputError,
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
import type { FastifyRequest } from "fastify";
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
		throw new CommercetoolsError<InvalidJsonInputError>(
			{
				code: "InvalidJsonInput",
				message: "Country is required",
				detailedErrorMessage: "Country is required",
			},
			400,
		);
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

export const createCustomFields = async (
	draft: CustomFieldsDraft | undefined,
	projectKey: string,
	storage: AbstractStorage,
): Promise<CustomFields | undefined> => {
	if (!draft) return undefined;
	if (!draft.type) return undefined;
	if (!draft.type.typeId) return undefined;
	const typeResource = (await storage.getByResourceIdentifier(
		projectKey,
		draft.type,
	)) as Type;

	if (!typeResource) {
		throw new CommercetoolsError<ReferencedResourceNotFoundError>(
			{
				code: "ReferencedResourceNotFound",
				typeId: draft.type.typeId,
				message: `No type '${draft.type.typeId}' with id=${draft.type.id} or key=${draft.type.key}`,
			},
			400,
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
			throw new CommercetoolsError<InvalidInputError>(
				{
					code: "InvalidInput",
					message: `Unknown rounding mode: ${roundingMode}`,
				},
				400,
			);
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
		throw new CommercetoolsError<InvalidJsonInputError>(
			{
				code: "InvalidJsonInput",
				message: "HighPrecisionMoney requires preciseAmount",
				detailedErrorMessage: "HighPrecisionMoney requires preciseAmount",
			},
			400,
		);
	}

	if (value.fractionDigits === undefined) {
		throw new CommercetoolsError<InvalidJsonInputError>(
			{
				code: "InvalidJsonInput",
				message: "HighPrecisionMoney requires fractionDigits",
				detailedErrorMessage: "HighPrecisionMoney requires fractionDigits",
			},
			400,
		);
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

export const resolveStoreReference = async (
	ref: StoreResourceIdentifier | undefined,
	projectKey: string,
	storage: AbstractStorage,
): Promise<StoreKeyReference | undefined> => {
	if (!ref) return undefined;
	const resource = await storage.getByResourceIdentifier(projectKey, ref);
	if (!resource) {
		throw new CommercetoolsError<ReferencedResourceNotFoundError>(
			{
				code: "ReferencedResourceNotFound",
				typeId: "store",
				message: "The referenced object of type 'store' was not found.",
			},
			400,
		);
	}

	const store = resource as Store;
	return {
		typeId: "store",
		key: store.key,
	};
};

export const getReferenceFromResourceIdentifier = async <T extends Reference>(
	resourceIdentifier: ResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): Promise<T> => {
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

	const resource = await storage.getByResourceIdentifier(
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

export const getStoreKeyReference = async (
	id: StoreResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): Promise<StoreKeyReference> => {
	if (id.key) {
		return {
			typeId: "store",
			key: id.key,
		};
	}
	const value = await getReferenceFromResourceIdentifier<StoreReference>(
		id,
		projectKey,
		storage,
	);

	if (!value.obj?.key) {
		throw new CommercetoolsError<ReferencedResourceNotFoundError>(
			{
				code: "ReferencedResourceNotFound",
				typeId: "store",
				message: "The referenced object of type 'store' was not found.",
			},
			400,
		);
	}
	return {
		typeId: "store",
		key: value.obj?.key,
	};
};

export const getRepositoryContext = (
	request: FastifyRequest<{ Params: Record<string, string> }>,
): RepositoryContext => ({
	projectKey: request.params.projectKey,
	storeKey: request.params.storeKey,
	clientId: request.credentials?.clientId,
});

export const createAssociate = async (
	a: AssociateDraft,
	projectKey: string,
	storage: AbstractStorage,
): Promise<Associate | undefined> => {
	if (!a) return undefined;

	if (!a.associateRoleAssignments) {
		throw new CommercetoolsError<InvalidJsonInputError>(
			{
				code: "InvalidJsonInput",
				message: "AssociateRoleAssignments is required",
				detailedErrorMessage: "AssociateRoleAssignments is required",
			},
			400,
		);
	}

	const associateRoleAssignments = await Promise.all(
		a.associateRoleAssignments.map(
			async (
				a: AssociateRoleAssignmentDraft,
			): Promise<AssociateRoleAssignment> => ({
				associateRole: await getAssociateRoleKeyReference(
					a.associateRole,
					projectKey,
					storage,
				),
				inheritance: a.inheritance as string,
			}),
		),
	);

	return {
		customer: await getReferenceFromResourceIdentifier(
			a.customer,
			projectKey,
			storage,
		),
		associateRoleAssignments,
	};
};

export const getAssociateRoleKeyReference = async (
	id: AssociateRoleResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): Promise<AssociateRoleKeyReference> => {
	if (id.key) {
		return {
			typeId: "associate-role",
			key: id.key,
		};
	}

	const value =
		await getReferenceFromResourceIdentifier<AssociateRoleReference>(
			id,
			projectKey,
			storage,
		);

	if (!value.obj?.key) {
		throw new CommercetoolsError<ReferencedResourceNotFoundError>(
			{
				code: "ReferencedResourceNotFound",
				typeId: "associate-role",
				message:
					"The referenced object of type 'associate-role' was not found.",
			},
			400,
		);
	}

	return {
		typeId: "associate-role",
		key: value.obj?.key,
	};
};

export const getBusinessUnitKeyReference = async (
	id: BusinessUnitResourceIdentifier,
	projectKey: string,
	storage: AbstractStorage,
): Promise<BusinessUnitKeyReference> => {
	if (id.key) {
		return {
			typeId: "business-unit",
			key: id.key,
		};
	}

	const resource = await storage.getByResourceIdentifier<"business-unit">(
		projectKey,
		id,
	);

	if (!resource?.key) {
		throw new CommercetoolsError<ReferencedResourceNotFoundError>(
			{
				code: "ReferencedResourceNotFound",
				typeId: "business-unit",
				message: "The referenced object of type 'business-unit' was not found.",
			},
			400,
		);
	}

	return {
		typeId: "business-unit",
		key: resource.key,
	};
};
