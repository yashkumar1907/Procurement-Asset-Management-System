/* =========================
   LOAD VARIABLES FROM .env
========================= */
require("dotenv").config();


/* =========================
   MAIN BACKEND FRAMEWORK (Used for get, push, put, delete route)
========================= */
const express = require("express");


/* =========================
   Allows frontend and backend to communicate
========================= */
const cors = require("cors");


/* =========================
   Used to connect to mongodb
========================= */
const connectDB = require("./config/db");

const cron = require("node-cron");


/* =========================
   Import All Routes
========================= */
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

const { runPOReminderJob } = require("./services/poReminderService");

const cronRoutes = require("./routes/cronRoutes");

/* =========================
   Creates backend application
========================= */
const app = express();


/* =========================
   Allows app to use cors
========================= */
app.use(cors());


/* =========================
   Allows backend to take data from frontend
========================= */
app.use(express.json());


/* =========================
   Allows to upload pdf files
========================= */
const path = require("path");

app.use( "/uploads", express.static(path.join(__dirname, "uploads")));


/* =========================
   Allows app to use all Routes
========================= */
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

app.use("/api/cron", cronRoutes);


/* =========================
   CONNECT DATABASE
========================= */
connectDB();


cron.schedule("0 10,16 * * *", async () => {
   await runPOReminderJob();
});


/* =========================
// Take Port Number from .env file
========================= */
const PORT = process.env.PORT;


/* =========================
    DEFAULT ROUTE
========================= */
app.get("/", (req, res) => {
    res.send("Backend Working Perfectly");
});


/* =========================
    START SERVER
========================= */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});