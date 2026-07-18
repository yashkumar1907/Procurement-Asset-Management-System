/* =========================
   MAIN BACKEND FRAMEWORK
========================= */
const express = require("express");


/* =========================
   Creates a route container
========================= */
const router = express.Router();


/* =========================
   Import Plant Material Record Model
========================= */
const PlantMaterialRecord = require("../models/PlantMaterialRecord");


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
        const parsedPlantMaterialDetails = req.body.plantMaterialDetails || [];

        const record = new PlantMaterialRecord({
            ...req.body,
            lastEditedBy: req.body.lastEditedBy,
            plantMaterialDetails: parsedPlantMaterialDetails
        });

        await record.save();

        res.status(201).json({
            message: "Plant Material Record Added Successfully"
        });
    }
    catch (error) {
        console.log(error);
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
        const records = await PlantMaterialRecord.find();
        res.status(200).json(records);
    }
    catch (error) {
        console.log(error);
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
        const existingRecord = await PlantMaterialRecord.findById(req.params.id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "Plant Material Record not found"
            });
        }

        const updateData = {
            ...req.body,
            lastEditedBy: req.body.lastEditedBy
        };

        const updatedPlantMaterials =
            req.body.plantMaterialDetails ||
            existingRecord.plantMaterialDetails;

        updateData.plantMaterialDetails = updatedPlantMaterials;

        await PlantMaterialRecord.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            message: "Plant Material Record Updated Successfully"
        });
    }
    catch (error) {
        console.log(error);
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
        const record = await PlantMaterialRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        await PlantMaterialRecord.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Plant Material Record Deleted Successfully"
        });
    }
    catch (error) {
        console.log(error);
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
// EXPORT Plant Material EXCEL
// ===============================
router.get("/export", async (req, res) => {
    try {
        const records = await PlantMaterialRecord.find();

        const recordSheet = [];

        records.forEach(record => {
            record.plantMaterialDetails.forEach(plantMaterial => {
                recordSheet.push({
                    "Year": record.year,
                    "Year / Month": record.yearMonth,
                    "Requirement Date": record.requirementDate,
                    "REQ. INDENTOR NAME": record.reqIndentorName,
                    "REQ. INDENTOR DEPT.": record.reqIndentorDept,
                    "Requirement": record.requirement,
                    "Material Code": plantMaterial.materialCode,
                    "ITEM DESCRIPTION": plantMaterial.itemDescription,
                    "Qty": plantMaterial.quantity,
                    "Indent / PR": record.prNum,
                    "PO": record.poNum,
                    "Purchaser Name": record.purchaserName,
                    "Current Progress": record.currentProgress,
                    "TRACKING ID": record.trackingId,
                    "COST CENTRE": record.costCentre,
                    "Project Name / WBS": record.projectName,
                    "Indent Mail Request": record.indentMailRequest,
                    "REMARK": record.remark,
                    "Material / Service Delivery Date": record.materialDeliveryDate,
                    "Material Received": record.materialReceived,
                    "SRR Cleared": record.srrCleared
                });
            });
        });

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(recordSheet, {
            header: [
                "Year",
                "Year / Month",
                "Requirement Date",
                "REQ. INDENTOR NAME",
                "REQ. INDENTOR DEPT.",
                "Requirement",
                "Material Code",
                "ITEM DESCRIPTION",
                "Qty",
                "Indent / PR",
                "PO",
                "Purchaser Name",
                "Current Progress",
                "TRACKING ID",
                "COST CENTRE",
                "Project Name / WBS",
                "Indent Mail Request",
                "REMARK",
                "Material / Service Delivery Date",
                "Material Received",
                "SRR Cleared"
            ]
        });


        XLSX.utils.book_append_sheet(workbook, worksheet, "Plant Material Records");

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
            "attachment; filename=Plant_Material_Export.xlsx"
        );

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.send(buffer);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Export Failed"
        });
    }
});


// ===============================
// IMPORT Plant Material EXCEL
// ===============================
router.post("/import", excelUpload.single("excelFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);

        const recordSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Plant Material Records"]);

        const groupedRecords = {};

        recordSheet.forEach(row => {
            const prNum = String(row["Indent / PR"]).trim();
            
            if (!groupedRecords[prNum]) {

                groupedRecords[prNum] = {
                    year: row["Year"] || "",
                    yearMonth: row["Year / Month"] || "",
                    requirementDate: parseExcelDate(row["Requirement Date"]),
                    reqIndentorName: row["REQ. INDENTOR NAME"] || "",
                    reqIndentorDept: row["REQ. INDENTOR DEPT."] || "",
                    requirement: row["Requirement"] || "",
                    prNum,
                    poNum: row["PO"] || "",
                    purchaserName: row["Purchaser Name"] || "",
                    currentProgress: row["Current Progress"] || "",
                    trackingId: row["TRACKING ID"] || "",
                    costCentre: row["COST CENTRE"] || "",
                    projectName: row["Project Name / WBS"] || "",
                    indentMailRequest: row["Indent Mail Request"] || "",
                    remark: row["REMARK"] || "",
                    materialDeliveryDate: parseExcelDate(row["Material / Service Delivery Date"]),
                    materialReceived: row["Material Received"] || "",
                    srrCleared: row["SRR Cleared"] || "",
                    plantMaterialDetails: []
                };
            }
            
            groupedRecords[prNum].plantMaterialDetails.push({
                materialCode: row["Material Code"] || "",
                itemDescription: row["ITEM DESCRIPTION"] || "",
                quantity: Number(row["Qty"]) || 0
            
            });
        });
        
        let importedRecords = 0;
        let skippedRecords = 0;

        for (const prNum of Object.keys(groupedRecords)) {
            const existingRecord = await PlantMaterialRecord.findOne({prNum});
            
            if (existingRecord) {
                skippedRecords++;
                continue;
            }

            const recordData = groupedRecords[prNum];

            const record = new PlantMaterialRecord({
                year: recordData.year,
                yearMonth: recordData.yearMonth,
                requirementDate: recordData.requirementDate,
                reqIndentorName: recordData.reqIndentorName,
                reqIndentorDept: recordData.reqIndentorDept,
                requirement: recordData.requirement,
                plantMaterialDetails: recordData.plantMaterialDetails,
                prNum: recordData.prNum,
                poNum: recordData.poNum,
                purchaserName: recordData.purchaserName,
                currentProgress: recordData.currentProgress,
                trackingId: recordData.trackingId,
                costCentre: recordData.costCentre,
                projectName: recordData.projectName,
                indentMailRequest: recordData.indentMailRequest,
                remark: recordData.remark,
                materialDeliveryDate: recordData.materialDeliveryDate,
                materialReceived: recordData.materialReceived,
                srrCleared: recordData.srrCleared,
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
            console.log(error);
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
        const records = await PlantMaterialRecord.find(
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
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


/* =========================
    Export these all routes so that we can use it anywhere
========================= */
module.exports = router;