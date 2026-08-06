const mongoose = require("mongoose");

const contractDetailSchema = new mongoose.Schema({
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContractRecord",
        required: true,
        index: true
    },
    serviceCodes: {
        type: [String],
        required: true,
        default: []
    },
    invoiceNumber: {
        type: String,
        required: true,
        trim: true
    },
    invoiceDate: {
        type: Date,
        required: true
    },
    trackingNumber: {
        type: String,
        default: "",
        trim: true
    },
    invoicePeriodStartDate: {
        type: Date,
        required: true
    },
    invoicePeriod: {
        type: String,
        required: true
    },
    invoicePeriodEndDate: {
        type: Date,
        required: true
    },
    invoiceAmount: {
        type: Number,
        required: true
    },
    serviceEntryNumber: {
        type: String,
        required: true,
        trim: true
    },
    documentNumber: {
        type: String,
        default: "",
        trim: true
    },
    invoicePdf: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});


module.exports = mongoose.model("ContractDetail", contractDetailSchema);