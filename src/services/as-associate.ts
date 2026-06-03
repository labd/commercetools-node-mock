import type { FastifyInstance } from "fastify";
import type {
	AsAssociateBusinessUnitRepository,
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
	AsAssociateQuoteRequestRepository,
	AsAssociateShoppingListRepository,
} from "#src/repositories/as-associate.ts";
import { AsAssociateBusinessUnitService } from "./as-associate-business-unit.ts";
import { AsAssociateCartService } from "./as-associate-cart.ts";
import { AsAssociateOrderService } from "./as-associate-order.ts";
import { AsAssociateQuoteRequestService } from "./as-associate-quote-request.ts";
import { AsAssociateShoppingListService } from "./as-associate-shopping-list.ts";

type Repositories = {
	"business-unit": AsAssociateBusinessUnitRepository;
	cart: AsAssociateCartRepository;
	order: AsAssociateOrderRepository;
	"quote-request": AsAssociateQuoteRequestRepository;
	"shopping-list": AsAssociateShoppingListRepository;
};

export class AsAssociateService {
	subServices!: {
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

						this.subServices = {
							"business-unit": businessUnitService,
							order,
							cart,
							"quote-request": quoteRequest,
							"shopping-list": shoppingList,
						};
						scopedDone();
					},
					{ prefix: "/in-business-unit/key=:businessUnitId" },
				);

				done();
			},
			{
				prefix: "/as-associate/:associateId",
			},
		);
	}
}
