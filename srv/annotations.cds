using PurchaseOrderService from './po-service';

annotate PurchaseOrderService.PurchaseOrders with @(
    UI.HeaderInfo                       : {
        TypeName      : 'Purchase Order',
        TypeNamePlural: 'Purchase Orders',
        Title         : {
            $Type   : 'UI.DataField',
            Label   : 'PO Number',
            Value   : poNumber,
            readonly: true
        },
        Description   : {
            $Type: 'UI.DataField',
            Label: 'Vendor',
            Value: vendor
        }
    },

    UI.LineItem                         : [
        {
            $Type: 'UI.DataField',
            Value: poNumber,
            Label: 'PO Number'
        },
        {
            $Type: 'UI.DataField',
            Value: prNumber,
            Label: 'PR Number'
        },
        {
            $Type: 'UI.DataField',
            Value: vendor,
            Label: 'Vendor'
        },
        {
            $Type: 'UI.DataField',
            Value: poDate,
            Label: 'PO Date'
        },
        {
            $Type: 'UI.DataField',
            Value: deliveryDate,
            Label: 'Delivery Date'
        },
        {
            $Type: 'UI.DataField',
            Value: currency,
            Label: 'Currency'
        },
        {
            $Type: 'UI.DataField',
            Value: totalAmount,
            Label: 'Total Amount'
        },
        {
            $Type: 'UI.DataField',
            Value: status,
            Label: 'Status'
        }
    ],

    UI.Facets                           : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'POInformationFacet',
            Label : 'PO Information',
            Target: '@UI.FieldGroup#POInformation'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'VendorInformationFacet',
            Label : 'Vendor Information',
            Target: '@UI.FieldGroup#VendorInformation'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'PurchasingInformationFacet',
            Label : 'Purchasing Information',
            Target: '@UI.FieldGroup#PurchasingInformation'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'DeliveryInformationFacet',
            Label : 'Delivery Information',
            Target: '@UI.FieldGroup#DeliveryInformation'
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ItemsFacet',
            Label : 'Purchase Order Items',
            Target: 'items/@UI.LineItem'
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Audit Log',
            Target: 'auditLogs/@UI.LineItem'
        }
    ],

    UI.FieldGroup #POInformation        : {
        $Type: 'UI.FieldGroupType',
        Data : [
            // {
            //     $Type : 'UI.DataField',
            //     Value : poNumber,
            //     Label : 'PO Number'
            // },
            {
                $Type: 'UI.DataField',
                Value: prNumber,
                Label: 'PR Number'
            },
            {
                $Type: 'UI.DataField',
                Value: poDate,
                Label: 'PO Date'
            },
            {
                $Type: 'UI.DataField',
                Value: status,
                Label: 'Status'
            }
        ]
    },

    UI.FieldGroup #VendorInformation    : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: vendor,
                Label: 'Vendor'
            },
            {
                $Type: 'UI.DataField',
                Value: vendorContact,
                Label: 'Vendor Contact'
            }
        ]
    },

    UI.FieldGroup #PurchasingInformation: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: companyCode,
                Label: 'Company Code'
            },
            {
                $Type: 'UI.DataField',
                Value: purchasingOrg,
                Label: 'Purchasing Organization'
            },
            {
                $Type: 'UI.DataField',
                Value: purchasingGroup,
                Label: 'Purchasing Group'
            },
            {
                $Type: 'UI.DataField',
                Value: currency,
                Label: 'Currency'
            }
        ]
    },

    UI.FieldGroup #DeliveryInformation  : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: deliveryDate,
                Label: 'Delivery Date'
            },
            {
                $Type: 'UI.DataField',
                Value: totalAmount,
                Label: 'Total Amount'
            }
        ]
    }
);


annotate PurchaseOrderService.PurchaseOrderItems with @(UI.LineItem: [
    {
        $Type: 'UI.DataField',
        Value: itemNumber,
        Label: 'Item'
    },
    {
        $Type: 'UI.DataField',
        Value: materialNumber,
        Label: 'Material Number'
    },
    {
        $Type: 'UI.DataField',
        Value: description,
        Label: 'Description'
    },
    {
        $Type: 'UI.DataField',
        Value: quantity,
        Label: 'Quantity'
    },
    {
        $Type: 'UI.DataField',
        Value: unit,
        Label: 'Unit'
    },
    {
        $Type: 'UI.DataField',
        Value: unitPrice,
        Label: 'Unit Price'
    },
    {
        $Type: 'UI.DataField',
        Value: netAmount,
        Label: 'Net Amount'
    },
    {
        $Type: 'UI.DataField',
        Value: taxPercent,
        Label: 'Tax %'
    },
    {
        $Type: 'UI.DataField',
        Value: taxAmount,
        Label: 'Tax Amount'
    },
    {
        $Type: 'UI.DataField',
        Value: grossAmount,
        Label: 'Gross Amount'
    },
    {
        $Type: 'UI.DataField',
        Value: deliveryDate,
        Label: 'Delivery Date'
    }
]);

annotate PurchaseOrderService.PurchaseOrderItems with @(
    UI.HeaderInfo                   : {
        TypeName      : 'Purchase Order Item',
        TypeNamePlural: 'Purchase Order Items',
        Title         : {
            $Type: 'UI.DataField',
            Value: description,
            Label: 'Description'
        },
        Description   : {
            $Type: 'UI.DataField',
            Value: materialNumber,
            Label: 'Material Number'
        }
    },

    UI.Facets                       : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ItemInformationFacet',
            Label : 'Item Information',
            Target: '@UI.FieldGroup#ItemInformation'
        },

        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'AmountInformationFacet',
            Label : 'Amount Information',
            Target: '@UI.FieldGroup#AmountInformation'
        },

        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'ItemDeliveryFacet',
            Label : 'Delivery Information',
            Target: '@UI.FieldGroup#ItemDelivery'
        }
    ],

    UI.FieldGroup #ItemInformation  : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: itemNumber,
                Label: 'Item Number'
            },
            {
                $Type: 'UI.DataField',
                Value: materialNumber,
                Label: 'Material Number'
            },
            {
                $Type: 'UI.DataField',
                Value: description,
                Label: 'Description'
            },
            {
                $Type: 'UI.DataField',
                Value: quantity,
                Label: 'Quantity'
            },
            {
                $Type: 'UI.DataField',
                Value: unit,
                Label: 'Unit'
            }
        ]
    },

    UI.FieldGroup #AmountInformation: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: unitPrice,
                Label: 'Unit Price'
            },
            {
                $Type: 'UI.DataField',
                Value: netAmount,
                Label: 'Net Amount'
            },
            {
                $Type: 'UI.DataField',
                Value: taxPercent,
                Label: 'Tax %'
            },
            {
                $Type: 'UI.DataField',
                Value: taxAmount,
                Label: 'Tax Amount'
            },
            {
                $Type: 'UI.DataField',
                Value: grossAmount,
                Label: 'Gross Amount'
            }
        ]
    },

    UI.FieldGroup #ItemDelivery     : {
        $Type: 'UI.FieldGroupType',
        Data : [{
            $Type: 'UI.DataField',
            Value: deliveryDate,
            Label: 'Delivery Date'
        }]
    }
);

annotate PurchaseOrderService.PurchaseOrders with {
    poNumber @UI.ReadOnly;
    status   @UI.ReadOnly;

};

annotate PurchaseOrderService.PurchaseOrders with {
    poNumber @Core.Computed;
};


annotate PurchaseOrderService.PurchaseOrders with {
    vendor           @Common.ValueListWithFixedValues: true  @Common.ValueList: {
        Label         : 'Vendor',
        CollectionPath: 'Vendors',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: vendor,
                ValueListProperty: 'vendorCode'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'vendorName'
            }
        ]
    };

    companyCode      @Common.ValueListWithFixedValues: true  @Common.ValueList: {
        Label         : 'Company Code',
        CollectionPath: 'CompanyCodes',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: companyCode,
                ValueListProperty: 'companyCode'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'companyName'
            }
        ]
    };

    currency         @Common.ValueListWithFixedValues: true  @Common.ValueList: {
        Label         : 'Currency',
        CollectionPath: 'Currencies',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: currency,
                ValueListProperty: 'currencyCode'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'currencyName'
            }
        ]
    };

    purchasingOrg    @Common.ValueListWithFixedValues: true  @Common.ValueList: {
        Label         : 'Purchasing Organizations',
        CollectionPath: 'PurchasingOrganizations',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: purchasingOrg,
                ValueListProperty: 'purchasingOrg'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'purchasingOrgName'
            }
        ]
    };

    purchasingGroup  @Common.ValueListWithFixedValues: true  @Common.ValueList: {
        Label         : 'Purchasing Group',
        CollectionPath: 'PurchasingGroups',
        Parameters    : [
            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: purchasingGroup,
                ValueListProperty: 'purchasingGroup'
            },
            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'purchasingGroupName'
            }
        ]
    };
};


annotate PurchaseOrderService.PurchaseOrders with @(
    UI.HeaderInfo    : {
        TypeName      : 'Purchase Order',
        TypeNamePlural: 'Purchase Orders',

        Title         : {
            $Type   : 'UI.DataField',
            Label   : 'PO Number',
            Value   : poNumber,
            readonly: true
        },

        Description   : {
            $Type: 'UI.DataField',
            Label: 'Vendor',
            Value: vendor
        }
    },

    UI.Identification: [
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'PurchaseOrderService.submit',
            Label : 'Submit',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'PurchaseOrderService.approve',
            Label : 'Approve',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'PurchaseOrderService.reject',
            Label : 'Reject',
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action: 'PurchaseOrderService.cancel',
            Label : 'Cancel',
        },

        {
            $Type : 'UI.DataFieldForAction',
            Action: 'PurchaseOrderService.issue',
            Label : 'Issue',
        },

        {
            $Type : 'UI.DataFieldForAction',
            Action: 'PurchaseOrderService.complete',
            Label : 'Complete',
        }
    ],

    UI.LineItem      : [
        {
            $Type: 'UI.DataField',
            Value: poNumber,
            Label: 'PO Number'
        },
        {
            $Type: 'UI.DataField',
            Value: prNumber,
            Label: 'PR Number'
        },
        {
            $Type: 'UI.DataField',
            Value: vendor,
            Label: 'Vendor'
        },
        {
            $Type: 'UI.DataField',
            Value: poDate,
            Label: 'PO Date'
        },
        {
            $Type: 'UI.DataField',
            Value: deliveryDate,
            Label: 'Delivery Date'
        },
        {
            $Type: 'UI.DataField',
            Value: currency,
            Label: 'Currency'
        },
        {
            $Type: 'UI.DataField',
            Value: totalAmount,
            Label: 'Total Amount'
        },
        {
            $Type: 'UI.DataField',
            Value: status,
            Label: 'Status'
        }
    ],

);

annotate PurchaseOrderService.PurchaseOrderItems with {
    netAmount   @Common.FieldControl: #ReadOnly;
    taxAmount   @Common.FieldControl: #ReadOnly;
    grossAmount @Common.FieldControl: #ReadOnly;
};

annotate PurchaseOrderService.PurchaseOrders with {
    status      @Common.FieldControl: #ReadOnly;
    poNumber    @Common.FieldControl: #ReadOnly;
    totalAmount @Common.FieldControl: #ReadOnly;
};

annotate PurchaseOrderService.PurchaseOrders with {

    prNumber @Common.ValueList: {
        $Type         : 'Common.ValueListType',
        CollectionPath: 'ApprovedPurchaseRequests',

        Parameters    : [

            {
                $Type            : 'Common.ValueListParameterInOut',
                LocalDataProperty: prNumber,
                ValueListProperty: 'requestNumber'
            },

            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'requesterName'
            },

            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'department'
            },

            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'requestDate'
            },

            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'currency'
            },

            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'totalAmount'
            },

            {
                $Type            : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty: 'status'
            }
        ]
    };

};

annotate PurchaseOrderService.ApprovedPurchaseRequests with @UI.LineItem: [
    {
        $Type: 'UI.DataField',
        Value: requestNumber,
        Label: 'PR Number'
    },
    {
        $Type: 'UI.DataField',
        Value: requesterName,
        Label: 'Requester'
    },
    {
        $Type: 'UI.DataField',
        Value: department,
        Label: 'Department'
    },
    {
        $Type: 'UI.DataField',
        Value: requestDate,
        Label: 'Request Date'
    },
    {
        $Type: 'UI.DataField',
        Value: currency,
        Label: 'Currency'
    },
    {
        $Type: 'UI.DataField',
        Value: totalAmount,
        Label: 'Total Amount'
    },
    {
        $Type: 'UI.DataField',
        Value: status,
        Label: 'Status'
    }
];

annotate PurchaseOrderService.PurchaseOrderAuditLogs with @UI.LineItem: [

    {
        $Type : 'UI.DataField',
        Value : action,
        Label : 'Action'
    },

    {
        $Type : 'UI.DataField',
        Value : oldStatus,
        Label : 'Old Status'
    },

    {
        $Type : 'UI.DataField',
        Value : newStatus,
        Label : 'New Status'
    },

    {
        $Type : 'UI.DataField',
        Value : performedBy,
        Label : 'Performed By'
    },

    {
        $Type : 'UI.DataField',
        Value : performedRole,
        Label : 'Role'
    },

    {
        $Type : 'UI.DataField',
        Value : remarks,
        Label : 'Remarks'
    },

    {
        $Type : 'UI.DataField',
        Value : eventTime,
        Label : 'Event Time'
    }

];
