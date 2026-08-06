const mongoose = require("mongoose");

const inventoryNetworkRecordSchema = new mongoose.Schema({
    prReqDate: {
        type: Date,
        required: true
    },
    prNum: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    poNum: {
        type: String,
        default: "",
        trim: true
    },
    networkDetails: [
        {
            code: {
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
            }
        }
    ],
    trackingId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    costCenter: {
        type: String,
        default: "",
        trim: true
    },
    projectName: {
        type: String,
        default: "",
        trim: true
    },
    currentProgress: {
        type: String,
        default: "",
        trim: true
    },
    purchaserName: {
        type: String,
        required: true,
        trim: true
    },
    srrNumber: {
        type: String,
        required: true,
        trim: true
    },
    grnNumber: {
        type: String,
        required: true,
        trim: true
    },
    remark: {
        type: String,
        required: true,
        trim: true
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


module.exports = mongoose.model("InventoryNetworkRecord", inventoryNetworkRecordSchema);