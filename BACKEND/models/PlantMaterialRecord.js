const mongoose = require("mongoose");

const plantMaterialRecordSchema = new mongoose.Schema({
    year: {
        type: String,
        default: "",
        trim: true
    },
    yearMonth: {
        type: String,
        default: "",
        trim: true
    },
    requirementDate: {
        type: Date
    },
    reqIndentorName: {
        type: String,
        default: "",
        trim: true
    },
    reqIndentorDept: {
        type: String,
        default: "",
        trim: true
    },
    requirement: {
        type: String,
        default: "",
        trim: true
    },
    plantMaterialDetails: [
        {
            materialCode: {
                type: String,
                default: "",
                trim: true
            },
            itemDescription: {
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
    purchaserName: {
        type: String,
        default: "",
        trim: true
    },
    currentProgress: {
        type: String,
        default: "",
        trim: true
    },
    trackingId: {
        type: String,
        default: "",
        trim: true
    },
    costCentre: {
        type: String,
        default: "",
        trim: true
    },
    projectName: {
        type: String,
        default: "",
        trim: true
    },
    indentMailRequest: {
        type: String,
        default: "",
        trim: true
    },
    remark: {
        type: String,
        default: "",
        trim: true
    },
    materialDeliveryDate: {
        type: Date
    },
    materialReceived: {
        type: String,
        default: "",
        trim: true
    },
    srrCleared: {
        type: String,
        default: "",
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


module.exports = mongoose.model("PlantMaterialRecord", plantMaterialRecordSchema);