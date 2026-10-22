/**
 * Types of the commercetools Checkout API, from @commercetools/checkout-sdk.
 * An Application's description is a LocalizedString, as the API returns it
 * and its examples and the setDescription action use it, where the spec, and
 * so the SDK, types it as a string.
 */
import type * as sdk from "@commercetools/checkout-sdk";
import type { LocalizedString } from "@commercetools/checkout-sdk";

export type Application = Omit<sdk.Application, "description"> & {
	readonly description?: LocalizedString;
};

export type ApplicationDraft = Omit<sdk.ApplicationDraft, "description"> & {
	readonly description?: LocalizedString;
};

export type {
	ApplicationAgreement,
	ApplicationAgreementDraft,
	ApplicationUpdateAction,
	PaginatedApplication,
	PaginatedPaymentIntegration,
	PaymentIntegration,
	PaymentIntegrationDraft,
	PaymentIntegrationUpdateAction,
} from "@commercetools/checkout-sdk";
