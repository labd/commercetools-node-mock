import assert from "node:assert";
import type {
	Address,
	Associate,
	BusinessUnit,
	BusinessUnitAddAddressAction,
	BusinessUnitAddAssociateAction,
	BusinessUnitAddBillingAddressIdAction,
	BusinessUnitAddShippingAddressIdAction,
	BusinessUnitAddStoreAction,
	BusinessUnitChangeAddressAction,
	BusinessUnitChangeApprovalRuleModeAction,
	BusinessUnitChangeAssociateAction,
	BusinessUnitChangeAssociateModeAction,
	BusinessUnitChangeNameAction,
	BusinessUnitChangeParentUnitAction,
	BusinessUnitChangeStatusAction,
	BusinessUnitDraft,
	BusinessUnitRemoveAddressAction,
	BusinessUnitRemoveAssociateAction,
	BusinessUnitRemoveBillingAddressIdAction,
	BusinessUnitRemoveShippingAddressIdAction,
	BusinessUnitSetAddressCustomFieldAction,
	BusinessUnitSetAddressCustomTypeAction,
	BusinessUnitSetAssociatesAction,
	BusinessUnitSetContactEmailAction,
	BusinessUnitSetCustomFieldAction,
	BusinessUnitSetCustomTypeAction,
	BusinessUnitSetDefaultBillingAddressAction,
	BusinessUnitSetDefaultShippingAddressAction,
	BusinessUnitSetStoreModeAction,
	BusinessUnitUpdateAction,
	Company,
	CompanyDraft,
	Division,
	DivisionDraft,
	InvalidOperationError,
} from "@commercetools/platform-sdk";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { generateRandomString, getBaseResourceProperties } from "../helpers.ts";
import type { Writable } from "../types.ts";
import type { UpdateHandlerInterface } from "./abstract.ts";
import {
	AbstractResourceRepository,
	AbstractUpdateHandler,
	type RepositoryContext,
} from "./abstract.ts";
import {
	createAddress,
	createAssociate,
	createCustomFields,
	getBusinessUnitKeyReference,
	getStoreKeyReference,
} from "./helpers.ts";

export class BusinessUnitRepository extends AbstractResourceRepository<"business-unit"> {
	constructor(config: Config) {
		super("business-unit", config);
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

			associates:
				draft.associates?.map((a) =>
					createAssociate(a, context.projectKey, this._storage),
				) ?? [],
		};

		if (this._isDivisionDraft(draft)) {
			const division = {
				...resource,
				unitType: "Division" as const,
				parentUnit: getBusinessUnitKeyReference(
					draft.parentUnit,
					context.projectKey,
					this._storage,
				),
			} as Division;

			this.saveNew(context, division);
			return division;
		}
		if (this._isCompanyDraft(draft)) {
			const company = {
				...resource,
				unitType: "Company" as const,
			} as Company;

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
		{ addressId, addressKey, address }: BusinessUnitChangeAddressAction,
	) {
		const current = this._findAddress(resource, addressId, addressKey, true);
		assert(current?.id); // always true since we set required to true

		const oldAddressIndex = resource.addresses.findIndex(
			(a) => a.id === current.id,
		);

		const newAddress = createAddress(
			{ ...address, id: current.id },
			context.projectKey,
			this._storage,
		);

		if (newAddress) {
			resource.addresses[oldAddressIndex] = newAddress;
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

	removeAssociate(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ customer }: BusinessUnitRemoveAssociateAction,
	) {
		resource.associates = resource.associates.filter(
			(associate) => associate.customer.id !== customer.id,
		);
	}

	changeAssociate(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ associate }: BusinessUnitChangeAssociateAction,
	) {
		const existingAssociateIndex = resource.associates.findIndex(
			(a) => a.customer.id === associate.customer.id,
		);
		if (existingAssociateIndex === -1) {
			throw new Error(
				`Associate with customer id ${associate.customer.id} not found`,
			);
		}

		const newAssociate = createAssociate(
			associate,
			context.projectKey,
			this._storage,
		);
		if (newAssociate) {
			resource.associates[existingAssociateIndex] = newAssociate;
		}
	}

	setContactEmail(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ contactEmail }: BusinessUnitSetContactEmailAction,
	) {
		resource.contactEmail = contactEmail;
	}

	setCustomType(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ type, fields }: BusinessUnitSetCustomTypeAction,
	) {
		if (type) {
			resource.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		} else {
			resource.custom = undefined;
		}
	}

	setStoreMode(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ storeMode }: BusinessUnitSetStoreModeAction,
	) {
		resource.storeMode = storeMode;
	}

	setDefaultShippingAddress(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitSetDefaultShippingAddressAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true

		resource.defaultShippingAddressId = address.id;
		if (resource.shippingAddressIds === undefined) {
			resource.shippingAddressIds = [];
		}
		if (!resource.shippingAddressIds.includes(address.id)) {
			resource.shippingAddressIds.push(address.id);
		}
	}

	addShippingAddressId(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitAddShippingAddressIdAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true

		if (resource.shippingAddressIds === undefined) {
			resource.shippingAddressIds = [];
		}

		if (!resource.shippingAddressIds.includes(address.id)) {
			resource.shippingAddressIds.push(address.id);
		}
		return resource;
	}

	removeShippingAddressId(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitRemoveShippingAddressIdAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true
		resource.shippingAddressIds = resource.shippingAddressIds?.filter(
			(id) => id !== address.id,
		);
		if (resource.defaultShippingAddressId === address.id) {
			resource.defaultShippingAddressId = undefined;
		}
	}

	addBillingAddressId(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitAddBillingAddressIdAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true

		if (resource.billingAddressIds === undefined) {
			resource.billingAddressIds = [];
		}

		if (!resource.billingAddressIds.includes(address.id)) {
			resource.billingAddressIds.push(address.id);
		}
	}

	removeBillingAddressId(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitRemoveBillingAddressIdAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true
		resource.billingAddressIds = resource.billingAddressIds?.filter(
			(id) => id !== address.id,
		);
		if (resource.defaultBillingAddressId === address.id) {
			resource.defaultBillingAddressId = undefined;
		}
	}

	setDefaultBillingAddress(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitSetDefaultBillingAddressAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true

		resource.defaultBillingAddressId = address.id;
		if (resource.billingAddressIds === undefined) {
			resource.billingAddressIds = [];
		}
		if (!resource.billingAddressIds.includes(address.id)) {
			resource.billingAddressIds.push(address.id);
		}
	}

	setCustomField(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ name, value }: BusinessUnitSetCustomFieldAction,
	) {
		if (!resource.custom) {
			throw new Error("Resource has no custom type");
		}
		resource.custom.fields[name] = value;
	}

	setAddressCustomField(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, name, value }: BusinessUnitSetAddressCustomFieldAction,
	) {
		const address = resource.addresses.find((addr) => addr.id === addressId);
		if (!address) {
			throw new Error(`Address with id ${addressId} not found`);
		}
		if (!address.custom) {
			// If the address doesn't have custom fields, we need to initialize them
			// This might require a type to be set first, but we'll just create minimal structure
			throw new Error(
				"Address has no custom type set. Use setAddressCustomType first.",
			);
		}
		address.custom.fields[name] = value;
	}

	setAddressCustomType(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, type, fields }: BusinessUnitSetAddressCustomTypeAction,
	) {
		const address = resource.addresses.find((addr) => addr.id === addressId);
		if (!address) {
			throw new Error(`Address with id ${addressId} not found`);
		}

		if (!type) {
			address.custom = undefined;
		} else {
			address.custom = createCustomFields(
				{ type, fields },
				context.projectKey,
				this._storage,
			);
		}
	}

	removeAddress(
		context: RepositoryContext,
		resource: Writable<BusinessUnit>,
		{ addressId, addressKey }: BusinessUnitRemoveAddressAction,
	) {
		const address = this._findAddress(resource, addressId, addressKey, true);
		assert(address?.id); // always true since we set required to true
		resource.addresses = resource.addresses.filter((a) => a.id !== address.id);

		if (resource.shippingAddressIds) {
			resource.shippingAddressIds = resource.shippingAddressIds.filter(
				(id) => id !== address.id,
			);
		}
		if (resource.billingAddressIds) {
			resource.billingAddressIds = resource.billingAddressIds.filter(
				(id) => id !== address.id,
			);
		}

		if (resource.defaultShippingAddressId === address.id) {
			resource.defaultShippingAddressId = undefined;
		}
		if (resource.defaultBillingAddressId === address.id) {
			resource.defaultBillingAddressId = undefined;
		}
	}

	private _findAddress(
		resource: Writable<BusinessUnit>,
		addressId: string | undefined,
		addressKey: string | undefined,
		required = false,
	): Address | undefined {
		if (addressKey) {
			const address = resource.addresses.find((a) => a.key === addressKey);
			if (!address) {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message: `Business Unit does not contain an address with the key ${addressKey}.`,
					},
					400,
				);
			}
			return address;
		}

		if (addressId) {
			const address = resource.addresses.find((a) => a.id === addressId);
			if (!address) {
				throw new CommercetoolsError<InvalidOperationError>(
					{
						code: "InvalidOperation",
						message: `Business Unit does not contain an address with the id ${addressId}.`,
					},
					400,
				);
			}
			return address;
		}

		if (required) {
			throw new CommercetoolsError<InvalidOperationError>(
				{
					code: "InvalidOperation",
					message: "One of address 'addressId' or 'addressKey' is required.",
				},
				400,
			);
		}
	}
}
