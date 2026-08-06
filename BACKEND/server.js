require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

connectDB();

const cron = require("node-cron");

const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const networkRecordRoutes = require("./routes/networkRecordRoutes");
const networkDetailRoutes = require("./routes/networkDetailRoutes");
const amcRecordRoutes = require("./routes/amcRecordRoutes");
const amcDetailRoutes = require("./routes/amcDetailRoutes");
const contractRecordRoutes = require("./routes/contractRecordRoutes");
const contractDetailRoutes = require("./routes/contractDetailRoutes");
const inventoryNetworkRecordRoutes = require("./routes/inventoryNetworkRecordRoutes");
const inventoryHardwareRecordRoutes = require("./routes/inventoryHardwareRecordRoutes");
const inventoryDepartmentRecordRoutes = require("./routes/inventoryDepartmentRecordRoutes");
const plantMaterialRecordRoutes = require("./routes/plantMaterialRecordRoutes");
const plantServiceRecordRoutes = require("./routes/plantServiceRecordRoutes");
const wbsProjectRecordRoutes = require("./routes/wbsProjectRecordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");

const {checkNetworkPOReminders, checkAmcPOReminders, checkContractPOReminders} = require("./services/poReminderService");



const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/network-records", networkRecordRoutes);
app.use("/api/network-details", networkDetailRoutes);
app.use("/api/amc-records", amcRecordRoutes);
app.use("/api/amc-details", amcDetailRoutes);
app.use("/api/contract-records", contractRecordRoutes);
app.use("/api/contract-details", contractDetailRoutes);
app.use("/api/inventory-network-records", inventoryNetworkRecordRoutes);
app.use("/api/inventory-hardware-records", inventoryHardwareRecordRoutes);
app.use("/api/inventory-department-records", inventoryDepartmentRecordRoutes);
app.use("/api/plant-material-records", plantMaterialRecordRoutes);
app.use("/api/plant-service-records", plantServiceRecordRoutes);
app.use("/api/wbs-project-records", wbsProjectRecordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);



const PORT = process.env.PORT || 5000;


cron.schedule("0 10,16 * * *", async () => {
   try {
      await checkNetworkPOReminders();
      await checkAmcPOReminders();
      await checkContractPOReminders();
   }
   catch (error) {
      console.error(error);
   }
});


app.get("/", (req, res) => {
    res.send("Backend Working Perfectly");
});


app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});