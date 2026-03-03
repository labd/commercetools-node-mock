import assert from "node:assert";
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

export class InMemoryStorage extends AbstractStorage {
	protected resources: {
		[projectKey: string]: ProjectStorage;
	} = {};

	protected projects: {
		[projectKey: string]: Project;
	} = {};

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
		this.projects[project.key] = project;
		return project;
	}

	async getProject(projectKey: string): Promise<Project> {
		return this.addProject(projectKey);
	}

	private async forProjectKey(projectKey: string): Promise<ProjectStorage> {
		await this.addProject(projectKey);

		let projectStorage = this.resources[projectKey];
		if (!projectStorage) {
			projectStorage = this.resources[projectKey] = {
				"associate-role": new Map<string, AssociateRole>(),
				"attribute-group": new Map<string, AttributeGroup>(),
				"business-unit": new Map<string, BusinessUnit>(),
				cart: new Map<string, Cart>(),
				"cart-discount": new Map<string, CartDiscount>(),
				category: new Map<string, Category>(),
				channel: new Map<string, Channel>(),
				customer: new Map<string, Customer>(),
				"customer-group": new Map<string, CustomerGroup>(),
				"discount-code": new Map<string, DiscountCode>(),
				"discount-group": new Map<string, DiscountGroup>(),
				extension: new Map<string, Extension>(),
				"inventory-entry": new Map<string, InventoryEntry>(),
				"key-value-document": new Map<string, CustomObject>(),
				order: new Map<string, Order>(),
				"order-edit": new Map<string, any>(),
				payment: new Map<string, Payment>(),
				product: new Map<string, Product>(),
				quote: new Map<string, Quote>(),
				"quote-request": new Map<string, QuoteRequest>(),
				"product-discount": new Map<string, ProductDiscount>(),
				"product-selection": new Map<string, any>(),
				"product-type": new Map<string, ProductType>(),
				"product-projection": new Map<string, ProductProjection>(),
				"product-tailoring": new Map<string, ProductTailoring>(),
				"recurrence-policy": new Map<string, RecurrencePolicy>(),
				"recurring-order": new Map<string, RecurringOrder>(),
				review: new Map<string, any>(),
				"shipping-method": new Map<string, ShippingMethod>(),
				"staged-quote": new Map<string, StagedQuote>(),
				state: new Map<string, State>(),
				store: new Map<string, Store>(),
				"shopping-list": new Map<string, ShoppingList>(),
				"standalone-price": new Map<string, any>(),
				subscription: new Map<string, Subscription>(),
				"tax-category": new Map<string, TaxCategory>(),
				type: new Map<string, Type>(),
				zone: new Map<string, Zone>(),
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
	}

	async all<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
	): Promise<ResourceMap[RT][]> {
		const projectStorage = await this.forProjectKey(projectKey);
		const store = projectStorage[typeId];
		if (store) {
			return Array.from(store.values()).map(cloneObject) as ResourceMap[RT][];
		}
		return [];
	}

	async add<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		obj: ResourceMap[RT],
		params: GetParams = {},
	): Promise<ResourceMap[RT]> {
		const store = await this.forProjectKey(projectKey);
		store[typeId]?.set(obj.id, obj);

		const resource = await this.get(projectKey, typeId, obj.id, params);
		assert(
			resource,
			`resource of type ${typeId} with id ${obj.id} not created`,
		);
		return cloneObject(resource);
	}

	async get<RT extends ResourceType>(
		projectKey: string,
		typeId: RT,
		id: string,
		params: GetParams = {},
	): Promise<ResourceMap[RT] | null> {
		const projectStorage = await this.forProjectKey(projectKey);
		const resource = projectStorage[typeId]?.get(id);
		if (resource) {
			const clone = cloneObject(resource);
			const expanded = await this.expand(projectKey, clone, params.expand);
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

		const resources: any[] = Array.from(resourceStore.values());
		const resource = resources.find((e) => e.key === key);
		if (resource) {
			const clone = cloneObject(resource);
			const expanded = await this.expand(projectKey, clone, params.expand);
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
			return this.expand(projectKey, resource, params.expand);
		}
		return resource;
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
			results: resources.map(cloneObject),
		} as PagedQueryResponseMap[RT];
	}
}
