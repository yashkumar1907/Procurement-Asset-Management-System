const mongoose = require("mongoose");

const wbsProjectRecordSchema = new mongoose.Schema({
    wbsNum: {
        type: String,
        required: true,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    budget: {
        type: Number,
        required: true,
        default: 0
    },
    transfer: {
        type: String,
        default: ""
    },
    released: {
        type: String,
        default: ""
    },
    preqComm: {
        type: String,
        default: ""
    },
    poCommt: {
        type: String,
        default: ""
    },
    commitment: {
        type: String,
        default: ""
    },
    actual: {
        type: Number,
        required: true,
        default: 0
    },
    assigned: {
        type: String,
        default: ""
    },
    totalAvailable: {
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


module.exports = mongoose.model("WbsProjectRecord", wbsProjectRecordSchema);