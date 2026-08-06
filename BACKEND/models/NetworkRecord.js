const mongoose = require("mongoose");

const networkRecordSchema = new mongoose.Schema({
    vendorName: {
        type: String,
        required: true,
        trim: true
    },
    vendorCode: {
        type: String,
        required: true,
        trim: true
    },
    pr: {
        type: String,
        required: true,
        trim: true
    },
    po: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    poDate: {
        type: Date,
        required: true
    },
    poDescription: {
        type: String,
        required: true,
        trim: true
    },
    poStartDate: {
        type: Date,
        required: true
    },
    poPeriod: {
        type: String,
        required: true,
        trim: true,
        enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"]
    },
    poEndDate: {
        type: Date,
        required: true
    },
    poAmount: {
        type: Number,
        required: true
    },
    balanceAmount: {
        type: Number,
        default: 0
    },
    lastEditedBy: {
        type: String,
        default: "",
        trim: true
    },
    renewed: {
        type: Boolean,
        default: false
    },
    renewedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NetworkRecord",
        default: null
    },
    twoMonthReminderSentAt: {
        type: Date,
        default: null
    },
    oneMonthReminderSentAt: {
        type: Date,
        default: null
    },
    referencePO: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "NetworkRecord",
        default: null
    },
    documents: [
        {
            type: {
                type: String,
                required: true,
                trim: true
            },
            fileName: {
                type: String,
                required: true,
                trim: true
            }
        }
    ]
}, {
    timestamps: true
});


module.exports = mongoose.model("NetworkRecord", networkRecordSchema);