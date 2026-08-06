const mongoose = require("mongoose");

const amcDetailSchema = new mongoose.Schema({
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AmcRecord",
        required: true,
        index: true
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
        type: Date
    },
    invoicePeriod: {
        type: String,
        required: true
    },
    invoicePeriodEndDate: {
        type: Date
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


module.exports = mongoose.model("AmcDetail", amcDetailSchema);