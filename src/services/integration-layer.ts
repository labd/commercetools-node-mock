import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type {
	CheckoutConfig,
	ConfigEntryPatch,
	IdpConfigInput,
	ProjectSettings,
	SourceCoordinate,
} from "#src/integration-layer-types.ts";
import type { IntegrationLayerRepository } from "../repositories/integration-layer.ts";

type Request = FastifyRequest<{ Params: { projectKey: string } }>;

/** Answers an error the way the management API does. */
const error = (reply: FastifyReply, status: number, message: string) =>
	reply.status(status).send({ error: message });

/**
 * The Commerce Integration Layer's management API, under
 * `/{projectKey}/main` on its own host (`extensions.integration-layer.*`).
 */
export class IntegrationLayerService {
	public repository: IntegrationLayerRepository;

	constructor(parent: FastifyInstance, repository: IntegrationLayerRepository) {
		this.repository = repository;
		parent.register(
			(instance, _opts, done) => {
				instance.get("/settings", this.getSettings.bind(this));
				instance.put("/settings", this.putSettings.bind(this));
				instance.put("/checkout", this.putCheckout.bind(this));
				instance.get("/schema/visibility", this.getVisibility.bind(this));
				instance.put("/schema/visibility", this.putVisibility.bind(this));
				instance.get("/idp", this.getIdp.bind(this));
				instance.put("/idp", this.putIdp.bind(this));
				instance.delete("/idp", this.deleteIdp.bind(this));
				instance.get("/extension/config", this.getConfig.bind(this));
				instance.patch("/extension/config", this.patchConfig.bind(this));
				instance.get("/extension/allowlist", this.getAllowlist.bind(this));
				instance.put("/extension/allowlist", this.putAllowlist.bind(this));
				done();
			},
			{ prefix: "/main" },
		);
	}

	async getSettings(request: Request, reply: FastifyReply) {
		const { projectKey } = request.params;
		const state = this.repository.state(projectKey);
		return reply.status(200).send({
			project: { ...state.settings, checkout: state.checkout },
			platform: { regionId: "europe-west1" },
			presentment: await this.repository.presentment(projectKey),
			version: state.version,
		});
	}

	async putSettings(request: Request, reply: FastifyReply) {
		const body = request.body as Partial<ProjectSettings>;
		if (!body?.label || !body.language || !body.currency || !body.country) {
			return error(
				reply,
				400,
				"label, language, currency and country are required",
			);
		}
		const state = this.repository.state(request.params.projectKey);
		state.settings = {
			label: body.label,
			language: body.language,
			currency: body.currency,
			country: body.country,
		};
		state.version++;
		return reply
			.status(200)
			.send({ project: state.settings, version: state.version });
	}

	async putCheckout(request: Request, reply: FastifyReply) {
		const body = request.body as CheckoutConfig;
		if (!Array.isArray(body?.rules) || body.rules.length === 0) {
			return error(reply, 400, "at least one rule is required");
		}
		const state = this.repository.state(request.params.projectKey);
		state.checkout = { rules: body.rules };
		state.version++;
		return reply
			.status(200)
			.send({ checkout: state.checkout, version: state.version });
	}

	async getVisibility(request: Request, reply: FastifyReply) {
		const { projectKey } = request.params;
		return reply.status(200).send({
			fields: await this.repository.visibility(projectKey),
			version: this.repository.state(projectKey).version,
		});
	}

	async putVisibility(request: Request, reply: FastifyReply) {
		const body = request.body as SourceCoordinate[];
		if (!Array.isArray(body)) {
			return error(reply, 400, "expected an array of field coordinates");
		}
		const state = this.repository.state(request.params.projectKey);
		state.hiddenFields = body;
		state.version++;
		return reply.status(200).send({
			hiddenFields: body,
			version: state.version,
			publishPending: false,
		});
	}

	async getIdp(request: Request, reply: FastifyReply) {
		const { idp } = this.repository.state(request.params.projectKey);
		if (!idp) {
			return error(reply, 404, "No IdP configured");
		}
		return reply.status(200).send(idp);
	}

	async putIdp(request: Request, reply: FastifyReply) {
		const { clientSecret, ...body } = request.body as IdpConfigInput;
		const state = this.repository.state(request.params.projectKey);
		if (!clientSecret && !state.idpClientSecret) {
			return error(reply, 400, "clientSecret is required");
		}
		if (clientSecret) {
			state.idpClientSecret = clientSecret;
		}
		state.idp = { ...body, hasClientSecret: true };
		state.version++;
		return reply.status(200).send(state.idp);
	}

	async deleteIdp(request: Request, reply: FastifyReply) {
		const state = this.repository.state(request.params.projectKey);
		state.idp = undefined;
		state.idpClientSecret = undefined;
		return reply.status(204).send();
	}

	async getConfig(request: Request, reply: FastifyReply) {
		return reply.status(200).send({
			entries: this.repository.configEntries(request.params.projectKey),
			maskExtensionGraphQLErrors: true,
		});
	}

	async patchConfig(request: Request, reply: FastifyReply) {
		const body = request.body as { entries?: ConfigEntryPatch[] };
		this.repository.patchConfig(request.params.projectKey, body?.entries ?? []);
		return this.getConfig(request, reply);
	}

	async getAllowlist(request: Request, reply: FastifyReply) {
		return reply.status(200).send({
			allow: this.repository.state(request.params.projectKey).allow,
			deny: this.repository.deny(),
		});
	}

	async putAllowlist(request: Request, reply: FastifyReply) {
		const body = request.body as string[];
		if (!Array.isArray(body)) {
			return error(reply, 400, "expected an array of host patterns");
		}
		const state = this.repository.state(request.params.projectKey);
		// The API stores them in lowercase, once each.
		state.allow = [...new Set(body.map((host) => host.toLowerCase()))];
		state.version++;
		return reply
			.status(200)
			.send({ allow: state.allow, version: state.version });
	}
}
