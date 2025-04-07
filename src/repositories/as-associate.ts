import { CartRepository } from "./cart";
import { OrderRepository } from "./order";
import { QuoteRequestRepository } from "./quote-request";

export class AsAssociateOrderRepository extends OrderRepository {}
export class AsAssociateCartRepository extends CartRepository {}
export class AsAssociateQuoteRequestRepository extends QuoteRequestRepository {}
