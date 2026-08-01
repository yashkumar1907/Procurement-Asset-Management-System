/* =========================
   MAIN BACKEND FRAMEWORK
========================= */
const express = require("express");


/* =========================
   Creates a route container
========================= */
const router = express.Router();


/* =========================
   Import Plant Service Record Model
========================= */
const PlantServiceRecord = require("../models/PlantServiceRecord");


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
    storage,

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
        const parsedPlantServiceDetails = req.body.plantServiceDetails || [];

        const totalPrAmount =
            parsedPlantServiceDetails.reduce(
                (sum, plantService) => sum + (Number(plantService.quantity || 0) * Number(plantService.pricePerQuantity || 0)), 0
            );

        const record =
            new PlantServiceRecord({
                ...req.body,
                prAmount: totalPrAmount,
                plantServiceDetails: parsedPlantServiceDetails
            });

        await record.save();

        res.status(201).json({
            message: "Plant Service Record Added Successfully"
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
        const records = await PlantServiceRecord.find();
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
        const existingRecord = await PlantServiceRecord.findById(req.params.id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "Plant Service Record not found"
            });
        }

        const updateData = {
            ...req.body
        };

        const updatedPlantServices =
            req.body.plantServiceDetails ||
            existingRecord.plantServiceDetails;

        const totalPrAmount =
            updatedPlantServices.reduce(
                (sum, plantService) => sum + (Number(plantService.quantity || 0) * Number(plantService.pricePerQuantity || 0)), 0
            );

        updateData.prAmount = totalPrAmount;
        updateData.plantServiceDetails = updatedPlantServices;

        await PlantServiceRecord.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            message: "Plant Service Record Updated Successfully"
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
        const record = await PlantServiceRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        await PlantServiceRecord.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Plant Service Record Deleted Successfully"
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
// EXPORT Plant Service EXCEL
// ===============================
router.get("/export", async (req, res) => {
    try {
        const records = await PlantServiceRecord.find();

        const recordSheet = [];

        records.forEach(record => {
            record.plantServiceDetails.forEach(plantService => {
                recordSheet.push({
                    "PR Requirement Date": record.prReqDate,
                    "PR Creation Date": record.prCreationDate,
                    "PR Number": record.prNum,
                    "Service Code": plantService.code,
                    "Service Text": plantService.shortText,
                    "Service Description": plantService.desc,
                    "Quantity": plantService.quantity,
                    "Price Per Quantity": plantService.pricePerQuantity,
                    "PR Amount": record.prAmount,
                    "PO Number": record.poNum,
                    "PO Amount": record.poAmount
                });
            });
        });

        const workbook = XLSX.utils.book_new();
        // const worksheet = XLSX.utils.json_to_sheet(recordSheet);

        const worksheet = XLSX.utils.json_to_sheet(recordSheet, {
                header: [
                    "PR Requirement Date",
                    "PR Creation Date",
                    "PR Number",
                    "Service Code",
                    "Service Text",
                    "Service Description",
                    "Quantity",
                    "Price Per Quantity",
                    "PR Amount",
                    "PO Number",
                    "PO Amount"
                ]
        });

        XLSX.utils.book_append_sheet(workbook, worksheet, "Plant Service Records");

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
            "attachment; filename=Plant_Service_Export.xlsx"
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
// IMPORT Plant Service EXCEL
// ===============================
router.post("/import", excelUpload.single("excelFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);

        const recordSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Plant Service Records"]);

        const groupedRecords = {};

        recordSheet.forEach(row => {
            const prNum = String(row["PR Number"]).trim();
            
            if (!groupedRecords[prNum]) {
                groupedRecords[prNum] = {
                    prReqDate: parseExcelDate(row["PR Requirement Date"]),
                    prCreationDate: parseExcelDate(row["PR Creation Date"]),
                    prNum,
                    poNum: row["PO Number"] || "",
                    poAmount: Number(row["PO Amount"]) || 0,
                    
                    plantServiceDetails: []
                };
            }
            
            groupedRecords[prNum].plantServiceDetails.push({
                code: row["Service Code"],
                shortText: row["Service Text"],
                desc: row["Service Description"],
                quantity: Number(row["Quantity"]),
                pricePerQuantity: Number(row["Price Per Quantity"])
            });
        });
        
        let importedRecords = 0;
        let skippedRecords = 0;

        for (const prNum of Object.keys(groupedRecords)) {
            const existingRecord = await PlantServiceRecord.findOne({prNum});
            
            if (existingRecord) {
                skippedRecords++;
                continue;
            }

            const recordData = groupedRecords[prNum];

            const prAmount =
                recordData.plantServiceDetails.reduce(
                    (sum, plantService) =>
                        sum + (Number(plantService.quantity) * Number(plantService.pricePerQuantity)), 0
                    );

            const record =
                new PlantServiceRecord({
                    prReqDate: recordData.prReqDate,
                    prCreationDate: recordData.prCreationDate,
                    prNum: recordData.prNum,
                    plantServiceDetails: recordData.plantServiceDetails,
                    prAmount,
                    poNum: recordData.poNum,
                    poAmount: recordData.poAmount,
                    lastEditedBy: req.body.lastEditedBy
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
        const records = await PlantServiceRecord.find(
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