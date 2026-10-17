import type {
	PaymentIntegration,
	PaymentIntegrationDraft,
} from "#src/checkout-types.ts";
import type { Config } from "#src/config.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { invalidInput, requireFields } from "../checkout-application/index.ts";
import { PaymentIntegrationUpdateHandler } from "./actions.ts";

/**
 * A commercetools Checkout Payment Integration, served under
 * `/{projectKey}/payment-integrations` on the Checkout API's host. Its
 * connector deployment lives in Connect, which the mock does not hold, so only
 * the shape of that reference is checked.
 */
export class CheckoutPaymentIntegrationRepository extends AbstractResourceRepository<"payment-integration"> {
	constructor(config: Config) {
		super("payment-integration", config);
		this.actions = new PaymentIntegrationUpdateHandler(config.storage);
	}

	async create(
		context: RepositoryContext,
		draft: PaymentIntegrationDraft,
	): Promise<PaymentIntegration> {
		requireFields(draft, [
			"application",
			"type",
			"name",
			"componentType",
			"connectorDeployment",
		]);
		const application = await this._storage.get(
			context.projectKey,
			"application",
			draft.application.id,
		);
		if (!application) {
			throw invalidInput(
				`The Application with ID '${draft.application.id}' was not found.`,
			);
		}
		if (
			draft.connectorDeployment.typeId !== "deployment" ||
			!draft.connectorDeployment.id
		) {
			throw invalidInput(
				"The connectorDeployment must reference a deployment by its id.",
			);
		}

		const resource: PaymentIntegration = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			application: { typeId: "application", id: draft.application.id },
			status: draft.status ?? "Inactive",
			type: draft.type,
			name: draft.name,
			predicate: draft.predicate,
			componentType: draft.componentType,
			connectorDeployment: {
				typeId: "deployment",
				id: draft.connectorDeployment.id,
			},
			displayInfo: draft.displayInfo,
			sortingInfo: draft.sortingInfo,
			automatedReversalConfiguration: draft.automatedReversalConfiguration,
		};
		return await this.saveNew(context, resource);
	}
}
