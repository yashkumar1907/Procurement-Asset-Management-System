const express = require("express");
const XLSX = require("xlsx");
const router = express.Router();

const NetworkRecord = require("../models/NetworkRecord");
const NetworkDetail = require("../models/NetworkDetail");
const AmcRecord = require("../models/AmcRecord");
const AmcDetail = require("../models/AmcDetail");
const ContractRecord = require("../models/ContractRecord");
const ContractDetail = require("../models/ContractDetail");
const InventoryNetworkRecord = require("../models/InventoryNetworkRecord");
const InventoryHardwareRecord = require("../models/InventoryHardwareRecord");
const InventoryDepartmentRecord = require("../models/InventoryDepartmentRecord");
const PlantMaterialRecord = require("../models/PlantMaterialRecord");
const PlantServiceRecord = require("../models/PlantServiceRecord");
const WbsProjectRecord = require("../models/WbsProjectRecord");


function getPoStatus(records) {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;

    const today = new Date();

    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);

    records.forEach(record => {
        if (!record.poEndDate) {
            return;
        }

        const endDate = new Date(record.poEndDate);

        if (isNaN(endDate.getTime())) {
            return;
        }

        if (endDate < today) {
            expired++;
        }
        else if (endDate <= thirtyDaysLater) {
            expiringSoon++;
        }
        else {
            active++;
        }
    });

    return {active, expiringSoon, expired};
}


async function getAllProcurementRecords() {
    const [network, amc, contract] = await Promise.all([
        NetworkRecord.find(),
        AmcRecord.find(),
        ContractRecord.find()
    ]);
    
    return [...network, ...amc, ...contract];
}


// ===============================
// EXECUTIVE SUMMARY
// ===============================
router.get("/summary", async (req, res) => {

    try{
        const [procurementRecords, networkDetails, amcDetails, contractDetails, wbsProjects] = await Promise.all([getAllProcurementRecords(), NetworkDetail.find(), AmcDetail.find(), ContractDetail.find(), WbsProjectRecord.find()]);

        // -------------------------------
        // Total Procurement
        // -------------------------------
        let totalProcurement = 0;

        procurementRecords.forEach(record => {
            totalProcurement += Number(record.poAmount || 0);
        });

        totalProcurement = Math.round(totalProcurement);

        // -------------------------------
        // Total Payments
        // -------------------------------
        let totalPayment = 0;

        [
            ...networkDetails,
            ...amcDetails,
            ...contractDetails
        ].forEach(detail => {
            totalPayment += Number(detail.invoiceAmount || 0);
        });

        totalPayment = Math.round(totalPayment);

        // -------------------------------
        // PO Status
        // -------------------------------
        const poStatus = getPoStatus(procurementRecords);

        // -------------------------------
        // Active Contracts
        // -------------------------------
        const activeContracts = procurementRecords.length;

        // -------------------------------
        // Total Vendors
        // -------------------------------
        const uniqueVendors = new Set();

        procurementRecords.forEach(record => {
            if (record.vendorCode) {
                uniqueVendors.add(record.vendorCode);
            }
        });

        // -------------------------------
        // Response
        // -------------------------------
        res.json({
            totalProcurement,
            totalPayment,

            activePOs: poStatus.active,
            expiringSoon: poStatus.expiringSoon,
            expiredPOs: poStatus.expired,

            activeContracts,

            totalVendors: uniqueVendors.size,

            wbsProjects: wbsProjects.length
        });
    }
    catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });
    }
});




// ===============================
// MONTHLY PROCUREMENT TREND
// ===============================
router.get("/monthly-po", async (req, res) => {
    try {
        const records = await getAllProcurementRecords();

        const labels = [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
        ];

        const monthlyAmount = new Array(12).fill(0);

        records.forEach(record => {
            if (!record.poDate) {
                return;
            }

            const month = new Date(record.poDate).getMonth();
            monthlyAmount[month] += Number(record.poAmount || 0);

        });

        res.json({
            labels,
            data: monthlyAmount
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// PAYMENT VS PROCUREMENT
// ===============================
router.get("/payment-vs-procurement", async (req, res) => {
    try {
        const labels = [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
        ];

        const procurement = new Array(12).fill(0);
        const payments = new Array(12).fill(0);

        const [procurementRecords, networkDetails, amcDetails, contractDetails] = await Promise.all([getAllProcurementRecords(), NetworkDetail.find(), AmcDetail.find(), ContractDetail.find()]);
        
        const paymentRecords = [
            ...networkDetails,
            ...amcDetails,
            ...contractDetails
        ];

        procurementRecords.forEach(record => {
            if (!record.poDate) {
                return;
            }

            const month = new Date(record.poDate).getMonth();
            procurement[month] += Number(record.poAmount || 0);
        });

        paymentRecords.forEach(record => {
            if (!record.invoiceDate) {
                return;
            }

            const month = new Date(record.invoiceDate).getMonth();
            payments[month] += Number(record.invoiceAmount || 0);
        });

        res.json({
            labels,
            procurement,
            payments
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});



// ===============================
// PO EXPIRY TIMELINE
// ===============================
router.get("/po-expiry", async (req, res) => {
    try {
        const today = new Date();

        const d7  = new Date(today);
        d7.setDate(today.getDate() + 7);

        const d15 = new Date(today);
        d15.setDate(today.getDate() + 15);

        const d30 = new Date(today);
        d30.setDate(today.getDate() + 30);

        const records = await getAllProcurementRecords();

        let bucket0to7 = 0;
        let bucket8to15 = 0;
        let bucket16to30 = 0;
        let bucket30plus = 0;

        records.forEach(record => {
            if (!record.poEndDate) return;

            const end = new Date(record.poEndDate);

            if (end < today) {
                return;
            }

            if (end <= d7) {
                bucket0to7++;
            }
            else if (end <= d15) {
                bucket8to15++;
            }
            else if (end <= d30) {
                bucket16to30++;
            }
            else {
                bucket30plus++;
            }
        });

        res.json({
            labels: [
                "0-7 Days",
                "8-15 Days",
                "16-30 Days",
                ">30 Days"
            ],
            data: [
                bucket0to7,
                bucket8to15,
                bucket16to30,
                bucket30plus
            ]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// SPEND BY MODULE
// ===============================
router.get("/spend-by-module", async (req, res) => {
    try {
        const [network, amc, contract] = await Promise.all([
            NetworkRecord.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$poAmount"
                        }
                    }
                }
            ]),
            AmcRecord.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$poAmount"
                        }
                    }
                }
            ]),
            ContractRecord.aggregate([
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$poAmount"
                        }
                    }
                }
            ])
        ]);

        res.json({
            labels: ["Network", "AMC", "Contract"],
            data: [
                network[0]?.total || 0,
                amc[0]?.total || 0,
                contract[0]?.total || 0
            ]
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


router.get("/payment-report", async (req, res) => {
    try {
        const { from, to } = req.query;

        if (!from || !to) {
            return res.status(400).json({
                message: "From Date and To Date are required."
            });
        }

        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);

        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format."
            });
        }

        const [networkDetails, amcDetails, contractDetails] = await Promise.all([
            NetworkDetail.find({
                invoiceDate: {
                    $gte: fromDate,
                    $lte: toDate
                }
            }).populate("recordId"),
        
            AmcDetail.find({
                invoiceDate: {
                    $gte: fromDate,
                    $lte: toDate
                }
            }).populate("recordId"),
        
            ContractDetail.find({
                invoiceDate: {
                    $gte: fromDate,
                    $lte: toDate
                }
            }).populate("recordId")
        ]);

        const paymentData = [];

        networkDetails.forEach(detail => {
            paymentData.push({
                "Module": "Network",
                "Vendor Name": detail.recordId?.vendorName || "",
                "Vendor Code": detail.recordId?.vendorCode || "",
                "PO Number": detail.recordId?.po || "",
                "Description": detail.recordId?.poDescription || "",
                "Invoice Number": detail.invoiceNumber,
                "Invoice Date": new Date(detail.invoiceDate).toLocaleDateString("en-GB").replace(/\//g, "."),
                "Invoice Period": detail.invoicePeriod,
                "Invoice Amount": detail.invoiceAmount,
                "Tracking Number": detail.trackingNumber,
                "Service Entry Number": detail.serviceEntryNumber,
                "Document Number": detail.documentNumber
            });
        
        });

        amcDetails.forEach(detail => {
            paymentData.push({
                "Module": "AMC",
                "Vendor Name": detail.recordId?.vendorName || "",
                "Vendor Code": detail.recordId?.vendorCode || "",
                "PO Number": detail.recordId?.po || "",
                "Description": detail.recordId?.poDescription || "",
                "Invoice Number": detail.invoiceNumber,
                "Invoice Date": new Date(detail.invoiceDate).toLocaleDateString("en-GB").replace(/\//g, "."),
                "Invoice Period": detail.invoicePeriod,
                "Invoice Amount": detail.invoiceAmount,
                "Tracking Number": detail.trackingNumber,
                "Service Entry Number": detail.serviceEntryNumber,
                "Document Number": detail.documentNumber
            });
        
        });

        contractDetails.forEach(detail => {
            paymentData.push({
                "Module": "Contract",
                "Vendor Name": detail.recordId?.vendorName || "",
                "Vendor Code": detail.recordId?.vendorCode || "",
                "PO Number": detail.recordId?.po || "",
                "Description": detail.recordId?.poDescription || "",
                "Invoice Number": detail.invoiceNumber,
                "Invoice Date": new Date(detail.invoiceDate).toLocaleDateString("en-GB").replace(/\//g, "."),
                "Invoice Period": detail.invoicePeriod,
                "Invoice Amount": detail.invoiceAmount,
                "Tracking Number": detail.trackingNumber,
                "Service Entry Number": detail.serviceEntryNumber,
                "Document Number": detail.documentNumber
            });
        
        });

        const worksheet = XLSX.utils.json_to_sheet(paymentData);

        worksheet["!cols"] = [
            { wch: 12 }, // Module
            { wch: 30 }, // Vendor Name
            { wch: 18 }, // Vendor Code
            { wch: 20 }, // PO Number
            { wch: 35 }, // Description
            { wch: 20 }, // Invoice Number
            { wch: 15 }, // Invoice Date
            { wch: 18 }, // Invoice Period
            { wch: 18 }, // Invoice Amount
            { wch: 18 }, // Tracking Number
            { wch: 22 }, // Service Entry Number
            { wch: 22 }  // Document Number
        ];


        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Payment Report"
        );


        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "buffer"
        });
        
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=Payment_Report_${from}_to_${to}.xlsx`
        );
        
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        
        res.send(excelBuffer);


    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// RECENT ACTIVITIES
// ===============================
router.get("/recent-activities", async (req, res) => {
    try {
        const activities = [];

        const [ networkRecords, amcRecords, contractRecords, networkInvoices, amcInvoices, contractInvoices, projects] = await Promise.all([
            NetworkRecord.find().sort({ createdAt: -1 }).limit(5),
            AmcRecord.find().sort({ createdAt: -1 }).limit(5),
            ContractRecord.find().sort({ createdAt: -1 }).limit(5),
            NetworkDetail.find().sort({ createdAt: -1 }).limit(5),
            AmcDetail.find().sort({ createdAt: -1 }).limit(5),
            ContractDetail.find().sort({ createdAt: -1 }).limit(5),
            WbsProjectRecord.find().sort({ createdAt: -1 }).limit(5)
        ]);

        networkRecords.forEach(record => {
            activities.push({
                module: "Network",
                action: "PO Created",
                title: record.po,
                date: record.createdAt
            });
        });

        amcRecords.forEach(record => {

            activities.push({
                module: "AMC",
                action: "PO Created",
                title: record.po,
                date: record.createdAt
            });

        });

        contractRecords.forEach(record => {

            activities.push({
                module: "Contract",
                action: "PO Created",
                title: record.po,
                date: record.createdAt
            });

        });

        networkInvoices.forEach(invoice => {

            activities.push({
                module: "Network",
                action: "Invoice Added",
                title: invoice.invoiceNumber,
                date: invoice.createdAt
            });

        });

        amcInvoices.forEach(invoice => {

            activities.push({
                module: "AMC",
                action: "Invoice Added",
                title: invoice.invoiceNumber,
                date: invoice.createdAt
            });

        });


        contractInvoices.forEach(invoice => {

            activities.push({
                module: "Contract",
                action: "Invoice Added",
                title: invoice.invoiceNumber,
                date: invoice.createdAt
            });

        });

        projects.forEach(project => {

            activities.push({
                module: "WBS",
                action: "Project Added",
                title: `${project.wbsNum} - ${project.description}`,
                date: project.createdAt
            });

        });

        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(
            activities.slice(0, 10)
        );

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

});


// ===============================
// DASHBOARD ALERTS
// ===============================
router.get("/dashboard-alerts", async (req, res) => {
    try {
        const [procurementRecords, networkDraft, hardwareDraft, departmentDraft] = await Promise.all([
            getAllProcurementRecords(),
            InventoryNetworkRecord.countDocuments({ currentProgress: "Draft" }),
            InventoryHardwareRecord.countDocuments({ currentProgress: "Draft" }),
            InventoryDepartmentRecord.countDocuments({ currentProgress: "Draft" })
        ]);
        
        const draftInventory = networkDraft + hardwareDraft + departmentDraft;

        const today = new Date();

        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(today.getDate() + 30);

        let expiredPOs = 0;
        let expiringPOs = 0;

        procurementRecords.forEach(record => {
            if (!record.poEndDate) {
                return;
            }

            const endDate = new Date(record.poEndDate);

            if (endDate < today) {
                expiredPOs++;
            }
            else if (endDate <= thirtyDaysLater) {
                expiringPOs++;
            }

        });

        res.json({
            expiredPOs,
            expiringPOs,
            draftInventory
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// TOP VENDORS
// ===============================
router.get("/top-vendors", async (req, res) => {

    try {

        const records = await getAllProcurementRecords();

        const vendors = {};

        records.forEach(record => {

            const vendorCode = record.vendorCode || "N/A";

            if (!vendors[vendorCode]) {

                vendors[vendorCode] = {

                    vendorName: record.vendorName,
                    vendorCode: record.vendorCode,
                    totalAmount: 0,
                    totalPOs: 0

                };

            }

            vendors[vendorCode].totalAmount += Number(record.poAmount || 0);
            vendors[vendorCode].totalPOs++;

        });

        const topVendors = Object.values(vendors)
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, 10);

        res.json(topVendors);

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

});

module.exports = router;