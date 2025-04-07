import { Router } from "express";
import type {
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
	AsAssociateQuoteRequestRepository,
} from "~src/repositories/as-associate";
import { AsAssociateCartService } from "./as-associate-cart";
import { AsAssociateOrderService } from "./as-associate-order";
import { AsAssociateQuoteRequestService } from "./as-associate-quote-request";

type Repositories = {
	cart: AsAssociateCartRepository;
	order: AsAssociateOrderRepository;
	"quote-request": AsAssociateQuoteRequestRepository;
};

export class AsAssociateService {
	router: Router;

	subServices: {
		cart: AsAssociateCartService;
		order: AsAssociateOrderService;
		"quote-request": AsAssociateQuoteRequestService;
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
		};
		parent.use(
			"/as-associate/:associateId/in-business-unit/key=:businessUnitId",
			this.router,
		);
	}
}
