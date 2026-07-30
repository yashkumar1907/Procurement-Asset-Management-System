/* =========================
   MAIN BACKEND FRAMEWORK
========================= */
const express = require("express");


/* =========================
   Creates a route container
========================= */
const router = express.Router();


/* =========================
   Import WBS PROJECT Record Model
========================= */
const WbsProjectRecord = require("../models/WbsProjectRecord");


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
        const record =
            new WbsProjectRecord({
                ...req.body,
                lastEditedBy: req.body.lastEditedBy
            });

        await record.save();

        res.status(201).json({
            message: "Wbs Project Record Added Successfully"
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
        const records = await WbsProjectRecord.find().lean();
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
        const existingRecord = await WbsProjectRecord.findById(req.params.id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "Wbs Project Record not found"
            });
        }

        const updateData = {
            ...req.body,
            lastEditedBy: req.body.lastEditedBy
        };

        await WbsProjectRecord.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            message: "Wbs Project Record Updated Successfully"
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
        const record = await WbsProjectRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        await WbsProjectRecord.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Wbs Project Record Deleted Successfully"
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
// EXPORT WBS PROJECT EXCEL
// ===============================
router.get("/export", async (req, res) => {
    try {

        // FETCH ALL RECORDS
        const records = await WbsProjectRecord.find();

        // CREATE EXCEL DATA
        const excelData = records.map(record => ({
            "WBS Number": record.WbsNum,
            "Description": record.Description,
            "Budget": record.Budget,
            "Transfer": record.Transfer,
            "Released": record.Released,
            "Preq Comm": record.PreqComm,
            "PO Commt": record.POCommt,
            "Commitment": record.Commitment,
            "Actual": record.Actual,
            "Assigned": record.Assigned,
            "Total Available": record.TotalAvailable
        }));

        // CREATE WORKBOOK
        const workbook = XLSX.utils.book_new();

        // CREATE WORKSHEET
        const worksheet = XLSX.utils.json_to_sheet(excelData, {
            header: [
                "WBS Number",
                "Description",
                "Budget",
                "Transfer",
                "Released",
                "Preq Comm",
                "PO Commt",
                "Commitment",
                "Actual",
                "Assigned",
                "Total Available"
            ]
        });
        
        // APPEND SHEET
        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "WBS Project Records"
        );

        // CREATE BUFFER
        const buffer = XLSX.write(workbook, {
            type: "buffer",
            bookType: "xlsx"
        });

        // RESPONSE HEADERS
        res.setHeader(
            "Content-Disposition",
            "attachment; filename=WBS_Project_Records.xlsx"
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
// IMPORT WBS PROJECT EXCEL
// ===============================
router.post("/import", excelUpload.single("excelFile"), async (req, res) => {
    try {
        // CHECK FILE
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload an Excel file"
            });
        }

        // READ EXCEL FILE
        const workbook = XLSX.readFile(req.file.path);

        const worksheet = workbook.Sheets["WBS Project Records"];

        if (!worksheet) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                message: "Sheet 'WBS Project Records' not found"
            });
        }

        // CONVERT EXCEL TO JSON
        const excelData = XLSX.utils.sheet_to_json(worksheet);

        let importedRecords = 0;
        let skippedRecords = 0;

        // SAVE RECORDS
        for (const row of excelData) {

            // CHECK DUPLICATE WBS NUMBER
            const existingRecord = await WbsProjectRecord.findOne({
                WbsNum: String(row["WBS Number"] || "").trim()
            });

            if (existingRecord) {
                skippedRecords++;
                continue;
            }

            const record = new WbsProjectRecord({
                WbsNum: String(row["WBS Number"] || "").trim(),
                Description: row["Description"] || "",
                Budget: Number(row["Budget"]) || 0,
                Transfer: row["Transfer"] || "",
                Released: row["Released"] || "",
                PreqComm: row["Preq Comm"] || "",
                POCommt: row["PO Commt"] || "",
                Commitment: row["Commitment"] || "",
                Actual: Number(row["Actual"]) || 0,
                Assigned: row["Assigned"] || "",
                TotalAvailable: row["Total Available"] || "",
                lastEditedBy: req.body.lastEditedBy
            });

            await record.save();
            importedRecords++;
        }

        // DELETE TEMP FILE
        fs.unlinkSync(req.file.path);
        res.status(200).json({
            message: `Import Completed\nImported Records: ${importedRecords}\nSkipped Records: ${skippedRecords}`
        });
    }
    catch (error) {
        console.error(error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: "Import Failed"
        });
    }
});


/* =========================
    Export these all routes so that we can use it anywhere
========================= */
module.exports = router;