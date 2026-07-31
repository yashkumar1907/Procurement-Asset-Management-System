/* =========================
   MAIN BACKEND FRAMEWORK
========================= */
const express = require("express");


/* =========================
   Creates a route container
========================= */
const router = express.Router();


/* =========================
   Import Inventory Hardware Record Model
========================= */
const InventoryHardwareRecord = require("../models/InventoryHardwareRecord");


/* =========================
   Import Excel Package
========================= */
const XLSX = require("xlsx");


const fs = require("fs");


/* =========================
   MULTER CONFIGURATION (Used Only For Excel Import)
========================= */
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});


const excelUpload = multer({
    storage: storage,

    fileFilter: function (req, file, cb) {
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only Excel files allowed"), false);
        }
    }
});


// ===============================
// CREATE RECORD
// ===============================
router.post("/", async (req, res) => {
    try {
        const parsedHardwareDetails = req.body.hardwareDetails || [];

        const record =
            new InventoryHardwareRecord({
                ...req.body,
                hardwareDetails: parsedHardwareDetails
            });

        await record.save();

        res.status(201).json({
            message: "Inventory Hardware Record Added Successfully"
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
// GET ALL RECORDS
// ===============================
router.get("/", async (req, res) => {
    try {
        const records = await InventoryHardwareRecord.find();
        res.status(200).json(records);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// UPDATE RECORD
// ===============================
router.put("/:id", async (req, res) => {
    try {
        const existingRecord = await InventoryHardwareRecord.findById(req.params.id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "Inventory Hardware Record not found"
            });
        }

        const updateData = {
            ...req.body
        };

        const updatedHardwares =
            req.body.hardwareDetails ||
            existingRecord.hardwareDetails;

        updateData.hardwareDetails = updatedHardwares;

        await InventoryHardwareRecord.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            message: "Inventory Hardware Record Updated Successfully"
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
// DELETE RECORD
// ===============================
router.delete("/:id", async (req, res) => {
    try {
        const record = await InventoryHardwareRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        await InventoryHardwareRecord.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Inventory Hardware Record Deleted Successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});



function parseExcelDate(value) {
    if (!value) {
        return null;
    }

    // Already a JavaScript Date
    if (value instanceof Date) {
        return value;
    }

    // Excel serial number
    if (typeof value === "number") {
        return new Date((value - 25569) * 86400 * 1000);
    }

    if (typeof value === "string") {
        value = value.trim();

        // DD.MM.YYYY
        if (value.includes(".")) {
            const [day, month, year] = value.split(".");
            return new Date(year, month - 1, day);
        }

        // DD/MM/YYYY
        if (value.includes("/")) {
            const [day, month, year] = value.split("/");
            return new Date(year, month - 1, day);
        }

        // YYYY-MM-DD
        return new Date(value);
    }

    return value;
}

// ===============================
// EXPORT INVENTORY Hardware EXCEL
// ===============================
router.get("/export", async (req, res) => {
    try {
        const records = await InventoryHardwareRecord.find();

        const recordSheet = [];

        records.forEach(record => {
            record.hardwareDetails.forEach(hardware => {
                recordSheet.push({
                    "PR Requirement Date": record.prReqDate,
                    "PR Number": record.prNum,
                    "PO Number": record.poNum,
                    "Material Code": hardware.code,
                    "Material Description": hardware.desc,
                    "Quantity": hardware.quantity,
                    "Tracking ID": record.trackingId,
                    "Cost Center": record.costCenter,
                    "Project Name": record.projectName,
                    "Current Progress": record.currentProgress,
                    "Purchaser Name": record.purchaserName,
                    "SRR Number": record.srrNumber,
                    "GRN Number": record.grnNumber,
                    "Remark": record.remark
                });
            });
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(recordSheet, {
            header: [
                "PR Requirement Date",
                "PR Number",
                "PO Number",
                "Material Code",
                "Material Description",
                "Quantity",
                "Tracking ID",
                "Cost Center",
                "Project Name",
                "Current Progress",
                "Purchaser Name",
                "SRR Number",
                "GRN Number",
                "Remark"
            ]
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Hardware Records");

        const buffer =
            XLSX.write(
                workbook,
                {
                    type: "buffer",
                    bookType: "xlsx"
                }
            );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=Inventory_Hardware_Export.xlsx"
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Export Failed"
        });
    }
});


// ===============================
// IMPORT INVENTORY HARDWARE EXCEL
// ===============================
router.post("/import", excelUpload.single("excelFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);

        const recordSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Inventory Hardware Records"]);

        const groupedRecords = {};

        recordSheet.forEach(row => {
            const prNum = String(row["PR Number"]).trim();
            
            if (!groupedRecords[prNum]) {
                groupedRecords[prNum] = {
                    prReqDate: parseExcelDate(row["PR Requirement Date"]),
                    prNum,
                    poNum: row["PO Number"] || "",
                    trackingId: row["Tracking ID"] || "",
                    costCenter: row["Cost Center"] || "",
                    projectName: row["Project Name"] || "",
                    currentProgress: row["Current Progress"] || "",
                    purchaserName: row["Purchaser Name"] || "",
                    srrNumber: Number(row["SRR Number"]) || 0,
                    grnNumber: Number(row["GRN Number"]) || 0,
                    remark: row["Remark"] || "",
                    
                    hardwareDetails: []
                };
            }
            
            groupedRecords[prNum].hardwareDetails.push({
                code: row["Material Code"],
                desc: row["Material Description"],
                quantity: Number(row["Quantity"]),
            });
        });
        
        let importedRecords = 0;
        let skippedRecords = 0;

        for (const prNum of Object.keys(groupedRecords)) {
            const existingRecord = await InventoryHardwareRecord.findOne({prNum});
            
            if (existingRecord) {
                skippedRecords++;
                continue;
            }

            const recordData = groupedRecords[prNum];

            const record =
                new InventoryHardwareRecord({
                    prReqDate: recordData.prReqDate,
                    prNum: recordData.prNum,
                    poNum: recordData.poNum,
                    trackingId: recordData.trackingId,
                    costCenter: recordData.costCenter,
                    projectName: recordData.projectName,
                    currentProgress: recordData.currentProgress,
                    purchaserName: recordData.purchaserName,
                    srrNumber: recordData.srrNumber,
                    grnNumber: recordData.grnNumber,
                    remark: recordData.remark,

                    lastEditedBy: req.body.lastEditedBy,

                    hardwareDetails: recordData.hardwareDetails
                });

            await record.save();
            importedRecords++;
        }

        fs.unlinkSync(req.file.path);

        res.status(200).json({
            message: `Import Completed \n Imported Records: ${importedRecords} \n Skipped Records: ${skippedRecords}`});
        }
        catch (error) {
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            console.error(error);
            res.status(500).json({
                message: "Import Failed"
            });
        }
    }
);


// ===============================
// GET RECORDS FOR WBS LINKING
// ===============================
router.get("/wbs-selector", async (req, res) => {
    try {
        const records = await InventoryHardwareRecord.find(
            {},
            {
                prNum: 1,
                poNum: 1,
                projectName: 1
            }
        ).sort({
            prNum: 1
        });
        res.status(200).json(records);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


/* =========================
    Export these all routes so that we can use it anywhere
========================= */
module.exports = router;