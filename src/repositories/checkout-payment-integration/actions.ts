import type {
	PaymentIntegration,
	PaymentIntegrationUpdateAction,
} from "#src/checkout-types.ts";
import type { Writable } from "#src/types.ts";
import type { UpdateHandlerInterface } from "../abstract.ts";
import { AbstractUpdateHandler, type RepositoryContext } from "../abstract.ts";

type Action<A extends PaymentIntegrationUpdateAction["action"]> = Extract<
	PaymentIntegrationUpdateAction,
	{ action: A }
>;

export class PaymentIntegrationUpdateHandler
	extends AbstractUpdateHandler
	implements
		Partial<
			UpdateHandlerInterface<PaymentIntegration, PaymentIntegrationUpdateAction>
		>
{
	setKey(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ key }: Action<"setKey">,
	) {
		resource.key = key;
	}

	setName(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ name }: Action<"setName">,
	) {
		resource.name = name;
	}

	setType(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ type }: Action<"setType">,
	) {
		resource.type = type;
	}

	setStatus(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ status }: Action<"setStatus">,
	) {
		resource.status = status;
	}

	setPredicate(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ predicate }: Action<"setPredicate">,
	) {
		resource.predicate = predicate;
	}

	setSortingInfo(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ sortingInfo }: Action<"setSortingInfo">,
	) {
		resource.sortingInfo = sortingInfo;
	}

	setDisplayInfo(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ displayInfo }: Action<"setDisplayInfo">,
	) {
		resource.displayInfo = displayInfo;
	}

	setDisplayInfoLabel(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ label }: Action<"setDisplayInfoLabel">,
	) {
		resource.displayInfo = { ...resource.displayInfo, label };
	}

	setDisplayInfoDescription(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ description }: Action<"setDisplayInfoDescription">,
	) {
		resource.displayInfo = { ...resource.displayInfo, description };
	}

	setDisplayInfoLogoUrl(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ logoUrl }: Action<"setDisplayInfoLogoUrl">,
	) {
		resource.displayInfo = { ...resource.displayInfo, logoUrl };
	}

	setDisplayInfoPayButtonText(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ payButtonText }: Action<"setDisplayInfoPayButtonText">,
	) {
		resource.displayInfo = { ...resource.displayInfo, payButtonText };
	}

	setAutomatedReversalConfiguration(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{
			automatedReversalConfiguration,
		}: Action<"setAutomatedReversalConfiguration">,
	) {
		resource.automatedReversalConfiguration = automatedReversalConfiguration;
	}

	setAutomatedReversalConfigurationStatus(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ status }: Action<"setAutomatedReversalConfigurationStatus">,
	) {
		resource.automatedReversalConfiguration = {
			...resource.automatedReversalConfiguration,
			status,
		};
	}

	setAutomatedReversalConfigurationPredicate(
		_context: RepositoryContext,
		resource: Writable<PaymentIntegration>,
		{ predicate }: Action<"setAutomatedReversalConfigurationPredicate">,
	) {
		resource.automatedReversalConfiguration = {
			status: resource.automatedReversalConfiguration?.status ?? "Inactive",
			predicate,
		};
	}
}
