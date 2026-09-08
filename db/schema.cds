namespace po;

using { cuid, managed } from '@sap/cds/common';

entity PurchaseOrders : cuid, managed {

    poNumber          : String(20);

    @mandatory
    prNumber          : String(20);

    @mandatory
    vendor            : String(100);
    @mandatory
    vendorContact     : String(100);

    @mandatory
    companyCode       : String(10);

    @mandatory
    purchasingOrg     : String(10);

    @mandatory
    purchasingGroup   : String(10);

    @mandatory
    poDate            : Date;

    @mandatory
    deliveryDate      : Date;

    currency          : String(3);

    totalAmount       : Decimal(15,2);

    status            : String(20) default 'Draft';

    approvalComments  : String(500);
    rejectionComments : String(500);

    virtual hideSubmit : Boolean;
    virtual hideApprove : Boolean;
    virtual hideReject : Boolean;

    @mandatory
    items : Composition of many PurchaseOrderItems
        on items.parent = $self;
}


entity PurchaseOrderItems : cuid ,{

    parent         : Association to PurchaseOrders;
    @mandatory
    itemNumber     : Integer;
    @mandatory
    materialNumber : String(40);
    @mandatory
    description    : String(255);
    @mandatory
    quantity       : Integer;
    @mandatory
    unit           : String(10);
    @mandatory
    unitPrice      : Decimal(15,2);

    netAmount      : Decimal(15,2);

    taxPercent     : Decimal(5,2);

    taxAmount      : Decimal(15,2);

    grossAmount    : Decimal(15,2);
    @mandatory
    deliveryDate   : Date;
}

entity Vendors {
    key vendorCode : String(10);
    vendorName     : String(100);
}

entity CompanyCodes {
    key companyCode : String(10);
    companyName     : String(100);
}

entity Currencies {
    key currencyCode : String(3);
    currencyName     : String(50);
}

entity PurchasingOrganizations {
    key purchasingOrg : String(10);
    purchasingOrgName : String(100);
}

entity PurchasingGroups {
    key purchasingGroup : String(10);
    purchasingGroupName : String(100);
}