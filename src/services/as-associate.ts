import type { FastifyInstance } from "fastify";
import type {
	AsAssociateApprovalFlowRepository,
	AsAssociateApprovalRuleRepository,
	AsAssociateBusinessUnitRepository,
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
	AsAssociateQuoteRequestRepository,
	AsAssociateShoppingListRepository,
} from "#src/repositories/as-associate.ts";
import { AsAssociateApprovalFlowService } from "./as-associate-approval-flow.ts";
import { AsAssociateApprovalRuleService } from "./as-associate-approval-rule.ts";
import { AsAssociateBusinessUnitService } from "./as-associate-business-unit.ts";
import { AsAssociateCartService } from "./as-associate-cart.ts";
import { AsAssociateOrderService } from "./as-associate-order.ts";
import { AsAssociateQuoteRequestService } from "./as-associate-quote-request.ts";
import { AsAssociateShoppingListService } from "./as-associate-shopping-list.ts";

type Repositories = {
	"approval-flow": AsAssociateApprovalFlowRepository;
	"approval-rule": AsAssociateApprovalRuleRepository;
	"business-unit": AsAssociateBusinessUnitRepository;
	cart: AsAssociateCartRepository;
	order: AsAssociateOrderRepository;
	"quote-request": AsAssociateQuoteRequestRepository;
	"shopping-list": AsAssociateShoppingListRepository;
};

export class AsAssociateService {
	subServices!: {
		"approval-flow": AsAssociateApprovalFlowService;
		"approval-rule": AsAssociateApprovalRuleService;
		"business-unit": AsAssociateBusinessUnitService;
		cart: AsAssociateCartService;
		order: AsAssociateOrderService;
		"quote-request": AsAssociateQuoteRequestService;
		"shopping-list": AsAssociateShoppingListService;
	};

	constructor(parent: FastifyInstance, repositories: Repositories) {
		parent.register(
			(instance, opts, done) => {
				const businessUnitService = new AsAssociateBusinessUnitService(
					instance,
					repositories["business-unit"],
				);

				instance.register(
					(scoped, _opts, scopedDone) => {
						const order = new AsAssociateOrderService(
							scoped,
							repositories.order,
						);
						const cart = new AsAssociateCartService(scoped, repositories.cart);
						const quoteRequest = new AsAssociateQuoteRequestService(
							scoped,
							repositories["quote-request"],
						);
						const shoppingList = new AsAssociateShoppingListService(
							scoped,
							repositories["shopping-list"],
						);
						const approvalFlow = new AsAssociateApprovalFlowService(
							scoped,
							repositories["approval-flow"],
						);
						const approvalRule = new AsAssociateApprovalRuleService(
							scoped,
							repositories["approval-rule"],
						);

						this.subServices = {
							"approval-flow": approvalFlow,
							"approval-rule": approvalRule,
							"business-unit": businessUnitService,
							order,
							cart,
							"quote-request": quoteRequest,
							"shopping-list": shoppingList,
						};
						scopedDone();
					},
					{ prefix: "/in-business-unit/key=:businessUnitKey" },
				);

				done();
			},
			{
				prefix: "/as-associate/:associateId",
			},
		);
	}
}
