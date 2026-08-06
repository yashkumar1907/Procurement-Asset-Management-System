const mongoose = require("mongoose");

const plantServiceRecordSchema = new mongoose.Schema({
    prReqDate: {
        type: Date,
        required: true
    },
    prCreationDate: {
        type: Date,
        required: true
    },
    prNum: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    plantServiceDetails: [
        {
            code: {
                type: String,
                default: "",
                trim: true
            },
            shortText: {
                type: String,
                default: "",
                trim: true
            },
            desc: {
                type: String,
                default: "",
                trim: true
            },
            quantity: {
                type: Number,
                default: 0
            },
            pricePerQuantity: {
                type: Number,
                default: 0
            }
        }
    ],
    prAmount: {
        type: Number,
        required: true,
        default: 0
    },
    poNum: {
        type: String,
        default: "",
        trim: true
    },
    poAmount: {
        type: Number,
        default: 0
    },
    lastEditedBy: {
        type: String,
        default: "",
        trim: true
    }
},
    {
        timestamps: true
    }
);


module.exports = mongoose.model("PlantServiceRecord", plantServiceRecordSchema);