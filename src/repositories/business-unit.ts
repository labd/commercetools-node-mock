import type {
	BusinessUnitChangeApprovalRuleModeAction,
	BusinessUnitChangeAssociateModeAction,
	BusinessUnitChangeStatusAction,
	BusinessUnitUpdateAction,
	CompanyDraft,
	DivisionDraft,
} from "@commercetools/platform-sdk";
import {
	type Associate,
	type BusinessUnit,
	type BusinessUnitAddAddressAction,
	type BusinessUnitAddAssociateAction,
	type BusinessUnitAddStoreAction,
	type BusinessUnitChangeAddressAction,
	type BusinessUnitChangeNameAction,
	type BusinessUnitChangeParentUnitAction,
	type BusinessUnitDraft,
	type BusinessUnitSetAssociatesAction,
	type BusinessUnitSetContactEmailAction,
	type BusinessUnitSetStoreModeAction,
	type Company,
	type Division,
} from "@commercetools/platform-sdk";
import type { AbstractStorage } from "~src/storage";
import { generateRandomString, getBaseResourceProperties } from "../helpers";
import type { Writable } from "../types";
import type { UpdateHandlerInterface } from "./abstract";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract";
import {
	createAddress,
	createAssociate,
	createCustomFields,
	getBusinessUnitKeyReference,
	getStoreKeyReference,
} from "./helpers";

export class BusinessUnitRepository extends AbstractResourceRepository<"business-unit"> {
	constructor(storage: AbstractStorage) {
		super("business-unit", storage);
		this.actions = new BusinessUnitUpdateHandler(this._storage);
	}

	create(context: RepositoryContext, draft: BusinessUnitDraft): BusinessUnit {
		const addresses =
			draft.addresses?.map((address) => ({
				...address,
				id: generateRandomString(5),
			})) ?? [];

		const defaultBillingAddressId =
			addresses.length > 0 && draft.defaultBillingAddress !== undefined
				? addresses[draft.defaultBillingAddress].id
				: undefined;
		const defaultShippingAddressId =
			addresses.length > 0 && draft.defaultShippingAddress !== undefined
				? addresses[draft.defaultShippingAddress].id
				: undefined;

		const shippingAddressIds = draft.shippingAddresses?.map(
			(i) => addresses[i].id,
		);
		const billingAddressIds = draft.billingAddresses?.map(
			(i) => addresses[i].id,
		);

		const resource = {
			...getBaseResourceProperties(),
			key: draft.key,
			status: draft.status,
			stores: draft.stores?.map((s) =>
				getStoreKeyReference(s, context.projectKey, this._storage),
			),
			storeMode: draft.storeMode,
			name: draft.name,
			contactEmail: draft.contactEmail,
			addresses: addresses,
			custom: createCustomFields(
				draft.custom,
				context.projectKey,
				this._storage,
			),
			shippingAddressIds: shippingAddressIds,
			billingAddressIds: billingAddressIds,
			defaultShippingAddressId: defaultShippingAddressId,
			defaultBillingAddressId: defaultBillingAddressId,
			associateMode: draft.associateMode,
			approvalRuleMode: draft.approvalRuleMode,

			associates: draft.associates?.map((a) =>
				createAssociate(a, context.projectKey, this._storage),
			),
		};

		if (this._isDivisionDraft(draft)) {
			const division = {
				...resource,
				parentUnit: getBusinessUnitKeyReference(
					draft.parentUnit,
					context.projectKey,
					this._storage,
				),
			} as Division;

			this.saveNew(context, division);
			return division;
		} else if (this._isCompanyDraft(draft)) {
			const company = resource as Company;

			this.saveNew(context, company);
			return company;
		}

		throw new Error("Invalid business unit type");
	}

	private _isCompanyDraft(draft: BusinessUnitDraft): draft is CompanyDraft {
		return draft.unitType === "Company";
	}

	private _isDivisionDraft(draft: BusinessUnitDraft): draft is DivisionDraft {
		return draft.unitType === "Division";
	}
}

class BusinessUnitUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<BusinessUnit, BusinessUnitUpdateAction>>
{
	addAddress(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ address }: BusinessUnitAddAddressAction,
	) {
		const newAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
		if (newAddress) {
			resource.addresses.push(newAddress);
		}
	}

	addAssociate(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ associate }: BusinessUnitAddAssociateAction,
	) {
		const newAssociate = createAssociate(
			associate,
			context.projectKey,
			this._storage,
		);
		if (newAssociate) {
			resource.associates.push(newAssociate);
		}
	}

	addStore(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ store }: BusinessUnitAddStoreAction,
	) {
		const newStore = getStoreKeyReference(
			store,
			context.projectKey,
			this._storage,
		);
		if (newStore) {
			if (!resource.stores) {
				resource.stores = [];
			}

			resource.stores.push(newStore);
		}
	}

	changeAddress(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ address }: BusinessUnitChangeAddressAction,
	) {
		const newAddress = createAddress(
			address,
			context.projectKey,
			this._storage,
		);
		if (newAddress) {
			resource.addresses.push(newAddress);
		}
	}

	changeApprovalRuleMode(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ approvalRuleMode }: BusinessUnitChangeApprovalRuleModeAction,
	) {
		resource.approvalRuleMode = approvalRuleMode;
	}

	changeAssociateMode(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ associateMode }: BusinessUnitChangeAssociateModeAction,
	) {
		resource.associateMode = associateMode;
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ name }: BusinessUnitChangeNameAction,
	) {
		resource.name = name;
	}

	changeParentUnit(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ parentUnit }: BusinessUnitChangeParentUnitAction,
	) {
		resource.parentUnit = getBusinessUnitKeyReference(
			parentUnit,
			context.projectKey,
			this._storage,
		);
	}

	changeStatus(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ status }: BusinessUnitChangeStatusAction,
	) {
		resource.status = status;
	}

	setAssociates(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ associates }: BusinessUnitSetAssociatesAction,
	) {
		const newAssociates = associates
			.map((a) => createAssociate(a, context.projectKey, this._storage))
			.filter((a): a is Writable<Associate> => a !== undefined);
		resource.associates = newAssociates || undefined;
	}

	setContactEmail(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ contactEmail }: BusinessUnitSetContactEmailAction,
	) {
		resource.contactEmail = contactEmail;
	}

	setStoreMode(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ storeMode }: BusinessUnitSetStoreModeAction,
	) {
		resource.storeMode = storeMode;
	}
}
