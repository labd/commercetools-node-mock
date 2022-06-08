import {
  Project,
  ProjectChangeCartsConfigurationAction,
  ProjectChangeCountriesAction,
  ProjectChangeCountryTaxRateFallbackEnabledAction,
  ProjectChangeCurrenciesAction,
  ProjectChangeLanguagesAction,
  ProjectChangeMessagesEnabledAction,
  ProjectChangeNameAction,
  ProjectChangeOrderSearchStatusAction,
  ProjectChangeProductSearchIndexingEnabledAction,
  ProjectSetExternalOAuthAction,
  ProjectSetShippingRateInputTypeAction,
  ProjectUpdateAction,
} from '@commercetools/platform-sdk'
import { InvalidOperationError } from '@commercetools/platform-sdk'
import { Writable } from 'types'
import { checkConcurrentModification } from './errors'
import { CommercetoolsError } from '../exceptions'
import { AbstractRepository, RepositoryContext } from './abstract'
import { maskSecretValue } from '../lib/masking'

export class ProjectRepository extends AbstractRepository {
  get(context: RepositoryContext): Project | null {
    const resource = this._storage.getProject(context.projectKey)
    const masked = maskSecretValue<Project>(
      resource,
      'externalOAuth.authorizationHeader'
    )
    return masked
  }

  save(context: RepositoryContext, resource: Project) {
    const current = this.get(context)

    if (current) {
      checkConcurrentModification(current, resource.version)
    } else {
      if (resource.version !== 0) {
        throw new CommercetoolsError<InvalidOperationError>(
          {
            code: 'InvalidOperation',
            message: 'version on create must be 0',
          },
          400
        )
      }
    }

    // @ts-ignore
    resource.version += 1
    this._storage.saveProject(resource)
  }

  actions: Partial<
    Record<
      ProjectUpdateAction['action'],
      (
        context: RepositoryContext,
        resource: Writable<Project>,
        action: any
      ) => void
    >
  > = {
    changeName: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { name }: ProjectChangeNameAction
    ) => {
      resource.name = name
    },
    changeCurrencies: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { currencies }: ProjectChangeCurrenciesAction
    ) => {
      resource.currencies = currencies
    },
    changeCountries: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { countries }: ProjectChangeCountriesAction
    ) => {
      resource.countries = countries
    },
    changeLanguages: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { languages }: ProjectChangeLanguagesAction
    ) => {
      resource.languages = languages
    },
    changeMessagesEnabled: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { messagesEnabled }: ProjectChangeMessagesEnabledAction
    ) => {
      resource.messages.enabled = messagesEnabled
    },
    changeProductSearchIndexingEnabled: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { enabled }: ProjectChangeProductSearchIndexingEnabledAction
    ) => {
      if (!resource.searchIndexing?.products) {
        throw new Error('Invalid project state')
      }
      resource.searchIndexing.products.status = enabled
        ? 'Activated'
        : 'Deactivated'
      resource.searchIndexing.products.lastModifiedAt = new Date().toISOString()
    },
    changeOrderSearchStatus: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { status }: ProjectChangeOrderSearchStatusAction
    ) => {
      if (!resource.searchIndexing?.orders) {
        throw new Error('Invalid project state')
      }
      resource.searchIndexing.orders.status = status
      resource.searchIndexing.orders.lastModifiedAt = new Date().toISOString()
    },
    setShippingRateInputType: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { shippingRateInputType }: ProjectSetShippingRateInputTypeAction
    ) => {
      resource.shippingRateInputType = shippingRateInputType
    },
    setExternalOAuth: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { externalOAuth }: ProjectSetExternalOAuthAction
    ) => {
      resource.externalOAuth = externalOAuth
    },
    changeCountryTaxRateFallbackEnabled: (
      context: RepositoryContext,
      resource: Writable<Project>,
      {
        countryTaxRateFallbackEnabled,
      }: ProjectChangeCountryTaxRateFallbackEnabledAction
    ) => {
      resource.carts.countryTaxRateFallbackEnabled = countryTaxRateFallbackEnabled
    },
    changeCartsConfiguration: (
      context: RepositoryContext,
      resource: Writable<Project>,
      { cartsConfiguration }: ProjectChangeCartsConfigurationAction
    ) => {
      resource.carts = cartsConfiguration || {
        countryTaxRateFallbackEnabled: false,
        deleteDaysAfterLastModification: 90,
      }
    },
  }
}
