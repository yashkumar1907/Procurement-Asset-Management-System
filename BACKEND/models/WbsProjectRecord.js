const mongoose = require("mongoose");

const wbsProjectRecordSchema = new mongoose.Schema({
    wbsNum: {
        type: String,
        required: true,
        default: "",
        trim: true
    },
    description: {
        type: String,
        default: "",
        trim: true
    },
    budget: {
        type: Number,
        required: true,
        default: 0
    },
    transfer: {
        type: String,
        default: "",
        trim: true
    },
    released: {
        type: String,
        default: "",
        trim: true
    },
    preqComm: {
        type: String,
        default: "",
        trim: true
    },
    poCommt: {
        type: String,
        default: "",
        trim: true
    },
    commitment: {
        type: String,
        default: "",
        trim: true
    },
    actual: {
        type: Number,
        required: true,
        default: 0
    },
    assigned: {
        type: String,
        default: "",
        trim: true
    },
    totalAvailable: {
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


module.exports = mongoose.model("WbsProjectRecord", wbsProjectRecordSchema);