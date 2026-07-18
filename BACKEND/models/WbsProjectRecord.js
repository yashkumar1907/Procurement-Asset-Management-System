const mongoose = require("mongoose");

const wbsProjectRecordSchema = new mongoose.Schema({
    SrNum: {
        type: Number,
        required: true,
        default: 0
    },
    WbsNum: {
        type: Number,
        required: true,
        default: 0
    },
    Description: {
        type: String,
        default: ""
    },
    Budget: {
        type: Number,
        required: true,
        default: 0
    },
    Transfer: {
        type: String,
        default: ""
    },
    Released: {
        type: String,
        default: ""
    },
    PreqComm: {
        type: String,
        default: ""
    },
    POCommt: {
        type: String,
        default: ""
    },
    Commitment: {
        type: String,
        default: ""
    },
    Actual: {
        type: Number,
        required: true,
        default: 0
    },
    Assigned: {
        type: String,
        default: ""
    },
    TotalAvailable: {
        type: String,
        default: ""
    },
    lastEditedBy: {
        type: String,
        default: ""
    },
    linkedModule: {
        type: String,
        default: ""
    },
    linkedRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model("WbsProjectRecord", wbsProjectRecordSchema);