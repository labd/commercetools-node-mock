import { v4 as uuidv4 } from "uuid";
import type {
	Application,
	ApplicationAgreement,
	ApplicationAgreementDraft,
	ApplicationUpdateAction,
} from "#src/checkout-types.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

type Action<A extends ApplicationUpdateAction["action"]> = Extract<
	ApplicationUpdateAction,
	{ action: A }
>;

export const toAgreement = (
	draft: ApplicationAgreementDraft,
): ApplicationAgreement => ({
	id: uuidv4(),
	name: draft.name,
	type: draft.type,
	status: draft.status,
	text: draft.text,
});

export class ApplicationUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<UpdateHandlerInterface<Application, ApplicationUpdateAction>>
{
	setName(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ name }: Action<"setName">,
	) {
		resource.name = name;
	}

	setDescription(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ description }: Action<"setDescription">,
	) {
		// An empty object removes the description.
		resource.description =
			Object.keys(description ?? {}).length > 0 ? description : undefined;
	}

	setStatus(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ status }: Action<"setStatus">,
	) {
		resource.status = status;
	}

	setApplicationLogo(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ logo }: Action<"setApplicationLogo">,
	) {
		resource.logo = logo?.url ? logo : undefined;
	}

	setCountries(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ countries }: Action<"setCountries">,
	) {
		resource.countries = countries;
	}

	addCountry(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ country }: Action<"addCountry">,
	) {
		if (!resource.countries.includes(country)) {
			resource.countries.push(country);
		}
	}

	removeCountry(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ country }: Action<"removeCountry">,
	) {
		resource.countries = resource.countries.filter((c) => c !== country);
	}

	setAllowedOrigins(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ allowedOrigins }: Action<"setAllowedOrigins">,
	) {
		resource.allowedOrigins = {
			allowAll: allowedOrigins.allowAll,
			origins: allowedOrigins.origins ?? [],
		};
	}

	setAllowAllOrigins(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ allowAll }: Action<"setAllowAllOrigins">,
	) {
		resource.allowedOrigins.allowAll = allowAll;
	}

	addAllowedOrigin(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ origin }: Action<"addAllowedOrigin">,
	) {
		const origins = resource.allowedOrigins.origins ?? [];
		if (!origins.includes(origin)) {
			resource.allowedOrigins.origins = [...origins, origin];
		}
	}

	removeAllowedOrigin(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ origin }: Action<"removeAllowedOrigin">,
	) {
		resource.allowedOrigins.origins = (
			resource.allowedOrigins.origins ?? []
		).filter((o) => o !== origin);
	}

	setPaymentsConfiguration(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ paymentsConfiguration }: Action<"setPaymentsConfiguration">,
	) {
		resource.paymentsConfiguration = paymentsConfiguration;
	}

	setPaymentReturnUrl(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ paymentReturnUrl }: Action<"setPaymentReturnUrl">,
	) {
		resource.paymentsConfiguration.paymentReturnUrl = paymentReturnUrl;
	}

	setActivePaymentComponentType(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ activePaymentComponentType }: Action<"setActivePaymentComponentType">,
	) {
		resource.paymentsConfiguration.activePaymentComponentType =
			activePaymentComponentType;
	}

	setDiscountsConfiguration(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ discountsConfiguration }: Action<"setDiscountsConfiguration">,
	) {
		resource.discountsConfiguration = discountsConfiguration;
	}

	setAgreements(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreements }: Action<"setAgreements">,
	) {
		resource.agreements = (agreements ?? []).map(toAgreement);
	}

	addAgreement(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreement }: Action<"addAgreement">,
	) {
		resource.agreements = [
			...(resource.agreements ?? []),
			toAgreement(agreement),
		];
	}

	removeAgreement(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreementId }: Action<"removeAgreement">,
	) {
		this.agreement(resource, agreementId);
		resource.agreements = (resource.agreements ?? []).filter(
			(a) => a.id !== agreementId,
		);
	}

	reorderAgreement(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreementIds }: Action<"reorderAgreement">,
	) {
		resource.agreements = agreementIds.map((id) =>
			this.agreement(resource, id),
		);
	}

	setAgreementName(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreementId, name }: Action<"setAgreementName">,
	) {
		this.agreement(resource, agreementId).name = name;
	}

	setAgreementType(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreementId, type }: Action<"setAgreementType">,
	) {
		this.agreement(resource, agreementId).type = type;
	}

	setAgreementStatus(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreementId, status }: Action<"setAgreementStatus">,
	) {
		this.agreement(resource, agreementId).status = status;
	}

	setAgreementText(
		_context: RepositoryContext,
		resource: Writable<Application>,
		{ agreementId, text }: Action<"setAgreementText">,
	) {
		this.agreement(resource, agreementId).text = text;
	}

	private agreement(
		resource: Writable<Application>,
		id: string,
	): Writable<ApplicationAgreement> {
		const agreement = resource.agreements?.find((a) => a.id === id);
		if (!agreement) {
			throw new CommercetoolsError(
				{
					code: "InvalidInput",
					message: `The agreement with ID '${id}' was not found.`,
				},
				400,
			);
		}
		return agreement;
	}
}
