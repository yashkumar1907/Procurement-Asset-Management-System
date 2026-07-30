/* =========================
   MAIN BACKEND FRAMEWORK (Used for get, push, put, delete route)
========================= */
const express = require("express");


/* =========================
   Used to upload PDF files
========================= */
const multer = require("multer");


/* =========================
   Used to delete old PDF files
========================= */
const fs = require("fs");


/* =========================
Used when building upload file paths
========================= */
const path = require("path");


/* =========================
   Creates a route container (Instead of app)
========================= */
const router = express.Router();

/* =========================
   Import Record Model
========================= */
const AmcRecord = require("../models/AmcRecord");


/* =========================
   Import RecordDetail Model
========================= */
const AmcDetail = require("../models/AmcDetail");


/* =========================
   Import EXCEL
========================= */
const XLSX = require("xlsx");


// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Create temp folder if it doesn't exist
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

/* =========================
   MULTER CONFIGURATION
========================= */
const storage = multer.diskStorage({
    // Where to store files
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    // File Name
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
    }
});


/* =========================
   CHECKING THE TYPE OF FILE, ONLY PDF FILE CAN BE UPLOADED
========================= */
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === "application/pdf") {
            cb(null, true);
        }
        else {
            cb(new Error("Only PDF files allowed"), false);
        }
    }
});

const excelUpload = multer({
    dest: tempDir
});


// ===============================
// GET AVAILABLE REFERENCE PO
// ===============================
router.get("/reference-pos", async (req, res) => {
    try {
        const records = await AmcRecord.find({
            renewed: false
        }).sort({
            poEndDate: 1
        });

        res.json(records);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// CREATE RECORD (Post /api/records)
// ===============================
router.post("/", upload.array("documents", 10), async (req, res) => {
    try {
        const referencePO = req.body.referencePO || null;

        if (referencePO) {
            const referenceRecord = await AmcRecord.findById(referencePO);

            if (!referenceRecord) {
                return res.status(400).json({
                    message: "Selected Reference PO does not exist"
                });
            }

            if (referenceRecord.renewed) {
                return res.status(400).json({
                    message: "Selected Reference PO is already renewed"
                });
            }
        }

        // JSON.parse converts string into array
        const documentTypes = req.body.documentTypes ? JSON.parse(req.body.documentTypes): [];

        // Used to map files to their types (means justification.pdf maps to Justification type))
        const documents = req.files ? req.files.map((file, index) => ({type: documentTypes[index], fileName: file.filename})): [];

        // Create new record
        const record = new AmcRecord({
            ...req.body,
            referencePO,
            lastEditedBy: req.body.lastEditedBy,
            balanceAmount: Number(req.body.poAmount || 0),
            documents
        });

        await record.save();

        if (req.body.referencePO) {
            await AmcRecord.findByIdAndUpdate(
                req.body.referencePO,
                    {
                        renewed: true,
                        renewedWith: record._id
                    }
            );
        }
        res.status(201).json({
            message: "AMC Record Added Successfully"
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
// GET ALL RECORDS (Get /api/records)
// ===============================
router.get("/", async (req, res) => {
    try {
        const records = await AmcRecord.find().lean();

        for (const record of records) {
            record.invoiceCount = await AmcDetail.countDocuments({
                recordId: record._id
            });
        }

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
// UPDATE AMC RECORD (Put /api/records/123)
// ===============================
router.put("/:id", upload.array("documents", 10), async (req, res) => {
    try {
        // Find existing record (PO)
        const existingRecord = await AmcRecord.findById(req.params.id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        // And its corresponding details (Invoice)
        const details = await AmcDetail.find({recordId: req.params.id});

        // Sum of all invoice amounts
        const totalPaidAmount = details.reduce((sum, detail) => sum + (detail.invoiceAmount || 0), 0);

        // Checks if the new PO amount should be greater than already paid amount
        if (req.body.poAmount && Number(req.body.poAmount) < totalPaidAmount) {
            return res.status(400).json({
                message: `PO Amount cannot be less than total paid amount (${totalPaidAmount})`
            });
        }

        const newReferencePO = req.body.referencePO || null;

        // Prevent selecting the same PO as reference
        if (newReferencePO && newReferencePO === req.params.id) {
            return res.status(400).json({
                message: "A PO cannot reference itself"
            });
        }

        // Validate selected Reference PO
        if (newReferencePO) {
            const referenceRecord = await AmcRecord.findById(newReferencePO);

            if (!referenceRecord) {
                return res.status(400).json({
                    message: "Selected Reference PO does not exist"
                });
            }

            if (
                referenceRecord.renewed &&
                (!existingRecord.referencePO ||
                existingRecord.referencePO.toString() !== newReferencePO)
            ) {
                return res.status(400).json({
                    message: "Selected Reference PO is already renewed"
                });
            }
        }

        const oldReferencePO = existingRecord.referencePO
            ? existingRecord.referencePO.toString()
            : null;
        

        const updateData = {
            ...req.body,
            referencePO: newReferencePO,
            lastEditedBy: req.body.lastEditedBy
        };

        if (req.body.poEndDate && new Date(req.body.poEndDate).getTime() !== new Date(existingRecord.poEndDate).getTime()) {
            updateData.twoMonthReminderSentAt = null;
            updateData.oneMonthReminderSentAt = null;
        }


        // If PO amount is updated than update the balance amount
        if (req.body.poAmount) {
            updateData.balanceAmount = Number(req.body.poAmount) - totalPaidAmount;
        }

        // If documents is updated
        if (req.body.removedDocuments) {
            const removedIds = JSON.parse(req.body.removedDocuments);
            updateData.documents =
                existingRecord.documents.filter(
                    doc => !removedIds.includes(
                        doc._id.toString()
                    )
                );
        }
        else {
            updateData.documents = existingRecord.documents;
        }
        
        if (req.files && req.files.length > 0) {
            const documentTypes = req.body.documentTypes ? JSON.parse(req.body.documentTypes): [];
            const newDocuments = req.files.map((file, index) => ({type: documentTypes[index], fileName: file.filename}));
        
            updateData.documents = [
                ...(updateData.documents || []),
                ...newDocuments
            ];
        }

        if (oldReferencePO !== newReferencePO) {

            // Remove link from previous Reference PO
            if (oldReferencePO) {
                await AmcRecord.findByIdAndUpdate(
                    oldReferencePO,
                    {
                        renewed: false,
                        renewedWith: null
                    }
                );
            }
        
            // Add link to newly selected Reference PO
            if (newReferencePO) {
                await AmcRecord.findByIdAndUpdate(
                    newReferencePO,
                    {
                        renewed: true,
                        renewedWith: existingRecord._id
                    }
                );
            }
        }


        await AmcRecord.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            message: "AMC Record Updated Successfully"
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
// REMOVE PDF (Delete /api/records/123/document/abc.pdf)
// ===============================
router.delete("/:id/document/:filename", async (req, res) => {
    try {
        const record = await AmcRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        const filename = decodeURIComponent(req.params.filename);
        const filePath = path.join(__dirname, "../uploads", filename);

        // Remove file path (means delete pdf from folder)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        record.documents = record.documents.filter(doc => doc.fileName !== filename);

        await record.save();
        res.status(200).json({
            message: "Document Removed Successfully"
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
// DELETE RECORD (Delete /api/records/123)
// ===============================
router.delete("/:id", async (req, res) => {
    try {
        const record = await AmcRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
        }

        // Restore previous Reference PO if this record was a renewal
        if (record.referencePO) {
            await AmcRecord.findByIdAndUpdate(
                record.referencePO,
                {
                    renewed: false,
                    renewedWith: null
                }
            );
        }

        // DELETE ALL UPLOADED PDFs
        if (record.documents && record.documents.length > 0) {
            record.documents.forEach(doc => {
                const filePath = path.join(__dirname, "../uploads", doc.fileName);

                // Remove all files path
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }

        // GET ALL DETAILS FIRST
        const details = await AmcDetail.find({recordId: req.params.id});
        
        // DELETE INVOICE PDFs
        details.forEach(detail => {
            if (detail.invoicePdf) {
                const filePath = path.join(__dirname, "../uploads", detail.invoicePdf);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });

        // Delete all invoices of that PO
        await AmcDetail.deleteMany({recordId: req.params.id});
        await AmcRecord.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "AMC Record Deleted Successfully"
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

    // Already a JS Date
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

router.get("/export", async (req, res) => {
    try {
        const records = await AmcRecord.find();
        const details = await AmcDetail.find();

        const recordSheet = [];

        records.forEach(record => {
            recordSheet.push({
                "Vendor Name": record.vendorName,
                "Vendor Code": record.vendorCode,
                "Purchase Requestor (PR)": record.pr,
                "Purchase Order (PO)": record.po,
                "PO Date": record.poDate,
                "PO Description": record.poDescription,
                "PO Start Date": record.poStartDate,
                "PO Period": record.poPeriod,
                "PO End Date": record.poEndDate,
                "PO Amount": record.poAmount,
                "Balance Amount": record.balanceAmount
            });
        });

        const detailSheet = [];

        details.forEach(detail => {
            const record = records.find(r => r._id.toString() === detail.recordId.toString());

            detailSheet.push({
                "Purchase Order (PO)": record?.po || "",
                "Invoice / External Number": detail.invoiceNumber,
                "Invoice Date": detail.invoiceDate,
                "Tracking Number": detail.trackingNumber,
                "Invoice Period Start": detail.invoicePeriodStartDate,
                "Invoice Period": detail.invoicePeriod,
                "Invoice Period End": detail.invoicePeriodEndDate,
                "Invoice Amount": detail.invoiceAmount,
                "Service Entry Number": detail.serviceEntryNumber,
                "Document Number": detail.documentNumber
            });
        });

        const workbook = XLSX.utils.book_new();
        const worksheet1 = XLSX.utils.json_to_sheet(recordSheet, {
            header: [
                "Vendor Name",
                "Vendor Code",
                "Purchase Requestor (PR)",
                "Purchase Order (PO)",
                "PO Date",
                "PO Description",
                "PO Start Date",
                "PO Period",
                "PO End Date",
                "PO Amount",
                "Balance Amount"
            ]
        });
        
        const worksheet2 = XLSX.utils.json_to_sheet(detailSheet, {
            header: [
                "Purchase Order (PO)",
                "Invoice / External Number",
                "Invoice Date",
                "Tracking Number",
                "Invoice Period Start",
                "Invoice Period",
                "Invoice Period End",
                "Invoice Amount",
                "Service Entry Number",
                "Document Number"
            ]
        });

        XLSX.utils.book_append_sheet(workbook, worksheet1, "AMC Records");
        XLSX.utils.book_append_sheet(workbook, worksheet2, "Invoice Details");

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
            "attachment; filename=AMC_Export.xlsx"
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


router.post("/import", excelUpload.single("excelFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);
        
        const recordSheet = XLSX.utils.sheet_to_json(workbook.Sheets["AMC Records"]);

        const detailSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Invoice Details"]);

        let importedRecords = 0;
        let importedInvoices = 0;
        let skippedRecords = 0;

        const poMap = {};

        for (const row of recordSheet) {
            const po = String(row["Purchase Order (PO)"]).trim();
            
            const existingRecord = await AmcRecord.findOne({po});
            if (existingRecord) {
                skippedRecords++;
                poMap[po] = existingRecord._id;
                continue;
            }

            const record = new AmcRecord({
                vendorName: row["Vendor Name"],
                vendorCode: row["Vendor Code"],
                pr: row["Purchase Requestor (PR)"],
                po,
                poDate: parseExcelDate(row["PO Date"]),
                poDescription: row["PO Description"],
                poStartDate: parseExcelDate(row["PO Start Date"]),
                poPeriod: row["PO Period"],
                poEndDate: parseExcelDate(row["PO End Date"]),
                poAmount: Number(row["PO Amount"]),
                balanceAmount: Number(row["PO Amount"]),

                lastEditedBy: req.body.lastEditedBy,

                documents: []
            });

            await record.save();

            poMap[po] = record._id;
            importedRecords++;
        }

        for (const row of detailSheet) {
            const po = String(row["Purchase Order (PO)"]).trim();

            const recordId = poMap[po];
            if (!recordId) {
                continue;
            }

            const detail =
                new AmcDetail({
                    recordId,
                    invoiceNumber: row["Invoice / External Number"],
                    invoiceDate:parseExcelDate(row["Invoice Date"]),
                    trackingNumber: row["Tracking Number"],
                    invoicePeriodStartDate: parseExcelDate(row["Invoice Period Start"]),
                    invoicePeriod: row["Invoice Period"],
                    invoicePeriodEndDate: parseExcelDate(row["Invoice Period End"]),
                    invoiceAmount: Number(row["Invoice Amount"]),
                    serviceEntryNumber: row["Service Entry Number"],
                    documentNumber: row["Document Number"]
                });

                await detail.save();

                const record = await AmcRecord.findById(recordId);
                if (record) {
                    record.balanceAmount = Number(record.balanceAmount) - Number(row["Invoice Amount"]);
                    await record.save();
                }
                importedInvoices++;
            }
            fs.unlinkSync(req.file.path);
            res.status(200).json({
                message: `Import Completed\n\nImported Records: ${importedRecords}\nImported Invoices: ${importedInvoices}\nSkipped Records: ${skippedRecords}`
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({
                message: "Import Failed"
            });
        }
});


/* =========================
    Export these all routes so that we can use it anywhere
========================= */
module.exports = router;