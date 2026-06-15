import { ApprovalFlowRepository } from "./approval-flow.ts";
import { ApprovalRuleRepository } from "./approval-rule.ts";
import { BusinessUnitRepository } from "./business-unit.ts";
import { CartRepository } from "./cart/index.ts";
import { OrderRepository } from "./order/index.ts";
import { QuoteRequestRepository } from "./quote-request/index.ts";
import { ShoppingListRepository } from "./shopping-list/index.ts";

export class AsAssociateOrderRepository extends OrderRepository {}
export class AsAssociateCartRepository extends CartRepository {}
export class AsAssociateQuoteRequestRepository extends QuoteRequestRepository {}
export class AsAssociateShoppingListRepository extends ShoppingListRepository {}
export class AsAssociateBusinessUnitRepository extends BusinessUnitRepository {}
export class AsAssociateApprovalFlowRepository extends ApprovalFlowRepository {}
export class AsAssociateApprovalRuleRepository extends ApprovalRuleRepository {}
