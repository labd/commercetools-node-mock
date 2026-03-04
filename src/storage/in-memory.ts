import type {
	AssociateRole,
	AttributeGroup,
	BusinessUnit,
	Cart,
	CartDiscount,
	Category,
	Channel,
	Customer,
	CustomerGroup,
	CustomObject,
	DiscountCode,
	DiscountGroup,
	Extension,
	InvalidInputError,
	InventoryEntry,
	Order,
	Payment,
	Product,
	ProductDiscount,
	ProductProjection,
	ProductTailoring,
	ProductType,
	Project,
	Quote,
	QuoteRequest,
	RecurrencePolicy,
	RecurringOrder,
	ShippingMethod,
	ShoppingList,
	StagedQuote,
	State,
	Store,
	Subscription,
	TaxCategory,
	Type,
	Zone,
} from "@commercetools/platform-sdk";
import { CommercetoolsError } from "#src/exceptions.ts";
import { cloneObject } from "../helpers.ts";
import { parseQueryExpression } from "../lib/predicateParser.ts";
import type {
	PagedQueryResponseMap,
	ResourceMap,
	ResourceType,
} from "../types.ts";
import type { GetParams, ProjectStorage, QueryParams } from "./abstract.ts";
import { AbstractStorage } from "./abstract.ts";
import { StorageMap } from "./storage-map.ts";

export class InMemoryStorage extends AbstractStorage {
	protected resources: {
		[projectKey: string]: ProjectStorage;
	} = {};

	protected projects: {
		[projectKey: string]: Project;
	} = {};

	// Secondary index for custom objects: projectKey -> "container\0key" -> resource id
	private _customObjectIndex: Map<string, Map<string, string>> = new Map();

	async addProject(projectKey: string): Promise<Project> {
		if (!this.projects[projectKey]) {
			this.projects[projectKey] = {
				key: projectKey,
				name: "",
				countries: [],
				currencies: [],
				languages: [],
				createdAt: "2018-10-04T11:32:12.603Z",
				trialUntil: "2018-12",
				carts: {
					countryTaxRateFallbackEnabled: false,
					deleteDaysAfterLastModification: 90,
					priceRoundingMode: "HalfEven",
					taxRoundingMode: "HalfEven",
				},
				shoppingLists: {
					deleteDaysAfterLastModification: 360,
				},
				messages: { enabled: false, deleteDaysAfterCreation: 15 },
				shippingRateInputType: undefined,
				externalOAuth: undefined,
				searchIndexing: {
					products: {
						status: "Deactivated",
					},
					productsSearch: {
						status: "Deactivated",
					},
					orders: {
						status: "Deactivated",
					},
					customers: {
						status: "Deactivated",
					},
					businessUnits: {
						status: "Deactivated",
					},
				},
				discounts: {
					discountCombinationMode: "Stacking",
				},
				version: 1,
			};
		}
		return this.projects[projectKey];
	}

	async saveProject(project: Project): Promise<Project> {
		this.projects[project.key] = cloneObject(project);
		return project;
	}

	async getProject(projectKey: string): Promise<Project> {
		await this.addProject(projectKey);
		return cloneObject(this.projects[projectKey]);
	}

	private async forProjectKey(projectKey: string): Promise<ProjectStorage> {
		await this.addProject(projectKey);

		let projectStorage = this.resources[projectKey];
		if (!projectStorage) {
			projectStorage = this.resources[projectKey] = {
				"associate-role": new StorageMap<string, AssociateRole>(),
				"attribute-group": new StorageMap<string, AttributeGroup>(),
				"business-unit": new StorageMap<string, BusinessUnit>(),
				cart: new StorageMap<string, Cart>(),
				"cart-discount": new StorageMap<string, CartDiscount>(),
				category: new StorageMap<string, Category>(),
				channel: new StorageMap<string, Channel>(),
				customer: new StorageMap<string, Customer>(),
				"customer-group": new StorageMap<string, CustomerGroup>(),
				"discount-code": new StorageMap<string, DiscountCode>(),
				"discount-group": new StorageMap<string, DiscountGroup>(),
				extension: new StorageMap<string, Extension>(),
				"inventory-entry": new StorageMap<string, InventoryEntry>(),
				"key-value-document": new StorageMap<string, CustomObject>(),
				order: new StorageMap<string, Order>(),
				"order-edit": new StorageMap<string, any>(),
				payment: new StorageMap<string, Payment>(),
				product: new StorageMap<string, Product>(),
				quote: new StorageMap<string, Quote>(),
				"quote-request": new StorageMap<string, QuoteRequest>(),
				"product-discount": new StorageMap<string, ProductDiscount>(),
				"product-selection": new StorageMap<string, any>(),
				"product-type": new StorageMap<string, ProductType>(),
				"product-projection": new StorageMap<string, ProductProjection>(),
				"product-tailoring": new StorageMap<string, ProductTailoring>(),
				"recurrence-policy": new StorageMap<string, RecurrencePolicy>(),
				"recurring-order": new StorageMap<string, RecurringOrder>(),
				review: new StorageMap<string, any>(),
				"shipping-method": new StorageMap<string, ShippingMethod>(),
				"staged-quote": new StorageMap<string, StagedQuote>(),
				state: new StorageMap<string, State>(),
				store: new StorageMap<string, Store>(),
				"shopping-list": new StorageMap<string, ShoppingList>(),
				"standalone-price": new StorageMap<string, any>(),
				subscription: new StorageMap<string, Subscription>(),
				"tax-category": new StorageMap<string, TaxCategory>(),
				type: new StorageMap<string, Type>(),
				zone: new StorageMap<string, Zone>(),
			};
		}
		return projectStorage;
	}

	async clear(): Promise<void> {
		for (const [, projectStorage] of Object.entries(this.resources)) {
			for (const [, value] of Object.entries(projectStorage)) {
				value?.clear();
			}
		}
		this._customObjectIndex.clear();
	}

	async all<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
	): Promise<ResourceMap[RT][]> {
		const projectStorage = await this.forProjectKey(projectKey);
		const store = projectStorage[typeId];
		if (store) {
			// StorageMap.values() already returns cloned values
			return Array.from(store.values()) as ResourceMap[RT][];
		}
		return [];
	}

	async count(projectKey: string, typeId: ResourceType): Promise<number> {
		const projectStorage = await this.forProjectKey(projectKey);
		const store = projectStorage[typeId];
		return store ? store.size : 0;
	}

	async add<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		obj: ResourceMap[RT],
		params: GetParams = {},
	): Promise<ResourceMap[RT]> {
		const store = await this.forProjectKey(projectKey);
		// StorageMap.set() clones the value before storing
		store[typeId]?.set(obj.id, obj);

		// Maintain secondary index for custom objects
		if (typeId === "key-value-document") {
			const co = obj as unknown as CustomObject;
			let projectIndex = this._customObjectIndex.get(projectKey);
			if (!projectIndex) {
				projectIndex = new Map();
				this._customObjectIndex.set(projectKey, projectIndex);
			}
			projectIndex.set(`${co.container}\0${co.key}`, co.id);
		}

		// StorageMap.get() returns a clone, so we get a fresh copy for expand
		const clone = store[typeId]?.get(obj.id) as ResourceMap[RT];
		return this.expand(projectKey, clone, params.expand);
	}

	async get<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const projectStorage = await this.forProjectKey(projectKey);
		// StorageMap.get() already returns a clone
		const resource = projectStorage[typeId]?.get(id);
		if (resource) {
			const expanded = await this.expand(projectKey, resource, params.expand);
			return expanded as ResourceMap[RT];
		}
		return null;
	}

	async getByKey<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		key: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const store = await this.forProjectKey(projectKey);
		if (!store) {
			throw new Error("No type");
		}
		const resourceStore = store[typeId];

		// StorageMap.values() already returns cloned values
		const resources: any[] = Array.from(resourceStore.values());
		const resource = resources.find((e) => e.key === key);
		if (resource) {
			const expanded = await this.expand(projectKey, resource, params.expand);
			return expanded as ResourceMap[RT];
		}
		return null;
	}

	async delete<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const resource = await this.get(projectKey, typeId, id);

		if (resource) {
			const projectStorage = await this.forProjectKey(projectKey);
			projectStorage[typeId]?.delete(id);

			// Remove from secondary index for custom objects
			if (typeId === "key-value-document") {
				const co = resource as unknown as CustomObject;
				this._customObjectIndex
					.get(projectKey)
					?.delete(`${co.container}\0${co.key}`);
			}

			return this.expand(projectKey, resource, params.expand);
		}
		return resource;
	}

	async getByContainerAndKey(
		projectKey: string,
		container: string,
		key: string,
	): Promise<CustomObject | null> {
		const projectIndex = this._customObjectIndex.get(projectKey);
		if (!projectIndex) {
			return null;
		}
		const id = projectIndex.get(`${container}\0${key}`);
		if (!id) {
			return null;
		}
		const resource = await this.get(projectKey, "key-value-document", id);
		return resource as CustomObject | null;
	}

	async query<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		params: QueryParams,
	): Promise<PagedQueryResponseMap[RT]> {
		const projectStorage = await this.forProjectKey(projectKey);
		const store = projectStorage[typeId];
		if (!store) {
			throw new Error("No type");
		}

		// all() already returns cloned values via StorageMap
		let resources = await this.all<RT>(projectKey, typeId);

		// Apply predicates
		if (params.where) {
			// Get all key-value pairs starting with 'var.' to pass as variables, removing
			// the 'var.' prefix.
			const vars = Object.fromEntries(
				Object.entries(params)
					.filter(([key]) => key.startsWith("var."))
					.map(([key, value]) => [key.slice(4), value]),
			);

			try {
				const filterFunc = parseQueryExpression(params.where);
				resources = resources.filter((resource) => filterFunc(resource, vars));
			} catch (err) {
				throw new CommercetoolsError<InvalidInputError>(
					{
						code: "InvalidInput",
						message: (err as any).message,
					},
					400,
				);
			}
		}

		// Get the total before slicing the array
		const totalResources = resources.length;

		// Apply offset, limit
		const offset = params.offset || 0;
		const limit = params.limit || 20;
		resources = resources.slice(offset, offset + limit);

		// Expand the resources
		if (params.expand !== undefined) {
			resources = await Promise.all(
				resources.map((resource) =>
					this.expand(projectKey, resource, params.expand),
				),
			);
		}

		return {
			count: resources.length,
			total: totalResources,
			offset: offset,
			limit: limit,
			// Resources are already clones from StorageMap
			results: resources,
		} as PagedQueryResponseMap[RT];
	}
}
