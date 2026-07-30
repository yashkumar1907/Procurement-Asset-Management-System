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

        if (isNaN(endDate)) {
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

// ===============================
// NETWORK DASHBOARD
// ===============================
router.get("/network", async (req, res) => {
    try {
        // Total Network Records
        const networkRecords = await NetworkRecord.countDocuments();
        const amcRecords = await AmcRecord.countDocuments();
        const contractRecords = await ContractRecord.countDocuments();
        
        const totalRecords = networkRecords + amcRecords + contractRecords;

        
        const networkPo = await NetworkRecord.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$poAmount"
                    }
                }
            }
        ]);
        
        const amcPo = await AmcRecord.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$poAmount"
                    }
                }
            }
        ]);
        
        const contractPo = await ContractRecord.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$poAmount"
                    }
                }
            }
        ]);

        // Total PO Amount
        const totalPoAmount = (networkPo[0]?.total || 0) + (amcPo[0]?.total || 0) + (contractPo[0]?.total || 0);


        
        const networkPayment = await NetworkDetail.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$invoiceAmount"
                    }
                }
            }
        ]);
        
        const amcPayment = await AmcDetail.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$invoiceAmount"
                    }
                }
            }
        ]);
        
        const contractPayment = await ContractDetail.aggregate([
            {
                $group: {
                    _id: null,
                    total: {
                        $sum: "$invoiceAmount"
                    }
                }
            }
        ]);

        // Total Payment (Invoice Amount)
        const totalPayment = (networkPayment[0]?.total || 0) + (amcPayment[0]?.total || 0) + (contractPayment[0]?.total || 0);


        res.json({
            totalRecords,
            totalPoAmount,

            totalPayment
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
// INVENTORY DASHBOARD
// ===============================
router.get("/inventory", async (req, res) => {
    try {
        // Total Records
        const networkRecords = await InventoryNetworkRecord.countDocuments();
        const hardwareRecords = await InventoryHardwareRecord.countDocuments();
        const departmentRecords = await InventoryDepartmentRecord.countDocuments();

        const totalRecords = networkRecords + hardwareRecords + departmentRecords;

        // Draft Records
        const networkDraft = await InventoryNetworkRecord.countDocuments({currentProgress: "Draft"});
        const hardwareDraft = await InventoryHardwareRecord.countDocuments({currentProgress: "Draft"});
        const departmentDraft = await InventoryDepartmentRecord.countDocuments({currentProgress: "Draft"});

        const draftRecords = networkDraft + hardwareDraft + departmentDraft;

        // Released Records
        const releasedStatuses = ["Release for Indentor","Release for Sec / Head", "Release for Dept HOD", "Release for Store", "Release for Unit Head", "Release for Functional Head", "Release / Mapped to Purchaser"];

        const networkReleased = await InventoryNetworkRecord.countDocuments({currentProgress: { $in: releasedStatuses }});
        const hardwareReleased = await InventoryHardwareRecord.countDocuments({currentProgress: { $in: releasedStatuses }});
        const departmentReleased = await InventoryDepartmentRecord.countDocuments({currentProgress: { $in: releasedStatuses }});

        const releasedRecords = networkReleased + hardwareReleased + departmentReleased;

        // PO Received Records
        const networkPoReceived = await InventoryNetworkRecord.countDocuments({currentProgress: "PO Received"});
        const hardwarePoReceived = await InventoryHardwareRecord.countDocuments({currentProgress: "PO Received"});
        const departmentPoReceived = await InventoryDepartmentRecord.countDocuments({currentProgress: "PO Received"});

        const poReceivedRecords = networkPoReceived + hardwarePoReceived + departmentPoReceived;

        res.json({
            totalRecords,
            draftRecords,
            releasedRecords,
            poReceivedRecords
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// PLANT DASHBOARD
// ===============================
router.get("/plants", async (req, res) => {
    try {
        const materialRecords = await PlantMaterialRecord.find();
        const serviceRecords = await PlantServiceRecord.find();

        let totalPr = 0;
        let totalPo = 0;

        [...materialRecords, ...serviceRecords].forEach(record => {
            if (record.prNum)
                totalPr++;

            if (record.poNum)
                totalPo++;
        });

        res.json({
            materialRecords: materialRecords.length,
            serviceRecords: serviceRecords.length,
            totalPr,
            totalPo
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
// WBS DASHBOARD
// ===============================
router.get("/wbs", async (req, res) => {
    try {
        const projects = await WbsProjectRecord.find();

        let linkedPr = 0;
        let linkedPo = 0;

        projects.forEach(project => {
            if (project.prNum)
                linkedPr++;

            if (project.poNum)
                linkedPo++;
        });

        res.json({
            totalProjects: projects.length,
            linkedPr,
            linkedPo
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
// PO STATUS CHART
// ===============================
router.get("/po-status", async (req, res) => {

    try {
        const networkRecords = await NetworkRecord.find();
        const amcRecords = await AmcRecord.find();
        const contractRecords = await ContractRecord.find();
        const networkStatus = getPoStatus(networkRecords);
        const amcStatus = getPoStatus(amcRecords);
        const contractStatus = getPoStatus(contractRecords);

        res.json({
            active: networkStatus.active + amcStatus.active + contractStatus.active,
            expiringSoon: networkStatus.expiringSoon + amcStatus.expiringSoon + contractStatus.expiringSoon,
            expired: networkStatus.expired + amcStatus.expired + contractStatus.expired
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
// RECORDS BY MODULE
// ===============================
router.get("/module-records", async (req, res) => {
    try {
        const network = await NetworkRecord.countDocuments();
        const amc = await AmcRecord.countDocuments();
        const contract = await ContractRecord.countDocuments();
        const inventoryNetwork = await InventoryNetworkRecord.countDocuments();
        const inventoryHardware = await InventoryHardwareRecord.countDocuments();
        const inventoryDepartment = await InventoryDepartmentRecord.countDocuments();
        const plantMaterial = await PlantMaterialRecord.countDocuments();
        const plantService = await PlantServiceRecord.countDocuments();
        const wbs = await WbsProjectRecord.countDocuments();

        res.json({
            network: network + amc + contract,
            inventory: inventoryNetwork + inventoryHardware + inventoryDepartment,
            plants: plantMaterial + plantService,
            wbs
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
// MONTHLY RECORD CREATION TREND
// ===============================
router.get("/monthly-records", async (req, res) => {
    try {
        const records = [
            ...(await NetworkRecord.find()),
            ...(await AmcRecord.find()),
            ...(await ContractRecord.find()),

            ...(await InventoryNetworkRecord.find()),
            ...(await InventoryHardwareRecord.find()),
            ...(await InventoryDepartmentRecord.find()),

            ...(await PlantMaterialRecord.find()),
            ...(await PlantServiceRecord.find()),

            ...(await WbsProjectRecord.find())
        ];

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const monthlyData = new Array(12).fill(0);

        records.forEach(record => {
            if (!record.createdAt) return;

            const month = new Date(record.createdAt).getMonth();
            monthlyData[month]++;
        });
        res.json({
            labels: monthNames,
            data: monthlyData
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});




function getPoExpiry(records) {
    let expired = 0;
    let days30 = 0;
    let days60 = 0;
    let more60 = 0;

    const today = new Date();

    records.forEach(record => {
        if (!record.poEndDate) return;

        const end = new Date(record.poEndDate);

        if (isNaN(end)) {
            return;
        }

        const diff =
            Math.ceil(
                (end - today) /
                (1000 * 60 * 60 * 24)
            );

        if (diff < 0)
            expired++;

        else if (diff <= 30)
            days30++;

        else if (diff <= 60)
            days60++;

        else
            more60++;
    });

    return {
        expired,
        days30,
        days60,
        more60
    };
}


// ===============================
// PO EXPIRY TIMELINE
// ===============================
router.get("/po-expiry", async (req, res) => {
    try {
        const records = [
            ...(await NetworkRecord.find()),
            ...(await AmcRecord.find()),
            ...(await ContractRecord.find())
        ];

        const result = getPoExpiry(records);
        res.json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// MONTHLY PO AMOUNT
// ===============================
router.get("/monthly-po", async (req, res) => {
    try {
        const records = [
            ...(await NetworkRecord.find()),
            ...(await AmcRecord.find()),
            ...(await ContractRecord.find())
        ];

        const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        const monthlyAmount = new Array(12).fill(0);

        records.forEach(record => {
            if (!record.createdAt) return;

            const month = new Date(record.createdAt).getMonth();

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

        if (isNaN(fromDate) || isNaN(toDate)) {
            return res.status(400).json({
                message: "Invalid date format."
            });
        }

        const networkDetails = await NetworkDetail.find({
            invoiceDate: {
                $gte: fromDate,
                $lte: toDate
            }
        }).populate("recordId");
        
        const amcDetails = await AmcDetail.find({
            invoiceDate: {
                $gte: fromDate,
                $lte: toDate
            }
        }).populate("recordId");
        
        const contractDetails = await ContractDetail.find({
            invoiceDate: {
                $gte: fromDate,
                $lte: toDate
            }
        }).populate("recordId");

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


module.exports = router;