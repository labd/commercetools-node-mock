import type {
	Application,
	ApplicationAgreement,
	ApplicationDraft,
} from "#src/checkout-types.ts";
import type { Config } from "#src/config.ts";
import { CommercetoolsError } from "#src/exceptions.ts";
import { getBaseResourceProperties } from "#src/helpers.ts";
import {
	AbstractResourceRepository,
	type RepositoryContext,
} from "../abstract.ts";
import { ApplicationUpdateHandler, toAgreement } from "./actions.ts";

/**
 * A commercetools Checkout Application, served under
 * `/{projectKey}/applications` on the Checkout API's host.
 */
export class CheckoutApplicationRepository extends AbstractResourceRepository<"application"> {
	constructor(config: Config) {
		super("application", config);
		this.actions = new ApplicationUpdateHandler(config.storage);
	}

	async create(
		context: RepositoryContext,
		draft: ApplicationDraft,
	): Promise<Application> {
		requireFields(draft, [
			"key",
			"name",
			"countries",
			"allowedOrigins",
			"mode",
			"paymentsConfiguration",
		]);
		if (draft.mode === "CompleteFlow" && !draft.logo?.url) {
			throw invalidInput("A logo is required if the mode is CompleteFlow.");
		}
		if (await this.getByKey(context, draft.key)) {
			throw new CommercetoolsError(
				{
					code: "DuplicateField",
					message: `An Application with key '${draft.key}' already exists.`,
					field: "key",
					duplicateValue: draft.key,
				},
				400,
			);
		}

		const resource: Application = {
			...getBaseResourceProperties(context.clientId),
			key: draft.key,
			status: draft.status ?? "Inactive",
			name: draft.name,
			description: draft.description,
			logo: draft.logo,
			countries: draft.countries,
			allowedOrigins: {
				allowAll: draft.allowedOrigins.allowAll ?? false,
				origins: draft.allowedOrigins.origins ?? [],
			},
			mode: draft.mode,
			paymentsConfiguration: draft.paymentsConfiguration,
			agreements: (draft.agreements ?? []).map(
				(a) => ("id" in a && a.id ? a : toAgreement(a)) as ApplicationAgreement,
			),
			discountsConfiguration: draft.discountsConfiguration,
		};
		return await this.saveNew(context, resource);
	}
}

export const invalidInput = (message: string) =>
	new CommercetoolsError(
		{
			code: "InvalidInput",
			message,
		},
		400,
	);

export const requireFields = <T extends object>(
	draft: T,
	fields: (keyof T)[],
) => {
	for (const field of fields) {
		if (draft[field] === undefined || draft[field] === null) {
			throw new CommercetoolsError(
				{
					code: "RequiredField",
					message: `The field '${String(field)}' is required.`,
					field: String(field),
				},
				400,
			);
		}
	}
};
