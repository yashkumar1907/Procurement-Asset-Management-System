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

const os = require("os");


/* =========================
   Creates a route container (Instead of app)
========================= */
const router = express.Router();


/* =========================
   Import Record Model
========================= */
const ContractRecord = require("../models/ContractRecord");


/* =========================
   Import RecordDetail Model
========================= */
const ContractDetail = require("../models/ContractDetail");


/* =========================
   Import Excel Model
========================= */
const XLSX = require("xlsx");



const uploadsDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const tempDir = path.join(os.tmpdir(), "jsl-uploads");

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}


/* =========================
   MULTER CONFIGURATION
========================= */
const storage = multer.diskStorage({
    // Where to store files
    destination: function(req, file, cb) {
        cb(null, tempDir);
    },
    // File Name
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
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
    storage: storage,
    fileFilter: function(req, file, cb) {
        const allowedTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error("Only Excel files allowed"),false);
        }
    }
});


// ===============================
// GET AVAILABLE REFERENCE PO
// ===============================
router.get("/reference-pos", async (req, res) => {
    try {
        const records = await ContractRecord.find({
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
        // JSON.parse converts string into array
        const documentTypes = req.body.documentTypes ? JSON.parse(req.body.documentTypes): [];

        // Used to map files to their types (means justification.pdf maps to Justification type))
        const documents = req.files ? req.files.map((file, index) => ({type: documentTypes[index], fileName: file.filename})): [];

        // JSON.parse converts string into array
        const parsedServiceDetails = req.body.serviceDetails ? JSON.parse(req.body.serviceDetails) : [];

        const totalPoAmount =
            parsedServiceDetails.reduce(
                (sum, service) =>
                    sum + (Number(service.quantity || 0) * Number(service.pricePerQuantity || 0)), 0 );

            if (req.body.referencePO) {
                const referenceRecord = await ContractRecord.findById(req.body.referencePO);
                
                if (!referenceRecord) {
                    return res.status(404).json({
                        message: "Reference PO not found"
                    });
                }

                if (referenceRecord.renewed) {
                    return res.status(400).json({
                        message: "Selected Reference PO has already been renewed."
                    });
                }
            }

        // Create new record
        const record = new ContractRecord({
            ...req.body,
            referencePO: req.body.referencePO || null,
            lastEditedBy: req.body.lastEditedBy,
            poAmount: totalPoAmount,
            balanceAmount: totalPoAmount,
            serviceDetails: parsedServiceDetails,
            documents
        });

        await record.save();
        if (req.body.referencePO) {
            await ContractRecord.findByIdAndUpdate(
                req.body.referencePO,
                {
                    renewed: true,
                    renewedWith: record._id
                }
            );
        }

        res.status(201).json({
            message: "Contract Record Added Successfully"
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
        const records = await ContractRecord.find().lean();

        for (const record of records) {
            record.invoiceCount =
                await ContractDetail.countDocuments({
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
// UPDATE RECORD (Put /api/records/123)
// ===============================
router.put("/:id", upload.array("documents", 10), async (req, res) => {
    try {
        // Find existing record (PO)
        const existingRecord = await ContractRecord.findById(req.params.id);
        if (!existingRecord) {
            return res.status(404).json({
                message: "Contract Record not found"
            });
        }
        
        // And its corresponding details (Invoice)
        const details = await ContractDetail.find({recordId: req.params.id});

        // Sum of all invoice amounts
        const totalPaidAmount = details.reduce((sum, detail) => sum + (detail.invoiceAmount || 0), 0);

        const newReferencePO = req.body.referencePO || null;

        if (newReferencePO && newReferencePO === req.params.id) {
            return res.status(400).json({
                message: "A PO cannot reference itself."
            });
        }

        const oldReferencePO = existingRecord.referencePO
            ? existingRecord.referencePO.toString()
            : null;

        
        if (newReferencePO) {
            const referenceRecord = await ContractRecord.findById(newReferencePO);
        
            if (!referenceRecord) {
                return res.status(404).json({
                    message: "Reference PO not found"
                });
            }

            if (referenceRecord.renewed && oldReferencePO !== newReferencePO) {
                return res.status(400).json({
                    message: "Selected Reference PO has already been renewed."
                });
            }
        }

        const updateData = {
            ...req.body,
            referencePO: newReferencePO,
            lastEditedBy: req.body.lastEditedBy
        };

        if (req.body.poEndDate && new Date(req.body.poEndDate).getTime() !== new Date(existingRecord.poEndDate).getTime()) {
            updateData.twoMonthReminderSentAt = null;
            updateData.oneMonthReminderSentAt = null;
        }

        
        const updatedServices = req.body.serviceDetails ? JSON.parse(req.body.serviceDetails) : existingRecord.serviceDetails;
        
        const totalPoAmount =
            updatedServices.reduce(
                (sum, service) =>
                    sum + (Number(service.quantity || 0) * Number(service.pricePerQuantity || 0)), 0 );

        // Checks if the new PO amount should be greater than already paid amount
        if (totalPoAmount < totalPaidAmount){
            return res.status(400).json({
                message: `PO Amount cannot be less than total paid amount (${totalPaidAmount})`
            });
        }

        updateData.balanceAmount = totalPoAmount - totalPaidAmount;
        updateData.poAmount = totalPoAmount;

        // If service details is updated
        if (req.body.serviceDetails) {
            const newServices = JSON.parse(req.body.serviceDetails);

            // Checks if its corresponding invoice is present is detailed table
            const existingDetails = await ContractDetail.find({recordId: req.params.id});

            // Old service code
            const serviceCodesInUse = existingDetails.flatMap(detail => detail.serviceCodes || []);

            // New service code
            const updatedServiceCodes = newServices.map(service => service.code);
            const removedServiceCodes = serviceCodesInUse.filter(code => !updatedServiceCodes.includes(code));

            // When invoice of any service exits then its service code can't be deleted
            if (removedServiceCodes.length > 0) {
                return res.status(400).json({
                    message: `Cannot remove Service Code(s): ${removedServiceCodes.join(", ")} because invoice details exist.`
                });
            }
            updateData.serviceDetails = newServices;
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
                await ContractRecord.findByIdAndUpdate(
                    oldReferencePO,
                    {
                        renewed: false,
                        renewedWith: null
                    }
                );
            }
        
            // Add link to newly selected Reference PO
            if (newReferencePO) {
                await ContractRecord.findByIdAndUpdate(
                    newReferencePO,
                    {
                        renewed: true,
                        renewedWith: existingRecord._id
                    }
                );
            }
        }
        
        await ContractRecord.findByIdAndUpdate(req.params.id, updateData);

        res.status(200).json({
            message: "Contract Record Updated Successfully"
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
        const record = await ContractRecord.findById(req.params.id);
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
        const record = await ContractRecord.findById(req.params.id);

        // Restore previous Reference PO
        if (record.referencePO) {
            await ContractRecord.findByIdAndUpdate(
                record.referencePO,
                {
                    renewed: false,
                    renewedWith: null
                }
            );
        }


        if (!record) {
            return res.status(404).json({
                message: "Record not found"
            });
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
        const details = await ContractDetail.find({recordId: req.params.id});
        
        // DELETE INVOICE PDFs
        details.forEach(detail => {
            if (detail.invoicePdf) {
                const filePath = path.join(__dirname, "../uploads", detail.invoicePdf);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        });

        // Remove renewal link from any record that points to this record
        await ContractRecord.updateMany(
            {
                renewedWith: record._id
            },
            {
                $set: {
                    renewed: false,
                    renewedWith: null
                }
            }
        );

        // Delete all invoices of that PO
        await ContractDetail.deleteMany({recordId: req.params.id});
        await ContractRecord.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "Contract Record Deleted Successfully"
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
// EXPORT CONTRACT EXCEL
// ===============================
router.get("/export", async (req, res) => {
    try {
        const records = await ContractRecord.find();
        const details = await ContractDetail.find();

        const recordSheet = [];

        records.forEach(record => {
            record.serviceDetails.forEach(service => {
                recordSheet.push({
                    "Vendor Name": record.vendorName,
                    "Vendor Code": record.vendorCode,
                    "Purchase Requestor (PR)": record.pr,
                    "Purchase Order (PO)": record.po,
                    "PO Date": record.poDate,
                    "PO Description": record.poDescription,
                    "Type": service.itemType,
                    "Service / Material Code": service.code,
                    "Service / Material Short Text": service.shortText,
                    "Quantity": service.quantity,
                    "Price Per Quantity": service.pricePerQuantity,
                    "PO Start Date": record.poStartDate,
                    "PO Period": record.poPeriod,
                    "PO End Date": record.poEndDate,
                    "PO Amount": record.poAmount,
                    "Balance Amount": record.balanceAmount
                });
            });
        });
        const detailSheet = [];

        details.forEach(detail => {
            const record = records.find(r => r._id.toString() === detail.recordId.toString());

            detailSheet.push({
                "Purchase Order (PO)": record?.po || "",
                "Service Code": (detail.serviceCodes || []).join(", "),
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
                "Type",
                "Service / Material Code",
                "Service / Material Short Text",
                "Quantity",
                "Price Per Quantity",
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
                "Service Code",
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

        XLSX.utils.book_append_sheet(workbook, worksheet1, "Contract Records");
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
            "attachment; filename=Contract_Export.xlsx"
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
// IMPORT CONTRACT EXCEL
// ===============================
router.post("/import", excelUpload.single("excelFile"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "Please upload Excel file"
            });
        }

        const workbook = XLSX.readFile(req.file.path);

        const recordSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Contract Records"]);
        
        const detailSheet = XLSX.utils.sheet_to_json(workbook.Sheets["Invoice Details"]);

        const groupedRecords = {};

        recordSheet.forEach(row => {
            const po = String(row["Purchase Order (PO)"]).trim();

            if (!groupedRecords[po]) {
                groupedRecords[po] = {
                    vendorName: row["Vendor Name"],
                    vendorCode: row["Vendor Code"],
                    pr: row["Purchase Requestor (PR)"],
                    po,
                    poDate: parseExcelDate(row["PO Date"]),
                    poDescription: row["PO Description"],
                    poStartDate: parseExcelDate(row["PO Start Date"]),
                    poPeriod: row["PO Period"],
                    poEndDate: parseExcelDate(row["PO End Date"]),
                    serviceDetails: []
                };
            }

            groupedRecords[po].serviceDetails.push({
                itemType: String(row["Type"]).toLowerCase(),
                code: String(row["Service / Material Code"]),
                shortText: row["Service / Material Short Text"],
                quantity: Number(row["Quantity"]),
                pricePerQuantity: Number(row["Price Per Quantity"])
            });
        });

        let importedRecords = 0;
        let importedInvoices = 0;
        let skippedRecords = 0;

        const poMap = {};

        for (const po of Object.keys(groupedRecords)) {
            const existingRecord = await ContractRecord.findOne({po});

            if (existingRecord) {
                skippedRecords++;
                poMap[po] = existingRecord._id;
                continue;
            }

            const recordData = groupedRecords[po];

            const poAmount = recordData.serviceDetails.reduce((sum, service) => sum + (Number(service.quantity) * Number(service.pricePerQuantity)),0);

            const record =
                new ContractRecord({
                    vendorName: recordData.vendorName,
                    vendorCode: recordData.vendorCode,
                    pr: recordData.pr,
                    po: recordData.po,
                    poDate: recordData.poDate,
                    poDescription: recordData.poDescription,
                    poStartDate: recordData.poStartDate,
                    poPeriod: recordData.poPeriod,
                    poEndDate: recordData.poEndDate,
                    poAmount,
                    balanceAmount: poAmount,
                    serviceDetails: recordData.serviceDetails,

                    lastEditedBy: req.body.lastEditedBy,
                    
                    documents: []
                });

                await record.save();

                poMap[po] = record._id;
                importedRecords++;
            }
            for(const row of detailSheet) {
                const existingInvoice = await ContractDetail.findOne({
                    invoiceNumber: row["Invoice / External Number"]
                });
            
                if (existingInvoice) {
                    continue;
                }

                const po = String(row["Purchase Order (PO)"]).trim();
                const recordId = poMap[po];
                if (!recordId) {
                    continue;
                }

                const invoiceAmount = Number(row["Invoice Amount"]);
                if (isNaN(invoiceAmount)) {
                    continue;
                }

                const record = await ContractRecord.findById(recordId);
                if (!record) {
                    continue;
                }

                if (invoiceAmount > Number(record.balanceAmount)) {
                    continue;
                }

                const detail =
                    new ContractDetail({
                        recordId,
                        serviceCodes: row["Service Code"]
                            ? String(row["Service Code"])
                                .split(",")
                                .map(code => code.trim())
                                .filter(Boolean)
                            : [],
                        invoiceNumber: row["Invoice / External Number"],
                        invoiceDate: parseExcelDate(row["Invoice Date"]),
                        trackingNumber: row["Tracking Number"],
                        invoicePeriodStartDate: parseExcelDate(row["Invoice Period Start"]),
                        invoicePeriod: row["Invoice Period"],
                        invoicePeriodEndDate: parseExcelDate(row["Invoice Period End"]),
                        invoiceAmount,
                        serviceEntryNumber: row["Service Entry Number"],
                        documentNumber: row["Document Number"]
                    });

                await detail.save();

                record.balanceAmount -= invoiceAmount;
                await record.save();
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
    }
);


/* =========================
    Export these all routes so that we can use it anywhere
========================= */
module.exports = router;