/* =========================
   MAIN BACKEND FRAMEWORK (Used for get, push, put, delete route)
========================= */
const express = require("express");


/* =========================
   Used to upload PDF files
========================= */
const multer = require("multer");


/* =========================
   Creates a route container (Instead of app)
========================= */
const router = express.Router();


/* =========================
   Used to delete old PDF files
========================= */
const fs = require("fs");


/* =========================
    Used when building upload file paths
========================= */
const path = require("path");


/* =========================
    Import Record Model
========================= */
const NetworkRecord = require("../models/NetworkRecord");


/* =========================
    Import NetworkDetail Model
========================= */
const NetworkDetail = require("../models/NetworkDetail");


/* =========================
    MULTER CONFIGURATION
========================= */
const storage = multer.diskStorage({
    // Where to store files
    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },
    // File Name
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});


/* ===============================
    Upload middleware
=============================== */
const upload = multer({storage});


// ===============================
// TESTING ROUTE (Get /api/details/test)
// ===============================
router.get("/test", (req, res) => {
    res.json({
        message: "Detail Routes Working"
    });
});


// ===============================
// ADD DETAIL (Post /api/details)
// ===============================
router.post("/", upload.single("invoicePdf"), async (req, res) => {
    try {
        // Check PO
        const record = await NetworkRecord.findById(req.body.recordId);
        if (!record) {
            return res.status(404).json({
                message: "Network Record not found"
            });
        }

        // Check is invoice amount is greater than balance amount
        const invoiceAmount = Number(req.body.invoiceAmount);
        if (invoiceAmount > record.balanceAmount) {
            return res.status(400).json({
                message: "Invoice Amount should be less than or equal to Balance Amount"
            });
        }

        // Take data of new invoice and stores
        const detail = new NetworkDetail({
            recordId: req.body.recordId,
            serviceEntryNumber: req.body.serviceEntryNumber,
            invoiceNumber: req.body.invoiceNumber,
            trackingNumber: req.body.trackingNumber,
            documentNumber: req.body.documentNumber,
            invoiceDate: req.body.invoiceDate,
            invoicePeriodStartDate: req.body.invoicePeriodStartDate,
            invoicePeriod: req.body.invoicePeriod,
            invoicePeriodEndDate: req.body.invoicePeriodEndDate,
            invoiceAmount: Number(req.body.invoiceAmount),
            invoicePdf: req.file ? req.file.filename: ""
        });

        // Save the detail data
        await detail.save();

        // Reduce the invoice amount from the remaining amount
        if (record) {
            record.balanceAmount = (record.balanceAmount || 0) - Number(req.body.invoiceAmount || 0);

            record.lastEditedBy = req.body.lastEditedBy;

            await record.save();
        }

        res.status(201).json({
            message: "Network Detail Added Successfully"
        });
    }
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// GET DETAIL (Get /api/details/single/123) (Used to get all records of PO)
// ===============================
router.get("/single/:id", async (req, res) => {
    try {
        const detail = await NetworkDetail.findById(req.params.id);
        if (!detail) {
            return res.status(404).json({
                message: "Network Detail not found"
            });
        }
        res.status(200).json(detail);
    }
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});



// ===============================
// GET ALL DETAILS (For Excel Export)
// ===============================
router.get("/", async (req, res) => {
    try {
        const details = await NetworkDetail.find();

        res.status(200).json(details);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// GET DETAILS BY RECORD ID (Get /api/details/123) (Used to get single record of PO) (used in edit the invoice)
// ===============================
router.get("/:recordId", async (req, res) => {
    try {
        const details = await NetworkDetail.find({recordId: req.params.recordId});
        res.status(200).json(details);
    }
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// UPDATE DETAIL (Put /api/details/123)
// ===============================
router.put("/:id", upload.single("invoicePdf"), async (req, res) => {
    try {
        const detail = await NetworkDetail.findById(req.params.id);
        if (!detail) {
            return res.status(404).json({
                message: "Detail not found"
            });
        }

        const oldInvoiceAmount = detail.invoiceAmount || 0;
        const record = await NetworkRecord.findById(detail.recordId);
        const newInvoiceAmount = Number(req.body.invoiceAmount || 0);
        const allowedAmount = (record.balanceAmount || 0) + oldInvoiceAmount;
        if (newInvoiceAmount > allowedAmount) {
            return res.status(400).json({
                message: "Invoice Amount should be less than or equal to Balance Amount"
            });
        }

        // Updating the fields
        detail.serviceEntryNumber = req.body.serviceEntryNumber;
        detail.invoiceNumber = req.body.invoiceNumber;
        detail.trackingNumber = req.body.trackingNumber;
        detail.documentNumber = req.body.documentNumber;
        detail.invoicePeriodStartDate = req.body.invoicePeriodStartDate;
        detail.invoicePeriod = req.body.invoicePeriod;
        detail.invoicePeriodEndDate = req.body.invoicePeriodEndDate;
        detail.invoiceDate = req.body.invoiceDate;
        detail.invoiceAmount = Number(req.body.invoiceAmount);

        // If files is changed during edit
        if (req.file) {
            if (detail.invoicePdf) {
                const oldFile = path.join(__dirname, "../uploads", detail.invoicePdf);
                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }
            }
            detail.invoicePdf = req.file.filename;
        }

        // Remove existing invoice PDF
        if (req.body.removeInvoicePdf === "true") {
            if (detail.invoicePdf) {
                const oldFile = path.join(__dirname, "../uploads", detail.invoicePdf);
                
                if (fs.existsSync(oldFile)) {
                    fs.unlinkSync(oldFile);
                }
            }
            detail.invoicePdf = "";
        }

        await detail.save();
        
        // Update balance amount
        if (record) {
            record.balanceAmount = record.balanceAmount + oldInvoiceAmount - Number(req.body.invoiceAmount || 0);

            record.lastEditedBy = req.body.lastEditedBy;

            await record.save();
        }

        res.status(200).json({
            message: "Network Detail Updated Successfully"
        });
    }
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// DELETE DETAIL (Delete /api/details/123)
// ===============================
router.delete("/:id", async (req, res) => {
    try {
        const detail = await NetworkDetail.findById(req.params.id);
        if (!detail) {
            return res.status(404).json({
                message: "Detail not found"
            });
        }

        // Storing invoice amount because we have to update balance amount
        const invoiceAmount = detail.invoiceAmount || 0;

        const record = await NetworkRecord.findById(detail.recordId);
        if (!record) {
            return res.status(404).json({
                message: "Network Record not found"
            });
        }
        if (record) {
            record.balanceAmount = (record.balanceAmount || 0) + invoiceAmount;

            record.lastEditedBy = req.body.lastEditedBy;
            
            await record.save();
        }

        // Delete invoice pdf
        if (detail.invoicePdf) {
            const filePath = path.join(__dirname, "../uploads", detail.invoicePdf);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Deleting the Invoice
        await NetworkDetail.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "Network Detail Deleted Successfully"
        });
    }
    catch(error) {
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