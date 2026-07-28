const mongoose = require("mongoose");

const contractRecordSchema = new mongoose.Schema({
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
        required: true
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
    serviceDetails: [
        {
            itemType: {
                type: String,
                default: ""
            },
            code: {
                type: String,
                default: ""
            },
            shortText: {
                type: String,
                default: ""
            },
            quantity: {
                type: Number,
                default: 0
            },
            pricePerQuantity: {
                type: Number,
                default: 0
            },
        }
    ],
    poStartDate: {
        type: Date,
        required: true
    },
    poPeriod: {
        type: String,
        required: true
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
        default: ""
    },
    renewed: {
        type: Boolean,
        default: false
    },
    
    renewedWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ContractRecord",
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
        ref: "ContractRecord",
        default: null
    },
    documents: [
        {
            type: {
                type: String,
                required: true
            },
            fileName: {
                type: String,
                required: true
            }
        }
    ]
}, {
    timestamps: true
});


module.exports = mongoose.model("ContractRecord", contractRecordSchema);