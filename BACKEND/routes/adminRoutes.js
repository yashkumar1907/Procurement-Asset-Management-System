/* =========================
   MAIN BACKEND FRAMEWORK (Used for get, push, put, delete route)
========================= */
const express = require("express");

/* =========================
   Creates a route container (Instead of app)
========================= */
const router = express.Router();


/* =========================
   Import User Model
========================= */
const User = require("../models/User");


/* =========================
   Inport Bycrypt (to hash passwords before storing)
========================= */
const bcrypt = require("bcryptjs");


const sendEmail = require("../services/emailService");

const welcomeEmail = require("../templates/welcomeEmail");
const permissionUpdatedEmail = require("../templates/permissionUpdatedEmail");
const accountDeletedEmail = require("../templates/accountDeletedEmail");


// ===============================
// GET ALL USERS (GET /api/admin/users)
// ===============================
router.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// ADD EMPLOYEE (POST /api/admin/add-user)
// ===============================
router.post("/add-user", async (req, res) => {
    try {
        const {name, email, password, permissions} = req.body;

        // CHECK EXISTING USER
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        
        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // CREATE EMPLOYEE
        const user = new User({name, email, password: hashedPassword, role: "employee", permissions});
        
        await user.save();

        try {
            await sendEmail(
                email,
                "Welcome to IT Infra Management System",
                welcomeEmail(name, email, password)
            );
        }
        catch (emailError) {
            console.error(emailError);
        }

        res.status(201).json({
            message: "Employee Added Successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// UPDATE USER PERMISSIONS (put /api/admin/update-permissions/123)
// ===============================
router.put("/update-permissions/:id", async (req, res) => {
    try {
        const {permissions} = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { permissions },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }

        try {
            await sendEmail(
                updatedUser.email,
                "Your Permissions Have Been Updated",
                permissionUpdatedEmail(updatedUser.name, updatedUser.permissions)
            );
        }
        catch (emailError) {
            console.error(emailError);
        }
        
        res.status(200).json({
            message: "Permissions Updated Successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// ===============================
// DELETE USER (DELETE /api/admin/delete-user/:id)
// ===============================
router.delete("/delete-user/:id", async (req, res) => {
    try {
        // FIND USER
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        }
        
        // DELETE USER
        await User.findByIdAndDelete(req.params.id);

        // SEND ACCOUNT DELETED EMAIL
        try {
            await sendEmail(
                user.email,
                "Your IT Infra Management System Account Has Been Deleted",
                accountDeletedEmail(user.name)
            );
        }
        catch (emailError) {
            console.error(emailError);
        }

        res.status(200).json({
            message: "User Deleted Successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});

/* =========================
    Export these all routes so that we can use it anywhere
========================= */
module.exports = router;