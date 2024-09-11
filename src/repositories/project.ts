import type {
	Project,
	ProjectChangeBusinessUnitStatusOnCreationAction,
	ProjectChangeCartsConfigurationAction,
	ProjectChangeCountriesAction,
	ProjectChangeCountryTaxRateFallbackEnabledAction,
	ProjectChangeCurrenciesAction,
	ProjectChangeLanguagesAction,
	ProjectChangeMessagesConfigurationAction,
	ProjectChangeNameAction,
	ProjectChangeOrderSearchStatusAction,
	ProjectChangeProductSearchIndexingEnabledAction,
	ProjectSetExternalOAuthAction,
	ProjectSetShippingRateInputTypeAction,
	ProjectUpdateAction,
} from "@commercetools/platform-sdk";
import { ProjectSetBusinessUnitAssociateRoleOnCreationAction } from "@commercetools/platform-sdk/dist/declarations/src/generated/models/project";
import { maskSecretValue } from "../lib/masking";
import { AbstractStorage } from "../storage/abstract";
import type { Writable } from "../types";
import {
	AbstractRepository,
	AbstractUpdateHandler,
	RepositoryContext,
	UpdateHandlerInterface,
} from "./abstract";

export class ProjectRepository extends AbstractRepository<Project> {
	constructor(storage: AbstractStorage) {
		super(storage);
		this.actions = new ProjectUpdateHandler(storage);
	}

	get(context: RepositoryContext): Project | null {
		const resource = this._storage.getProject(context.projectKey);
		return this.postProcessResource(context, resource);
	}

	postProcessResource(context: RepositoryContext, resource: Project): Project {
		if (resource) {
			return maskSecretValue(resource, "externalOAuth.authorizationHeader");
		}
		return resource;
	}

	saveNew(context: RepositoryContext, resource: Writable<Project>) {
		resource.version = 1;
		this._storage.saveProject(resource);
	}

	saveUpdate(context: RepositoryContext, version: number, resource: Project) {
		this._storage.saveProject(resource);
	}
}

class ProjectUpdateHandler
	extends AbstractUpdateHandler
	implements Partial<UpdateHandlerInterface<Project, ProjectUpdateAction>>
{
	changeCartsConfiguration(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ cartsConfiguration }: ProjectChangeCartsConfigurationAction,
	) {
		resource.carts = cartsConfiguration || {
			countryTaxRateFallbackEnabled: false,
			deleteDaysAfterLastModification: 90,
		};
	}

	changeCountries(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ countries }: ProjectChangeCountriesAction,
	) {
		resource.countries = countries;
	}

	changeCountryTaxRateFallbackEnabled(
		context: RepositoryContext,
		resource: Writable<Project>,
		{
			countryTaxRateFallbackEnabled,
		}: ProjectChangeCountryTaxRateFallbackEnabledAction,
	) {
		resource.carts.countryTaxRateFallbackEnabled =
			countryTaxRateFallbackEnabled;
	}

	changeCurrencies(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ currencies }: ProjectChangeCurrenciesAction,
	) {
		resource.currencies = currencies;
	}

	changeLanguages(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ languages }: ProjectChangeLanguagesAction,
	) {
		resource.languages = languages;
	}

	changeMessagesConfiguration(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ messagesConfiguration }: ProjectChangeMessagesConfigurationAction,
	) {
		resource.messages.enabled = messagesConfiguration.enabled;
		resource.messages.deleteDaysAfterCreation =
			messagesConfiguration.deleteDaysAfterCreation;
	}

	changeMyBusinessUnitStatusOnCreation(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ status }: ProjectChangeBusinessUnitStatusOnCreationAction,
	) {
		if (resource.businessUnits === undefined) {
			resource.businessUnits = {
				myBusinessUnitStatusOnCreation: "Inactive",
			};
		}

		resource.businessUnits.myBusinessUnitStatusOnCreation = status;
	}

	changeName(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ name }: ProjectChangeNameAction,
	) {
		resource.name = name;
	}

	changeOrderSearchStatus(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ status }: ProjectChangeOrderSearchStatusAction,
	) {
		if (!resource.searchIndexing?.orders) {
			throw new Error("Invalid project state");
		}
		resource.searchIndexing.orders.status = status;
		resource.searchIndexing.orders.lastModifiedAt = new Date().toISOString();
	}

	changeProductSearchIndexingEnabled(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ enabled }: ProjectChangeProductSearchIndexingEnabledAction,
	) {
		if (!resource.searchIndexing?.products) {
			throw new Error("Invalid project state");
		}
		resource.searchIndexing.products.status = enabled
			? "Activated"
			: "Deactivated";
		resource.searchIndexing.products.lastModifiedAt = new Date().toISOString();
	}

	setExternalOAuth(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ externalOAuth }: ProjectSetExternalOAuthAction,
	) {
		resource.externalOAuth = externalOAuth;
	}

	setMyBusinessUnitAssociateRoleOnCreation(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ associateRole }: ProjectSetBusinessUnitAssociateRoleOnCreationAction,
	) {
		if (resource.businessUnits === undefined) {
			resource.businessUnits = {
				//Default status, so we set it here also
				myBusinessUnitStatusOnCreation: "Inactive",
			};
		}

		resource.businessUnits.myBusinessUnitAssociateRoleOnCreation = {
			typeId: associateRole.typeId,
			key: associateRole.key ?? "unknown",
		};
	}

	setShippingRateInputType(
		context: RepositoryContext,
		resource: Writable<Project>,
		{ shippingRateInputType }: ProjectSetShippingRateInputTypeAction,
	) {
		resource.shippingRateInputType = shippingRateInputType;
	}
}
