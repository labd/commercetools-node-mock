import type { FastifyInstance } from "fastify";
import { CART_PERMISSIONS } from "#src/associate-permissions.ts";
import type { AsAssociateCartRepository } from "#src/repositories/as-associate.ts";
import AbstractAssociateService, {
	type AssociateResourceRules,
} from "./abstract-associate.ts";

export class AsAssociateCartService extends AbstractAssociateService {
	public repository: AsAssociateCartRepository;

	protected rules: AssociateResourceRules = {
		view: CART_PERMISSIONS.view,
		create: CART_PERMISSIONS.create,
		update: CART_PERMISSIONS.update,
		delete: CART_PERMISSIONS.delete,
		businessUnitWhere: (key) => `businessUnit(key="${key}")`,
		ownerWhere: (associateId) => `customerId="${associateId}"`,
		ownerOf: (cart) => cart.customerId,
		businessUnitOf: (cart) => cart.businessUnit?.key,
		ownerOfDraft: (draft) => draft.customerId,
		stampDraft: (draft, scope) => ({
			...draft,
			customerId: draft.customerId ?? scope.associateId,
			businessUnit: draft.businessUnit ?? {
				typeId: "business-unit",
				key: scope.businessUnitKey,
			},
		}),
	};

	constructor(parent: FastifyInstance, repository: AsAssociateCartRepository) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "carts";
	}
}
