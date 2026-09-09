using po from '../db/schema';

@requires: 'authenticated-user'
service PurchaseOrderService {

    entity ApprovedPurchaseRequests {
        key requestNumber : String(20);
        requesterName     : String(100);
        department        : String(100);
        requestDate       : Date;
        currency          : String(3);
        totalAmount       : Decimal(15,2);
        status            : String(20);
    }

    @odata.draft.enabled
    entity PurchaseOrders as projection on po.PurchaseOrders
        actions {

            action submit() returns PurchaseOrders;

            action approve(comments: String) returns PurchaseOrders;

            action reject(reason: String) returns PurchaseOrders;

            action cancel() returns PurchaseOrders;

            action issue() returns PurchaseOrders;

            action complete() returns PurchaseOrders;

        };

    entity PurchaseOrderItems
        as projection on po.PurchaseOrderItems;

    entity Vendors
        as projection on po.Vendors;

    entity CompanyCodes
        as projection on po.CompanyCodes;

    entity Currencies
        as projection on po.Currencies;

    entity PurchasingOrganizations
        as projection on po.PurchasingOrganizations;

    entity PurchasingGroups
        as projection on po.PurchasingGroups;

    entity PurchaseOrderAuditLogs 
        as projection on po.PurchaseOrderAuditLogs;

}