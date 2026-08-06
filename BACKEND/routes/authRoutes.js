const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");

const User = require("../models/User");

// ===============================
// REGISTER USER (POST /api/auth/register)
// ===============================
router.post("/register", async (req, res) => {
    try {
        const {name, email, password, role} = req.body;
        
        // CHECK EXISTING USER
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        
        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // CREATE USER
        const user = new User({name, email, password: hashedPassword, role: role || "employee"});

        // SAVE USER
        await user.save();
        res.status(201).json({
            message: "User registered successfully"
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
// LOGIN USER (POST /api/auth/login)
// ===============================
router.post("/login", async (req, res) => {
    try {
        const {email, password} = req.body;
        
        // CHECK USER
        const user = await User.findOne({email});
        if (!user) {
            return res.status(400).json({
                message: "Invalid Email"
            });
        }
        
        // CHECK PASSWORD
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Password"
            });
        }

        const permissions = user.permissions || {};
        
        // LOGIN SUCCESS
        res.status(200).json({
            message: "Login Successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,  
                networkPermission: permissions.network,
                amcPermission: permissions.amc,
                contractPermission: permissions.contract,
                inventoryNetworkPermission: permissions.inventoryNetwork,
                inventoryHardwarePermission: permissions.inventoryHardware,
                inventoryDepartmentPermission: permissions.inventoryDepartment,
                plantMaterialPermission: permissions.plantMaterial,
                plantServicePermission: permissions.plantService,
                wbsProjectPermission: permissions.wbsProject
            }
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
// GET PROFILE
// ===============================
router.get("/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            name: user.name,
            email: user.email,
            role: user.role
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
// UPDATE PROFILE
// ===============================
router.put("/profile/:id", async (req, res) => {
    try {
        const { name, email } = req.body;
        
        const existingUser = await User.findOne({
            email,
            _id: { $ne: req.params.id }
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                name,
                email
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Profile Updated Successfully",
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
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
// CHANGE PASSWORD
// ===============================
router.put("/change-password/:id", async (req, res) => {
    try {
        const {currentPassword, newPassword} = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // CHECK CURRENT PASSWORD
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Current Password is incorrect"
            });
        }

        // HASH NEW PASSWORD
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: "Password Changed Successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


module.exports = router;