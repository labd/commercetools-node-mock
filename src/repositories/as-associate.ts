import { CartRepository } from "./cart/index.ts";
import { OrderRepository } from "./order/index.ts";
import { QuoteRequestRepository } from "./quote-request/index.ts";
import { ShoppingListRepository } from "./shopping-list/index.ts";

export class AsAssociateOrderRepository extends OrderRepository {}
export class AsAssociateCartRepository extends CartRepository {}
export class AsAssociateQuoteRequestRepository extends QuoteRequestRepository {}
export class AsAssociateShoppingListRepository extends ShoppingListRepository {}
