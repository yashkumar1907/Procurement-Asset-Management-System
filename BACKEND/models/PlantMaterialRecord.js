const mongoose = require("mongoose");

const plantMaterialRecordSchema = new mongoose.Schema({
    year: {
        type: String,
        default: ""
    },
    yearMonth: {
        type: String,
        default: ""
    },
    requirementDate: {
        type: Date
    },
    reqIndentorName: {
        type: String,
        default: ""
    },
    reqIndentorDept: {
        type: String,
        default: ""
    },
    requirement: {
        type: String,
        default: ""
    },
    plantMaterialDetails: [
        {
            materialCode: {
                type: String,
                default: ""
            },
            itemDescription: {
                type: String,
                default: ""
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
        default: ""
    },
    currentProgress: {
        type: String,
        default: ""
    },
    trackingId: {
        type: String,
        default: ""
    },
    costCentre: {
        type: String,
        default: ""
    },
    projectName: {
        type: String,
        default: ""
    },
    indentMailRequest: {
        type: String,
        default: ""
    },
    remark: {
        type: String,
        default: ""
    },
    materialDeliveryDate: {
        type: Date
    },
    materialReceived: {
        type: String,
        default: ""
    },
    srrCleared: {
        type: String,
        default: ""
    },
    lastEditedBy: {
        type: String,
        default: ""
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PlantMaterialRecord", plantMaterialRecordSchema);