const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["admin", "employee"],
        default: "employee"
    },
    permissions: {
        network: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        amc: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        contract: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        inventoryNetwork: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        inventoryHardware: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        inventoryDepartment: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        plantMaterial: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        plantService: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        },
        wbsProject: {
            type: String,
            enum: ["none", "view", "edit"],
            default: "none"
        }
    }
});


module.exports = mongoose.model("User", userSchema);