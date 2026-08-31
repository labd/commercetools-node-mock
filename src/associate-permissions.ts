/**
 * Permission checking for the associate-scoped (`as-associate`) endpoints.
 *
 * commercetools decides what an associate may see and do from the permissions
 * on the AssociateRoles assigned to them in the business unit named in the
 * path. Every permission is split into a `My` and an `Others` variant:
 *
 * - `My` means the resource belongs to the acting associate: its customer is
 *   the associate in the path.
 * - `Others` means the resource belongs to a different customer within the
 *   same business unit.
 *
 * The checks fail closed. An associate that cannot be resolved, or that lacks
 * the permission for what the request is asking, is refused — rather than
 * silently granted, which would turn an authorisation test into one that
 * passes without asserting anything.
 *
 * @see https://docs.commercetools.com/api/projects/associate-roles#permission
 */
import type {
	AssociateMissingPermissionError,
	BusinessUnit,
	Permission,
	ResourceNotFoundError,
	UpdateAction,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { RepositoryContext } from "#src/repositories/abstract.ts";
import type { AbstractStorage } from "#src/storage/index.ts";

export type AssociateScope = "my" | "others";

/** A permission pair: the `My` variant first, the `Others` variant second. */
export type PermissionPair = readonly [Permission, Permission];

export const permissionFor = (
	pair: PermissionPair,
	scope: AssociateScope,
): Permission => (scope === "my" ? pair[0] : pair[1]);

// ---------------------------------------------------------------------------
// The permission table
// ---------------------------------------------------------------------------

export const CART_PERMISSIONS = {
	view: ["ViewMyCarts", "ViewOthersCarts"],
	create: ["CreateMyCarts", "CreateOthersCarts"],
	update: ["UpdateMyCarts", "UpdateOthersCarts"],
	delete: ["DeleteMyCarts", "DeleteOthersCarts"],
} as const;

export const ORDER_PERMISSIONS = {
	view: ["ViewMyOrders", "ViewOthersOrders"],
	create: ["CreateMyOrdersFromMyCarts", "CreateOrdersFromOthersCarts"],
	update: ["UpdateMyOrders", "UpdateOthersOrders"],
} as const;

/** Creating an order from a quote is a different permission than from a cart. */
export const ORDER_FROM_QUOTE_PERMISSIONS = [
	"CreateMyOrdersFromMyQuotes",
	"CreateOrdersFromOthersQuotes",
] as const;

export const QUOTE_PERMISSIONS = {
	view: ["ViewMyQuotes", "ViewOthersQuotes"],
} as const;

/**
 * Quotes have no blanket update permission: what an associate may do depends on
 * the action. An action that is not listed here needs the view permission only,
 * since it does not move the quote through the negotiation.
 */
export const QUOTE_ACTION_PERMISSIONS: Record<string, PermissionPair> = {
	"changeQuoteState:Accepted": ["AcceptMyQuotes", "AcceptOthersQuotes"],
	"changeQuoteState:Declined": ["DeclineMyQuotes", "DeclineOthersQuotes"],
	requestQuoteRenegotiation: ["RenegotiateMyQuotes", "RenegotiateOthersQuotes"],
	changeCustomer: ["ReassignMyQuotes", "ReassignOthersQuotes"],
};

export const QUOTE_REQUEST_PERMISSIONS = {
	view: ["ViewMyQuoteRequests", "ViewOthersQuoteRequests"],
	create: [
		"CreateMyQuoteRequestsFromMyCarts",
		"CreateQuoteRequestsFromOthersCarts",
	],
	update: ["UpdateMyQuoteRequests", "UpdateOthersQuoteRequests"],
} as const;

export const SHOPPING_LIST_PERMISSIONS = {
	view: ["ViewMyShoppingLists", "ViewOthersShoppingLists"],
	create: ["CreateMyShoppingLists", "CreateOthersShoppingLists"],
	update: ["UpdateMyShoppingLists", "UpdateOthersShoppingLists"],
	delete: ["DeleteMyShoppingLists", "DeleteOthersShoppingLists"],
} as const;

/**
 * Business units, approval rules and approval flows have no `My`/`Others`
 * split: the resource is the business unit the associate is acting in, so the
 * permission is the same either way.
 */
export const BUSINESS_UNIT_ACTION_PERMISSIONS: Record<string, Permission> = {
	addAssociate: "UpdateAssociates",
	changeAssociate: "UpdateAssociates",
	removeAssociate: "UpdateAssociates",
	setAssociates: "UpdateAssociates",
	changeParentUnit: "UpdateParentUnit",
	setParentUnit: "UpdateParentUnit",
};

/** Anything else on a business unit changes its details. */
export const BUSINESS_UNIT_DETAILS_PERMISSION: Permission =
	"UpdateBusinessUnitDetails";

export const BUSINESS_UNIT_CREATE_PERMISSION: Permission = "AddChildUnits";

export const APPROVAL_RULE_CREATE_PERMISSION: Permission =
	"CreateApprovalRules";
export const APPROVAL_RULE_UPDATE_PERMISSION: Permission =
	"UpdateApprovalRules";
export const APPROVAL_FLOW_UPDATE_PERMISSION: Permission =
	"UpdateApprovalFlows";

// ---------------------------------------------------------------------------
// Resolving the acting associate
// ---------------------------------------------------------------------------

/**
 * The message shape commercetools uses for this error.
 *
 * @see https://docs.commercetools.com/api/errors#associatemissingpermission
 */
const missingPermission = (
	context: RepositoryContext,
	action: string,
	permissions: Permission[],
	forCustomerId?: string,
): CommercetoolsError<AssociateMissingPermissionError> => {
	const needs = permissions.map((p) => `'${p}'`).join(" or ");
	const onBehalf =
		forCustomerId && forCustomerId !== context.associateId
			? ` for customer '${forCustomerId}'`
			: "";

	return new CommercetoolsError<AssociateMissingPermissionError>(
		{
			code: "AssociateMissingPermission",
			message: `Associate '${context.associateId}' has no rights to ${action}${onBehalf} in business-unit '${context.businessUnitKey}'.${needs ? ` Needs ${needs}.` : ""}`,
			associate: { typeId: "customer", id: context.associateId },
			businessUnit: { typeId: "business-unit", key: context.businessUnitKey },
			permissions,
		},
		403,
	);
};

const roleKeysFor = (
	businessUnit: BusinessUnit,
	associateId: string,
): string[] | undefined => {
	const associate = businessUnit.associates?.find(
		(candidate) => candidate.customer.id === associateId,
	);
	if (associate) {
		return associate.associateRoleAssignments.map(
			(assignment) => assignment.associateRole.key,
		);
	}

	// An associate of a parent unit is an associate of its divisions
	const inherited = businessUnit.inheritedAssociates?.find(
		(candidate) => candidate.customer.id === associateId,
	);
	return inherited?.associateRoleAssignments.map(
		(assignment) => assignment.associateRole.key,
	);
};

export type AssociateContext = {
	associateId: string;
	businessUnit: BusinessUnit;
	permissions: Set<Permission>;
};

/**
 * Resolves the associate named in the path together with the permissions they
 * hold in the business unit named in the path.
 */
export const resolveAssociateContext = async (
	context: RepositoryContext,
	storage: AbstractStorage,
	/** The unit to resolve against, when it is not the one in the path. */
	businessUnitKeyOverride?: string,
): Promise<AssociateContext> => {
	const { associateId, projectKey } = context;
	const businessUnitKey = businessUnitKeyOverride ?? context.businessUnitKey;

	if (!associateId || !businessUnitKey) {
		throw missingPermission(context, "act", []);
	}

	const businessUnit = await storage.getByKey<"business-unit">(
		projectKey,
		"business-unit",
		businessUnitKey,
	);
	if (!businessUnit) {
		throw new CommercetoolsError<ResourceNotFoundError>(
			{
				code: "ResourceNotFound",
				message: `The business unit with key '${businessUnitKey}' was not found.`,
			},
			404,
		);
	}

	const roleKeys = roleKeysFor(businessUnit, associateId);
	if (!roleKeys) {
		throw missingPermission(context, "act", []);
	}

	const permissions = new Set<Permission>();
	for (const key of roleKeys) {
		const role = await storage.getByKey<"associate-role">(
			projectKey,
			"associate-role",
			key,
		);
		for (const permission of role?.permissions ?? []) {
			permissions.add(permission);
		}
	}

	return { associateId, businessUnit, permissions };
};

export const hasPermission = (
	associate: AssociateContext,
	permission: Permission,
): boolean => associate.permissions.has(permission);

export const requirePermission = (
	context: RepositoryContext,
	associate: AssociateContext,
	permission: Permission,
	action: string,
	forCustomerId?: string,
): void => {
	if (!hasPermission(associate, permission)) {
		throw missingPermission(context, action, [permission], forCustomerId);
	}
};

/**
 * Which of a permission pair the associate holds. Used for list endpoints,
 * where holding only the `My` variant narrows the result instead of refusing
 * the request.
 */
export const viewScope = (
	context: RepositoryContext,
	associate: AssociateContext,
	pair: PermissionPair,
	action = "view",
): AssociateScope => {
	if (hasPermission(associate, pair[1])) {
		return "others";
	}
	if (hasPermission(associate, pair[0])) {
		return "my";
	}
	throw missingPermission(context, action, [pair[0], pair[1]]);
};

/** The permission an update action on a quote needs. */
export const quoteActionPermission = (
	action: UpdateAction,
	scope: AssociateScope,
): Permission | undefined => {
	const withState = `${action.action}:${(action as { quoteState?: string }).quoteState}`;
	const pair =
		QUOTE_ACTION_PERMISSIONS[withState] ??
		QUOTE_ACTION_PERMISSIONS[action.action];
	return pair ? permissionFor(pair, scope) : undefined;
};

/** The permission an update action on a business unit needs. */
export const businessUnitActionPermission = (
	action: UpdateAction,
): Permission =>
	BUSINESS_UNIT_ACTION_PERMISSIONS[action.action] ??
	BUSINESS_UNIT_DETAILS_PERMISSION;
