import { Router } from "express";
import type {
	AsAssociateCartRepository,
	AsAssociateOrderRepository,
} from "~src/repositories/as-associate";
import { AsAssociateCartService } from "./as-associate-cart";
import { AsAssociateOrderService } from "./as-associate-order";

type Repositories = {
	cart: AsAssociateCartRepository;
	order: AsAssociateOrderRepository;
};

export class AsAssociateService {
	router: Router;

	subServices: {
		cart: AsAssociateCartService;
		order: AsAssociateOrderService;
	};

	constructor(parent: Router, repositories: Repositories) {
		this.router = Router({ mergeParams: true });

		this.subServices = {
			order: new AsAssociateOrderService(this.router, repositories.order),
			cart: new AsAssociateCartService(this.router, repositories.cart),
		};
		parent.use(
			"/as-associate/:associateId/in-business-unit/key=:businessUnitId",
			this.router,
		);
	}
}
