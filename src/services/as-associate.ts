import { Router } from "express";
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
	router: Router;

	subServices: {
		cart: AsAssociateCartService;
		order: AsAssociateOrderService;
		"quote-request": AsAssociateQuoteRequestService;
		"shopping-list": AsAssociateShoppingListService;
	};

	constructor(parent: Router, repositories: Repositories) {
		this.router = Router({ mergeParams: true });

		this.subServices = {
			order: new AsAssociateOrderService(this.router, repositories.order),
			cart: new AsAssociateCartService(this.router, repositories.cart),
			"quote-request": new AsAssociateQuoteRequestService(
				this.router,
				repositories["quote-request"],
			),
			"shopping-list": new AsAssociateShoppingListService(
				this.router,
				repositories["shopping-list"],
			),
		};
		parent.use(
			"/as-associate/:associateId/in-business-unit/key=:businessUnitId",
			this.router,
		);
	}
}
