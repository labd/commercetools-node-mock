import type { FastifyInstance } from "fastify";
import { SHOPPING_LIST_PERMISSIONS } from "#src/associate-permissions.ts";
import type { AsAssociateShoppingListRepository } from "#src/repositories/as-associate.ts";
import AbstractAssociateService, {
	type AssociateResourceRules,
} from "./abstract-associate.ts";

export class AsAssociateShoppingListService extends AbstractAssociateService {
	public repository: AsAssociateShoppingListRepository;

	protected rules: AssociateResourceRules = {
		view: SHOPPING_LIST_PERMISSIONS.view,
		create: SHOPPING_LIST_PERMISSIONS.create,
		update: SHOPPING_LIST_PERMISSIONS.update,
		delete: SHOPPING_LIST_PERMISSIONS.delete,
		businessUnitWhere: (key) => `businessUnit(key="${key}")`,
		ownerWhere: (associateId) => `customer(id="${associateId}")`,
		ownerOf: (list) => list.customer?.id,
		businessUnitOf: (list) => list.businessUnit?.key,
		ownerOfDraft: (draft) => draft.customer?.id,
		stampDraft: (draft, scope) => ({
			...draft,
			customer: draft.customer ?? { typeId: "customer", id: scope.associateId },
			businessUnit: draft.businessUnit ?? {
				typeId: "business-unit",
				key: scope.businessUnitKey,
			},
		}),
	};

	constructor(
		parent: FastifyInstance,
		repository: AsAssociateShoppingListRepository,
	) {
		super(parent);
		this.repository = repository;
	}

	getBasePath() {
		return "shopping-lists";
	}
}
