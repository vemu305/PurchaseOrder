const cds = require('@sap/cds');
const axios = require('axios');

module.exports = cds.service.impl(async function () {

    console.log("=================================");
    console.log("Purchase Order Service JS Loaded");
    console.log("=================================");


    const {
        PurchaseOrders,
        PurchaseOrderItems,
        PurchaseOrderAuditLogs
    } = this.entities;


    async function createAuditLog(req, data) {

        await INSERT.into(PurchaseOrderAuditLogs).entries({

            purchaseOrder_ID: data.purchaseOrderID,

            poNumber: data.poNumber || "",

            prNumber: data.prNumber || "",

            action: data.action,

            oldStatus: data.oldStatus || "",

            newStatus: data.newStatus || "",

            performedBy:
                req?.user?.id ||
                "anonymous",

            performedRole:
                data.role ||
                getUserRole(req),

            remarks:
                data.remarks ||
                "",

            eventTime: new Date()

        });

    }

    async function getPRAccessToken() {
        const response = await axios.post(
            process.env.PR_TOKEN_URL,
            new URLSearchParams({
                grant_type: 'client_credentials'
            }).toString(),
            {
                auth: {
                    username: process.env.PR_CLIENT_ID,
                    password: process.env.PR_CLIENT_SECRET
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data.access_token;
    }


    async function fetchApprovedPRs() {

        const accessToken = await getPRAccessToken();

        console.log("----------============------------", accessToken);


        // IMPORTANT:
        // Build the OData filter directly in the URL.
        const url =
            `${process.env.PR_SERVICE_URL}?$filter=status%20eq%20%27approved%27`;

        console.log('PR API URL:', url);

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json'
            }
        });

        console.log(
            'Approved PR count:',
            response.data.value?.length || 0
        );

        return response.data.value || [];
    }

    async function calculatePOTotal(poID) {

        const items = await SELECT
            .from(PurchaseOrderItems)
            .where({ parent_ID: poID });

        let totalAmount = 0;

        for (const item of items) {

            calculateItem(item);

            totalAmount += Number(item.grossAmount || 0);
        }

        totalAmount = Number(totalAmount.toFixed(2));

        await UPDATE(PurchaseOrders)
            .set({
                totalAmount: totalAmount
            })
            .where({ ID: poID });

        console.log("PO TOTAL CALCULATED:", totalAmount);

        return totalAmount;
    }


    function calculateItem(item) {

        const quantity =
            Number(item.quantity || 0);

        const unitPrice =
            Number(item.unitPrice || 0);

        // If taxPercent is not entered, use 18%
        const taxPercent =
            Number(
                item.taxPercent !== undefined &&
                    item.taxPercent !== null
                    ? item.taxPercent
                    : 18
            );

        const netAmount =
            quantity * unitPrice;

        const taxAmount =
            netAmount * taxPercent / 100;

        const grossAmount =
            netAmount + taxAmount;


        item.netAmount =
            Number(netAmount.toFixed(2));

        item.taxAmount =
            Number(taxAmount.toFixed(2));

        item.grossAmount =
            Number(grossAmount.toFixed(2));


        return item;
    }


    function getPOId(req) {

        return (
            req.params?.[0]?.ID ||
            req.data?.ID ||
            req.data?.id
        );

    }

    async function recalculatePOTotal(POID, req) {

        if (!POID)
            return 0;


        const items =
            await SELECT
                .from(PurchaseOrderItems)
                .where({
                    parent_ID: POID
                });


        let totalAmount = 0;


        for (const item of items) {

            // Recalculate the item
            calculateItem(item);


            // Add gross amount to PO total
            totalAmount +=
                Number(item.grossAmount || 0);

        }


        totalAmount =
            Number(totalAmount.toFixed(2));


        // Update PO header
        await UPDATE(PurchaseOrders)
            .set({
                totalAmount: totalAmount
            })
            .where({
                ID: POID
            });


        console.log(
            `PO ${POID} Total Amount recalculated: ${totalAmount}`
        );


        return totalAmount;
    }

    function getUserRole(req) {

        if (req.user.is('Director'))
            return 'Director';


        if (req.user.is('SeniorManager'))
            return 'Senior Manager';


        if (req.user.is('Manager'))
            return 'Manager';


        return 'Employee';

    }

    this.on('submit', async (req) => {

        console.log("");
        console.log("=================================");
        console.log("SUBMIT PURCHASE ORDER");
        console.log("=================================");


        const ID =
            getPOId(req);


        console.log("PO ID:", ID);
        console.log("User:", req.user.id);
        console.log("Roles:", req.user.roles);


        if (!ID) {

            return req.error(
                400,
                "Purchase Order ID is missing."
            );

        }


        // =====================================================
        // GET PO
        // =====================================================

        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po) {

            return req.error(
                404,
                "Purchase Order not found."
            );

        }


        console.log(
            "PO Number:",
            po.poNumber
        );

        console.log(
            "Current Status:",
            po.status
        );


        // =====================================================
        // ONLY DRAFT CAN BE SUBMITTED
        // =====================================================

        if (po.status !== "Draft") {

            return req.error(
                400,
                `Only Draft Purchase Orders can be submitted. Current status: ${po.status}`
            );

        }

        await createAuditLog(req, {

            purchaseOrderID: ID,

            poNumber: po.poNumber,

            prNumber: po.prNumber,

            action: "SUBMITTED",

            oldStatus: po.status,

            newStatus: "Submitted",

            role: getUserRole(req),

            remarks: "Purchase Order submitted for approval"

        });


        // =====================================================
        // GET ITEMS
        // =====================================================

        const items =
            await SELECT
                .from(PurchaseOrderItems)
                .where({
                    parent_ID: ID
                });


        console.log(
            "Number of PO Items:",
            items.length
        );


        // =====================================================
        // AT LEAST ONE ITEM REQUIRED
        // =====================================================

        if (!items || items.length === 0) {

            return req.error(
                400,
                "At least one Purchase Order item is required."
            );

        }


        // =====================================================
        // DUPLICATE MATERIAL CHECK
        // =====================================================

        const materialNumbers =
            new Set();


        for (const item of items) {

            if (
                item.materialNumber &&
                materialNumbers.has(
                    item.materialNumber
                )
            ) {

                return req.error(
                    400,
                    `Duplicate Material Number '${item.materialNumber}' is not allowed.`
                );

            }


            if (item.materialNumber) {

                materialNumbers.add(
                    item.materialNumber
                );

            }

        }


        // =====================================================
        // CALCULATE ALL ITEM AMOUNTS
        // =====================================================

        let totalAmount = 0;


        for (const item of items) {

            // Calculate:
            // Quantity × Unit Price = Net
            // Net × Tax % = Tax
            // Net + Tax = Gross

            calculateItem(item);


            console.log(
                `Item ${item.itemNumber}:`,
                {
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxPercent: item.taxPercent,
                    netAmount: item.netAmount,
                    taxAmount: item.taxAmount,
                    grossAmount: item.grossAmount
                }
            );


            // Save calculated item amounts

            await UPDATE(PurchaseOrderItems)
                .set({
                    netAmount:
                        item.netAmount,

                    taxAmount:
                        item.taxAmount,

                    grossAmount:
                        item.grossAmount
                })
                .where({
                    ID: item.ID
                });


            // Add Gross Amount to PO Total

            totalAmount +=
                Number(
                    item.grossAmount || 0
                );

        }


        totalAmount =
            Number(
                totalAmount.toFixed(2)
            );


        console.log(
            "Calculated PO Total:",
            totalAmount
        );


        // =====================================================
        // CHANGE STATUS
        // =====================================================

        await UPDATE(PurchaseOrders)
            .set({
                status: "Submitted",
                totalAmount: totalAmount
            })
            .where({
                ID
            });


        console.log(
            `Purchase Order ${po.poNumber} changed from Draft to Submitted`
        );


        // =====================================================
        // RETURN UPDATED PO
        // =====================================================

        const updatedPO =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        return updatedPO;

    });



    this.on('approve', async (req) => {

        console.log("");
        console.log("=================================");
        console.log("APPROVE PURCHASE ORDER");
        console.log("=================================");


        const ID =
            getPOId(req);


        const comments =
            req.data?.comments ||
            req.data?.approvalComments ||
            "";


        console.log("PO ID:", ID);
        console.log("User:", req.user.id);
        console.log("Roles:", req.user.roles);


        if (!ID) {

            return req.error(
                400,
                "Purchase Order ID is missing."
            );

        }


        // =====================================================
        // GET PO
        // =====================================================

        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po) {

            return req.error(
                404,
                "Purchase Order not found."
            );

        }


        console.log(
            "PO Number:",
            po.poNumber
        );


        console.log(
            "Current Status:",
            po.status
        );


        // =====================================================
        // ONLY SUBMITTED CAN BE APPROVED
        // =====================================================

        if (
            po.status !== "Submitted"
        ) {

            return req.error(
                400,
                `Only Submitted Purchase Orders can be approved. Current status: ${po.status}`
            );

        }


        // =====================================================
        // APPROVAL LEVEL
        // =====================================================

        const amount =
            Number(
                po.totalAmount || 0
            );


        console.log(
            "PO Amount:",
            amount
        );


        // =====================================================
        // UP TO 10,000
        // MANAGER
        // =====================================================

        if (
            amount <= 10000 &&
            !req.user.is('Manager')
        ) {

            return req.reject(
                403,
                "Only Manager can approve this Purchase Order."
            );

        }


        // =====================================================
        // 10,001 - 50,000
        // SENIOR MANAGER
        // =====================================================

        if (
            amount > 10000 &&
            amount <= 50000 &&
            !req.user.is('SeniorManager')
        ) {

            return req.reject(
                403,
                "Only Senior Manager can approve this Purchase Order."
            );

        }


        // =====================================================
        // ABOVE 50,000
        // DIRECTOR
        // =====================================================

        if (
            amount > 50000 &&
            !req.user.is('Director')
        ) {

            return req.reject(
                403,
                "Only Director can approve this Purchase Order."
            );

        }


        // =====================================================
        // APPROVE
        // =====================================================

        await UPDATE(PurchaseOrders)
            .set({
                status: "Approved",
                approvalComments: comments
            })
            .where({
                ID
            });


        console.log(
            `Purchase Order ${po.poNumber} approved`
        );

        await createAuditLog(req, {

            purchaseOrderID: ID,

            poNumber: po.poNumber,

            prNumber: po.prNumber,

            action: "APPROVED",

            oldStatus: po.status,

            newStatus: "Approved",

            role: getUserRole(req),

            remarks:
                comments ||
                "Purchase Order approved"

        });

        // =====================================================
        // RETURN UPDATED PO
        // =====================================================

        const updatedPO =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        return updatedPO;

    });

    this.on('reject', async (req) => {

        console.log("");
        console.log("=================================");
        console.log("REJECT PURCHASE ORDER");
        console.log("=================================");


        const ID =
            getPOId(req);


        const reason =
            req.data?.reason ||
            req.data?.rejectionComments ||
            req.data?.comments ||
            "";


        console.log(
            "PO ID:",
            ID
        );


        console.log(
            "User:",
            req.user.id
        );


        if (!ID) {

            return req.error(
                400,
                "Purchase Order ID is missing."
            );

        }


        // =====================================================
        // GET PO
        // =====================================================

        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po) {

            return req.error(
                404,
                "Purchase Order not found."
            );

        }


        console.log(
            "PO Number:",
            po.poNumber
        );


        console.log(
            "Current Status:",
            po.status
        );


        // =====================================================
        // ONLY SUBMITTED CAN BE REJECTED
        // =====================================================

        if (
            po.status !== "Submitted"
        ) {

            return req.error(
                400,
                `Only Submitted Purchase Orders can be rejected. Current status: ${po.status}`
            );

        }


        // =====================================================
        // REASON REQUIRED
        // =====================================================

        if (
            !reason ||
            !reason.trim()
        ) {

            return req.error(
                400,
                "Rejection reason is mandatory."
            );

        }


        // =====================================================
        // REJECT
        // =====================================================

        await UPDATE(PurchaseOrders)
            .set({
                status: "Rejected",
                rejectionComments: reason
            })
            .where({
                ID
            });


        await createAuditLog(req, {

            purchaseOrderID: ID,

            poNumber: po.poNumber,

            prNumber: po.prNumber,

            action: "REJECTED",

            oldStatus: po.status,

            newStatus: "Rejected",

            role: getUserRole(req),

            remarks: reason

        });


        console.log(
            `Purchase Order ${po.poNumber} rejected`
        );


        // =====================================================
        // RETURN UPDATED PO
        // =====================================================

        const updatedPO =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        return updatedPO;

    });

    this.on('cancel', async (req) => {

        console.log("");
        console.log("=================================");
        console.log("CANCEL PURCHASE ORDER");
        console.log("=================================");


        const ID =
            getPOId(req);


        console.log(
            "PO ID:",
            ID
        );


        console.log(
            "User:",
            req.user.id
        );


        if (!ID) {

            return req.error(
                400,
                "Purchase Order ID is missing."
            );

        }


        // =====================================================
        // GET PO
        // =====================================================

        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po) {

            return req.error(
                404,
                "Purchase Order not found."
            );

        }


        console.log(
            "PO Number:",
            po.poNumber
        );


        console.log(
            "Current Status:",
            po.status
        );


        // =====================================================
        // ONLY DRAFT OR SUBMITTED CAN BE CANCELLED
        // =====================================================

        if (
            po.status !== "Draft" &&
            po.status !== "Submitted"
        ) {

            return req.error(
                400,
                `Only Draft or Submitted Purchase Orders can be cancelled. Current status: ${po.status}`
            );

        }


        // =====================================================
        // CANCEL
        // =====================================================

        await UPDATE(PurchaseOrders)
            .set({
                status: "Cancelled"
            })
            .where({
                ID
            });


        await createAuditLog(req, {

            purchaseOrderID: ID,

            poNumber: po.poNumber,

            prNumber: po.prNumber,

            action: "CANCELLED",

            oldStatus: po.status,

            newStatus: "Cancelled",

            role: getUserRole(req),

            remarks: "Purchase Order cancelled"

        });


        console.log(
            `Purchase Order ${po.poNumber} cancelled`
        );


        // =====================================================
        // RETURN UPDATED PO
        // =====================================================

        const updatedPO =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        return updatedPO;

    });


    this.on('issue', async (req) => {

        console.log("");
        console.log("=================================");
        console.log("ISSUE PURCHASE ORDER");
        console.log("=================================");


        const ID =
            getPOId(req);


        if (!ID) {

            return req.error(
                400,
                "Purchase Order ID is missing."
            );

        }


        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po) {

            return req.error(
                404,
                "Purchase Order not found."
            );

        }


        // =====================================================
        // ONLY APPROVED CAN BE ISSUED
        // =====================================================

        if (
            po.status !== "Approved"
        ) {

            return req.error(
                400,
                `Only Approved Purchase Orders can be issued. Current status: ${po.status}`
            );

        }


        await UPDATE(PurchaseOrders)
            .set({
                status: "Issued"
            })
            .where({
                ID
            });

        await createAuditLog(req, {

            purchaseOrderID: ID,

            poNumber: po.poNumber,

            prNumber: po.prNumber,

            action: "ISSUED",

            oldStatus: po.status,

            newStatus: "Issued",

            role: getUserRole(req),

            remarks: "Purchase Order issued"

        });


        console.log(
            `Purchase Order ${po.poNumber} issued`
        );


        return await SELECT.one
            .from(PurchaseOrders)
            .where({
                ID
            });

    });


    this.on('complete', async (req) => {

        console.log("");
        console.log("=================================");
        console.log("COMPLETE PURCHASE ORDER");
        console.log("=================================");


        const ID =
            getPOId(req);


        if (!ID) {

            return req.error(
                400,
                "Purchase Order ID is missing."
            );

        }


        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po) {

            return req.error(
                404,
                "Purchase Order not found."
            );

        }


        // =====================================================
        // ONLY ISSUED CAN BE COMPLETED
        // =====================================================

        if (
            po.status !== "Issued"
        ) {

            return req.error(
                400,
                `Only Issued Purchase Orders can be completed. Current status: ${po.status}`
            );

        }


        await UPDATE(PurchaseOrders)
            .set({
                status: "Completed"
            })
            .where({
                ID
            });

        await createAuditLog(req, {

            purchaseOrderID: ID,

            poNumber: po.poNumber,

            prNumber: po.prNumber,

            action: "COMPLETED",

            oldStatus: po.status,

            newStatus: "Completed",

            role: getUserRole(req),

            remarks: "Purchase Order completed"

        });


        console.log(
            `Purchase Order ${po.poNumber} completed`
        );


        return await SELECT.one
            .from(PurchaseOrders)
            .where({
                ID
            });

    });


    this.on('READ', 'ApprovedPurchaseRequests', async (req) => {

        try {

            const prs = await fetchApprovedPRs();

            return prs.map(pr => ({
                requestNumber: pr.requestNumber,
                requesterName: pr.requesterName,
                department: pr.department_code || '',
                requestDate: pr.requestDate,
                currency: pr.currency,
                totalAmount: pr.totalAmount,
                status: pr.status
            }));

        } catch (error) {

            console.error(
                'Failed to load Approved Purchase Requests:',
                error.message
            );

            return req.reject(
                502,
                'Unable to fetch Approved Purchase Requests'
            );
        }
    });

    this.before('CREATE', PurchaseOrders, async (req) => {

        console.log("");
        console.log("=================================");
        console.log("CREATE PURCHASE ORDER");
        console.log("=================================");


        const currentYear =
            new Date().getFullYear();


        // =================================================
        // FIND LAST PO NUMBER
        // =================================================

        const lastPO =
            await SELECT.one
                .from(PurchaseOrders)
                .columns(
                    'poNumber'
                )
                .where(
                    `poNumber like 'PO-${currentYear}-%'`
                )
                .orderBy({
                    poNumber: 'desc'
                });


        let nextNumber = 1;


        if (
            lastPO &&
            lastPO.poNumber
        ) {

            const parts =
                lastPO.poNumber.split('-');


            if (
                parts.length === 3
            ) {

                const lastNumber =
                    parseInt(
                        parts[2],
                        10
                    );


                if (
                    !isNaN(lastNumber)
                ) {

                    nextNumber =
                        lastNumber + 1;

                }

            }

        }


        // =================================================
        // GENERATE PO NUMBER
        // =================================================

        req.data.poNumber =
            `PO-${currentYear}-${String(nextNumber).padStart(6, '0')}`;


        // =================================================
        // DEFAULT STATUS
        // =================================================

        req.data.status =
            "Draft";


        console.log(
            "Generated PO Number:",
            req.data.poNumber
        );

    }
    );

    this.before(['CREATE', 'UPDATE'], PurchaseOrders, async (req) => {

        console.log(
            "PO Validation:",
            req.data
        );


        // =================================================
        // VENDOR
        // =================================================

        if (
            req.data.vendor !== undefined &&
            (
                !req.data.vendor ||
                !req.data.vendor.trim()
            )
        ) {

            req.error(
                400,
                "Vendor is mandatory."
            );

        }


        // =================================================
        // CURRENCY
        // =================================================

        if (
            req.data.currency !== undefined &&
            (
                !req.data.currency ||
                !req.data.currency.trim()
            )
        ) {

            req.error(
                400,
                "Currency is mandatory."
            );

        }


        // =================================================
        // DELIVERY DATE
        // =================================================

        if (
            req.data.deliveryDate
        ) {

            const today =
                new Date();


            const deliveryDate =
                new Date(
                    req.data.deliveryDate
                );


            today.setHours(
                0,
                0,
                0,
                0
            );


            deliveryDate.setHours(
                0,
                0,
                0,
                0
            );


            if (
                deliveryDate < today
            ) {

                req.error(
                    400,
                    "Delivery Date cannot be in the past."
                );

            }

        }


        // =================================================
        // TOTAL AMOUNT
        // =================================================

        if (
            req.data.totalAmount !== undefined &&
            Number(req.data.totalAmount) < 0
        ) {

            req.error(
                400,
                "Total Amount cannot be negative."
            );

        }

    }
    );


    this.before(['CREATE', 'UPDATE'], PurchaseOrderItems, async (req) => {

        const item =
            req.data;


        // =================================================
        // QUANTITY
        // =================================================

        if (
            item.quantity !== undefined &&
            Number(item.quantity) <= 0
        ) {

            req.error(
                400,
                "Quantity must be greater than zero."
            );

        }


        // =================================================
        // UNIT PRICE
        // =================================================

        if (
            item.unitPrice !== undefined &&
            Number(item.unitPrice) <= 0
        ) {

            req.error(
                400,
                "Unit Price must be greater than zero."
            );

        }


        // =================================================
        // DESCRIPTION
        // =================================================

        if (
            item.description !== undefined &&
            (
                !item.description ||
                item.description.trim().length < 3
            )
        ) {

            req.error(
                400,
                "Description must contain at least 3 characters."
            );

        }


        // =================================================
        // TAX
        // =================================================

        if (
            item.taxPercent !== undefined &&
            (
                Number(item.taxPercent) < 0 ||
                Number(item.taxPercent) > 100
            )
        ) {

            req.error(
                400,
                "Tax percentage must be between 0 and 100."
            );

        }


        // =================================================
        // CALCULATE ITEM AMOUNTS
        // =================================================

        // If Quantity or Unit Price is being changed,
        // calculate all amounts.

        if (
            item.quantity !== undefined ||
            item.unitPrice !== undefined ||
            item.taxPercent !== undefined
        ) {

            calculateItem(item);

            console.log(
                "Calculated Item:",
                {
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxPercent: item.taxPercent,
                    netAmount: item.netAmount,
                    taxAmount: item.taxAmount,
                    grossAmount: item.grossAmount
                }
            );

        }

    }
    );

    this.after(['CREATE', 'UPDATE'], PurchaseOrderItems, async (data, req) => {

        const POID =
            data.parent_ID ||
            req.data?.parent_ID;


        if (!POID)
            return;


        // Only recalculate for Draft POs
        // because submitted/approved/etc. should not
        // be modified.

        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID: POID
                });


        if (!po)
            return;


        if (po.status !== "Draft")
            return;


        await recalculatePOTotal(
            POID,
            req
        );

    }
    );


    this.after('DELETE', PurchaseOrderItems, async (data, req) => {

        const POID =
            data.parent_ID ||
            req.data?.parent_ID;


        if (!POID)
            return;


        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID: POID
                });


        if (!po)
            return;


        if (po.status !== "Draft")
            return;


        await recalculatePOTotal(
            POID,
            req
        );

    }
    );

    this.before(['UPDATE', 'DELETE'], PurchaseOrderItems, async (req) => {

        const ID =
            req.data.ID;


        if (!ID)
            return;


        const item =
            await SELECT.one
                .from(PurchaseOrderItems)
                .where({
                    ID
                });


        if (!item)
            return;


        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID: item.parent_ID
                });


        if (!po)
            return;


        if (
            po.status !== "Draft"
        ) {

            req.error(
                400,
                "Purchase Order items can only be modified when the Purchase Order is in Draft status."
            );

        }

    }
    );

    this.before('UPDATE', PurchaseOrders, async (req) => {

        const ID =
            req.data.ID;


        if (!ID)
            return;


        const po =
            await SELECT.one
                .from(PurchaseOrders)
                .where({
                    ID
                });


        if (!po)
            return;


        if (
            po.status !== "Draft"
        ) {

            req.error(
                400,
                "Only Purchase Orders in Draft status can be edited."
            );

        }

    }
    );

    this.after('READ', PurchaseOrders, async (data) => {

        const rows =
            Array.isArray(data)
                ? data
                : [data];


        for (
            const po of rows
        ) {

            if (!po)
                continue;


            // =================================================
            // SUBMIT
            // =================================================

            po.hideSubmit =
                po.status !== "Draft";


            // =================================================
            // APPROVE
            // =================================================

            po.hideApprove =
                po.status !== "Submitted";


            // =================================================
            // REJECT
            // =================================================

            po.hideReject =
                po.status !== "Submitted";


            // =================================================
            // CANCEL
            // =================================================

            po.canCancel =
                po.status === "Draft" ||
                po.status === "Submitted";


            // =================================================
            // ISSUE
            // =================================================

            po.hideIssue =
                po.status !== "Approved";


            // =================================================
            // COMPLETE
            // =================================================

            po.hideComplete =
                po.status !== "Issued";

        }

    }
    );

    this.before(['CREATE', 'UPDATE'], PurchaseOrderItems, async (req) => {

        const item = req.data;

        console.log("PO ITEM DATA:", item);

        // --------------------------------------------------
        // CREATE
        // --------------------------------------------------

        if (req.event === 'CREATE') {

            if (item.quantity === undefined || item.quantity === null) {
                req.error(400, "Quantity is required.");
            }

            if (Number(item.quantity) <= 0) {
                req.error(400, "Quantity must be greater than zero.");
            }

            if (item.unitPrice === undefined || item.unitPrice === null) {
                req.error(400, "Unit Price is required.");
            }

            if (Number(item.unitPrice) <= 0) {
                req.error(400, "Unit Price must be greater than zero.");
            }

            if (!item.description || item.description.trim().length < 3) {
                req.error(400, "Description must contain at least 3 characters.");
            }

            // Fixed GST = 18%
            item.taxPercent = 18;

            // Calculate amounts
            calculateItem(item);

            console.log("CALCULATED PO ITEM:", item);
        }


        // --------------------------------------------------
        // UPDATE
        // --------------------------------------------------

        if (req.event === 'UPDATE' && item.ID) {

            const existingItem =
                await SELECT.one
                    .from(PurchaseOrderItems)
                    .where({ ID: item.ID });

            if (!existingItem) {
                req.error(404, "Purchase Order Item not found.");
            }

            // Merge existing values with changed values
            const calculatedItem = {
                ...existingItem,
                ...item
            };

            // Fixed GST
            calculatedItem.taxPercent = 18;

            // Validate
            if (Number(calculatedItem.quantity) <= 0) {
                req.error(400, "Quantity must be greater than zero.");
            }

            if (Number(calculatedItem.unitPrice) <= 0) {
                req.error(400, "Unit Price must be greater than zero.");
            }

            if (
                !calculatedItem.description ||
                calculatedItem.description.trim().length < 3
            ) {
                req.error(400, "Description must contain at least 3 characters.");
            }

            // Calculate
            calculateItem(calculatedItem);

            // Put calculated values back into request
            req.data.taxPercent = 18;
            req.data.netAmount = calculatedItem.netAmount;
            req.data.taxAmount = calculatedItem.taxAmount;
            req.data.grossAmount = calculatedItem.grossAmount;

            console.log("UPDATED PO ITEM CALCULATION:", {
                netAmount: req.data.netAmount,
                taxAmount: req.data.taxAmount,
                grossAmount: req.data.grossAmount
            });
        }
    });

    this.after('CREATE', PurchaseOrders, async (data, req) => {

        await createAuditLog(req, {

            purchaseOrderID: data.ID,

            poNumber: data.poNumber,

            prNumber: data.prNumber,

            action: "CREATED",

            oldStatus: "",

            newStatus: "Draft",

            role: getUserRole(req),

            remarks: "Purchase Order Created"

        });

    });

    this.after('UPDATE', PurchaseOrders, async (data, req) => {

        if (!data)
            return;

        await createAuditLog(req, {

            purchaseOrderID: data.ID,

            poNumber: data.poNumber,

            prNumber: data.prNumber,

            action: "UPDATED",

            oldStatus: data.status,

            newStatus: data.status,

            role: getUserRole(req),

            remarks: "Purchase Order Updated"

        });

    });

    this.after('READ', 'PurchaseOrderAuditLogs', logs => {

    const setCriticality = log => {

        if (!log)
            return;

        switch (log.newStatus) {

            case 'Draft':
                log.criticality = 2;
                break;

            case 'Submitted':
                log.criticality = 3;
                break;

            case 'Approved':
                log.criticality = 3;
                break;

            case 'Issued':
                log.criticality = 3;
                break;

            case 'Completed':
                log.criticality = 3;
                break;

            case 'Rejected':
                log.criticality = 1;
                break;

            case 'Cancelled':
                log.criticality = 1;
                break;

            default:
                log.criticality = 0;
        }

    };

    if (Array.isArray(logs))
        logs.forEach(setCriticality);
    else
        setCriticality(logs);

});

});