import type { FastifyInstance } from "fastify";
import type {
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
	AsAssociateQuoteRequestRepository,
	AsAssociateShoppingListRepository,
} from "#src/repositories/as-associate.ts";
import { AsAssociateCartService } from "./as-associate-cart.ts";
import { AsAssociateOrderService } from "./as-associate-order.ts";
import { AsAssociateQuoteRequestService } from "./as-associate-quote-request.ts";
import { AsAssociateShoppingListService } from "./as-associate-shopping-list.ts";

type Repositories = {
	cart: AsAssociateCartRepository;
	order: AsAssociateOrderRepository;
	"quote-request": AsAssociateQuoteRequestRepository;
	"shopping-list": AsAssociateShoppingListRepository;
};

export class AsAssociateService {
	subServices!: {
		cart: AsAssociateCartService;
		order: AsAssociateOrderService;
		"quote-request": AsAssociateQuoteRequestService;
		"shopping-list": AsAssociateShoppingListService;
	};

	constructor(parent: FastifyInstance, repositories: Repositories) {
		parent.register(
			(instance, opts, done) => {
				this.subServices = {
					order: new AsAssociateOrderService(instance, repositories.order),
					cart: new AsAssociateCartService(instance, repositories.cart),
					"quote-request": new AsAssociateQuoteRequestService(
						instance,
						repositories["quote-request"],
					),
					"shopping-list": new AsAssociateShoppingListService(
						instance,
						repositories["shopping-list"],
					),
				};
				done();
			},
			{
				prefix:
					"/as-associate/:associateId/in-business-unit/key=:businessUnitId",
			},
		);
	}
}
