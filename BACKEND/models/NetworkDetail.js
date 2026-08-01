const mongoose = require("mongoose");

const networkDetailSchema = new mongoose.Schema({
    recordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NetworkRecord",
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
        default: ""
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
        required: true
    },
    documentNumber: {
        type: String,
        default: ""
    },
    invoicePdf: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});


module.exports = mongoose.model("NetworkDetail", networkDetailSchema);