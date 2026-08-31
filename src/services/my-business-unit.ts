import type { FastifyInstance } from "fastify";
import type { BusinessUnitRepository } from "#src/repositories/business-unit.ts";
import AbstractMyService, { type MyResourceRules } from "./abstract-my.ts";

export class MyBusinessUnitService extends AbstractMyService {
	public repository: BusinessUnitRepository;

	// A customer's business units are the ones they are an associate of
	protected myRules: MyResourceRules = {
		customerWhere: (customerId) => `associates(customer(id="${customerId}"))`,
		customerOf: () => undefined,
	};

	constructor(parent: FastifyInstance, repository: BusinessUnitRepository) {
		super(parent);
		this.repository = repository;
	}

	protected override owns(
		identity: { type: "customer" | "anonymous"; id: string },
		resource: unknown,
	): boolean {
		if (identity.type !== "customer") {
			return false;
		}
		const businessUnit = resource as {
			associates?: { customer: { id: string } }[];
			inheritedAssociates?: { customer: { id: string } }[];
		};
		return [
			...(businessUnit.associates ?? []),
			...(businessUnit.inheritedAssociates ?? []),
		].some((associate) => associate.customer.id === identity.id);
	}

	getBasePath() {
		return "me";
	}

	registerRoutes(parent: FastifyInstance) {
		// Overwrite this function to be able to handle /me/business-units path.
		const basePath = this.getBasePath();
		parent.register(
			(instance, opts, done) => {
				this.extraRoutes(instance);

				instance.get("/business-units", this.get.bind(this));
				instance.get("/business-units/key=:key", this.getWithKey.bind(this));
				instance.get("/business-units/:id", this.getWithId.bind(this));

				instance.delete(
					"/business-units/key=:key",
					this.deleteWithKey.bind(this),
				);
				instance.delete("/business-units/:id", this.deleteWithId.bind(this));

				instance.post("/business-units", this.post.bind(this));
				instance.post("/business-units/key=:key", this.postWithKey.bind(this));
				instance.post("/business-units/:id", this.postWithId.bind(this));

				done();
			},
			{ prefix: `/${basePath}` },
		);
	}
}
