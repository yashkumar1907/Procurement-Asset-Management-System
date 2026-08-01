let paymentVsPoChart = null;
let monthlyPoChart = null;
let poExpiryChart = null;
let spendByModuleChart = null;


// ===============================
// PAGE INITIALIZATION
// ===============================
window.onload = function () {
    const userName = localStorage.getItem("loggedInUserName");
    if (!userName) {
        window.location.href = "login.html";
        return;
    }

    document.querySelector(".user-info").innerHTML = `
        Welcome, <strong>${userName}</strong>
        <button type="button" class="logout-btn" onclick="logout(event)">
            Logout
        </button>
    `;

    applyPermissions();

    // Executive Summary
    loadExecutiveSummary();

    // Charts
    loadMonthlyProcurementChart();
    loadPaymentVsProcurementChart();
    loadPoExpiryChart();
    loadSpendByModule();

    // Dashboard Widgets
    loadDashboardAlerts();
    loadTopVendors();
    loadRecentActivities();

    const exportBtn = document.getElementById("exportPaymentReportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", openPaymentReportModal);
    }

    const cancelBtn = document.getElementById("cancelPaymentReportBtn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closePaymentReportModal);
    }

    const downloadBtn = document.getElementById("downloadPaymentReportBtn");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadPaymentReport);
    }
};



const today = new Date().toISOString().split("T")[0];

document.getElementById("paymentFromDate").max = today;
document.getElementById("paymentToDate").max = today;

// ===============================
// APPLY PERMISSIONS
// ===============================
function applyPermissions() {
    const networkPermission = localStorage.getItem("networkPermission");
    const amcPermission = localStorage.getItem("amcPermission");
    const contractPermission = localStorage.getItem("contractPermission");
    const inventoryNetworkPermission = localStorage.getItem("inventoryNetworkPermission");
    const inventoryHardwarePermission = localStorage.getItem("inventoryHardwarePermission");
    const inventoryDepartmentPermission = localStorage.getItem("inventoryDepartmentPermission");
    const plantMaterialPermission = localStorage.getItem("plantMaterialPermission");
    const plantServicePermission = localStorage.getItem("plantServicePermission");
    const wbsProjectPermission = localStorage.getItem("wbsProjectPermission");
    
    if (networkBtn && networkPermission === "none") {
        networkBtn.style.display = "none";
    }

    if (amcBtn && amcPermission === "none") {
        amcBtn.style.display = "none";
    }

    if (contractBtn && contractPermission === "none") {
        contractBtn.style.display = "none";
    }
    if (inventoryNetworkBtn && inventoryNetworkPermission === "none") {
        inventoryNetworkBtn.style.display = "none";
    }

    if (inventoryHardwareBtn && inventoryHardwarePermission === "none") {
        inventoryHardwareBtn.style.display = "none";
    }
    if (inventoryDepartmentBtn && inventoryDepartmentPermission === "none") {
        inventoryDepartmentBtn.style.display = "none";
    }

    if(plantMaterialBtn && plantMaterialPermission === "none") {
        plantMaterialBtn.style.display = "none";
    }
    if(plantServiceBtn && plantServicePermission === "none") {
        plantServiceBtn.style.display = "none";
    }
    if(wbsProjectBtn && wbsProjectPermission === "none") {
        wbsProjectBtn.style.display = "none";
    }
}


// ===============================
// LOGOUT
// ===============================
function logout(event) {
    event.preventDefault();
    localStorage.clear();
    window.location.href = "login.html";
}


// ===============================
// SIDEBAR TOGGLE
// ===============================
const toggleBtn = document.getElementById("toggleSidebarBtn");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            document.querySelector(".sidebar").classList.toggle("collapsed");
        }
    );
}


// ===============================
// INVENTORY MENU TOGGLE
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const inventoryBtn = document.getElementById("inventoryToggleBtn");
    const inventorySubMenu = document.getElementById("inventorySubMenu");

    if (!inventoryBtn || !inventorySubMenu) {
        return;
    }

    // ===============================
    // AUTO OPEN INVENTORY MENU
    // ===============================
    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "inventoryNetwork.html" || currentPage === "inventoryHardware.html" || currentPage === "inventoryDepartment.html") {
        inventorySubMenu.classList.add("show");
        inventoryBtn.innerHTML = "📦 IT Procurement ▲";
    }

    inventoryBtn.addEventListener("click", () => {
        inventorySubMenu.classList.toggle("show");

        if (inventorySubMenu.classList.contains("show")) {
            inventoryBtn.innerHTML = "📦 IT Procurement ▲";
        }
        else {
            inventoryBtn.innerHTML = "📦 IT Procurement ▼";
        }
    });
});


// ===============================
// PLANT MENU TOGGLE
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const plantBtn = document.getElementById("plantToggleBtn");
    const plantSubMenu = document.getElementById("plantSubMenu");

    if (!plantBtn || !plantSubMenu) {
        return;
    }

    const currentPage = window.location.pathname.split("/").pop();

    if (currentPage === "plantMaterial.html" || currentPage === "plantService.html") {
        plantSubMenu.classList.add("show");
        plantBtn.innerHTML = "📦 Plants ▲";
    }

    plantBtn.addEventListener("click", () => {
        plantSubMenu.classList.toggle("show");

        if (plantSubMenu.classList.contains("show")) {
            plantBtn.innerHTML = "📦 Plants ▲";
        }
        else {
            plantBtn.innerHTML = "📦 Plants ▼";
        }
    });
});


// ===============================
// LOAD EXECUTIVE SUMMARY
// ===============================
async function loadExecutiveSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/summary`);
        if (!response.ok) {
            throw new Error("Failed to load executive summary.");
        }

        const data = await response.json();
        
        document.getElementById("totalProcurement").textContent = "₹" + Number(data.totalProcurement).toLocaleString("en-IN");
        document.getElementById("totalPayments").textContent = "₹" + Number(data.totalPayment).toLocaleString("en-IN");
        document.getElementById("activePOs").textContent = data.activePOs;
        document.getElementById("expiringPOs").textContent = data.expiringSoon;
        document.getElementById("expiredPOs").textContent = data.expiredPOs;
        document.getElementById("activeContracts").textContent = data.activeContracts;
        document.getElementById("totalVendors").textContent = data.totalVendors;
        document.getElementById("wbsProjects").textContent = data.wbsProjects;
    }
    catch (error) {
        console.error(error);
    }
}


// ===============================
// MONTHLY PROCUREMENT TREND
// ===============================
async function loadMonthlyProcurementChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/monthly-po`);
        if (!response.ok) {
            throw new Error("Failed to load monthly procurement data.");
        }

        const data = await response.json();

        const ctx = document.getElementById("monthlyProcurementChart").getContext("2d");

        if (monthlyPoChart) {
            monthlyPoChart.destroy();
        }

        monthlyPoChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "Procurement Value (₹)",
                    data: data.data,
                    borderColor: "#ff6b00",
                    backgroundColor: "rgba(255,107,0,0.12)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: "#ff6b00",
                    pointBorderColor: "#ffffff",
                    pointBorderWidth: 2,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label(context) {
                                return "₹" + Number(context.raw).toLocaleString("en-IN");
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback(value) {
                                if (value >= 10000000) {
                                    return "₹" + (value / 10000000).toFixed(1) + " Cr";
                                }
                        
                                if (value >= 100000) {
                                    return "₹" + (value / 100000).toFixed(1) + " L";
                                }
                        
                                return "₹" + value.toLocaleString("en-IN");
                            }
                        }
                    }
                }
            }
        });
    }
    catch (error) {
        console.error(error);
    }
}


// ===============================
// PAYMENT VS PROCUREMENT CHART
// ===============================
async function loadPaymentVsProcurementChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/payment-vs-procurement`);

        if (!response.ok) {
            throw new Error("Failed to load payment vs procurement data.");
        }

        const data = await response.json();
        const ctx = document.getElementById("paymentVsProcurementChart").getContext("2d");

        if (paymentVsPoChart) {
            paymentVsPoChart.destroy();
        }
        
        paymentVsPoChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: "Procurement",
                        data: data.procurement,
                        backgroundColor: "#ff6b00"
                    },
                    {
                        label: "Payments",
                        data: data.payments,
                        backgroundColor: "#1e88e5"
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top"
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback(value) {
                                if (value >= 10000000) {
                                    return "₹" + (value / 10000000).toFixed(1) + " Cr";
                                }
                        
                                if (value >= 100000) {
                                    return "₹" + (value / 100000).toFixed(1) + " L";
                                }
                        
                                return "₹" + Number(value).toLocaleString("en-IN");
                            }
                        }
                    }
                }
            }
        });
    }
    catch (error) {
        console.error(error);
    }
}


// ===============================
// SPEND BY MODULE
// ===============================
async function loadSpendByModule() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/spend-by-module`);
        if (!response.ok) {
            throw new Error("Failed to load spend by module data.");
        }

        const data = await response.json();

        if (spendByModuleChart) {
            spendByModuleChart.destroy();
        }

        const ctx = document.getElementById("moduleSpendChart").getContext("2d");

        spendByModuleChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.data,
                    backgroundColor: [
                        "#ff6b00",
                        "#1e88e5",
                        "#22c55e"
                    ],  
                    borderWidth: 2,
                    borderColor: "#ffffff"                
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });
    }
    catch (error) {
        console.error(error);
    }
}


// ===============================
// PO EXPIRY CHART
// ===============================
async function loadPoExpiryChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/po-expiry`);
        const data = await response.json();

        const ctx = document.getElementById("poExpiryChart").getContext("2d");

        if (poExpiryChart) {
            poExpiryChart.destroy();
        }

        poExpiryChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: data.labels,
                datasets: [{
                    label: "PO Count",
                    data: data.data,
                    backgroundColor: [
                        "#ef4444",
                        "#f59e0b",
                        "#3b82f6",
                        "#22c55e"
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }
    catch (error) {
        console.error(error);
    }
}


// ===============================
// DASHBOARD ALERTS
// ===============================
async function loadDashboardAlerts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/dashboard-alerts`);
        const data = await response.json();

        const container = document.getElementById("dashboardAlerts");

        container.innerHTML = "";

        const alerts = [];

        if (data.expiredPOs > 0) {
            alerts.push({
                title: "Expired POs",
                message: `${data.expiredPOs} Purchase Orders have expired.`
            });
        }

        if (data.expiringPOs > 0) {
            alerts.push({
                title: "Expiring Soon",
                message: `${data.expiringPOs} Purchase Orders expire within 30 days.`
            });
        }

        if (data.draftInventory > 0) {
            alerts.push({
                title: "Inventory Drafts",
                message: `${data.draftInventory} inventory requests are still in Draft.`
            });
        }

        if (alerts.length === 0) {
            container.innerHTML = "<p>No alerts available.</p>";
            return;
        }

        let html = "";

        alerts.forEach(alert => {
            html += `
                <div class="alert-card">
                    <strong>${alert.title}</strong>
                    <p>${alert.message}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    catch (error) {
        console.error(error);
    }
}


// ===============================
// TOP VENDORS
// ===============================
async function loadTopVendors() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/top-vendors`);
        const vendors = await response.json();

        const table = document.getElementById("topVendorsTable");

        table.innerHTML = "";

        if (vendors.length === 0) {
            table.innerHTML = "<p>No vendors found.</p>";
            return;
        }

        table.innerHTML = `
            <div class="vendor-table-wrapper">
                <table class="vendor-table">
                    <thead>
                        <tr>
                            <th>Vendor</th>
                            <th>Amount</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${vendors.map(v => `
                            <tr>
                                <td>${v.vendorName || "-"}</td>
                                <td>₹${Number(v.totalAmount || 0).toLocaleString("en-IN")}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    catch (error) {
        console.error(error);
    }
}


// ===============================
// RECENT ACTIVITIES
// ===============================
async function loadRecentActivities() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/recent-activities`);
        const activities = await response.json();

        const container = document.getElementById("recentActivitiesList");

        container.innerHTML = "";

        if (activities.length === 0) {
            container.innerHTML = "<p>No recent activities.</p>";
            return;
        }

        let html = "";

        activities.forEach(activity => {
            html += `
                <div class="activity-card">
                    <strong>${activity.title}</strong>
                    <p>${activity.action}</p>
                    <small>${new Date(activity.date).toLocaleString("en-IN")}</small>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    catch (error) {
        console.error(error);
    }
}



// ===============================
// PAYMENT REPORT
// ===============================
function openPaymentReportModal() {
    document.getElementById("paymentReportModal").style.display = "flex";
}

function closePaymentReportModal() {
    document.getElementById("paymentReportModal").style.display = "none";
}

async function downloadPaymentReport() {

    const from = document.getElementById("paymentFromDate").value;
    const to = document.getElementById("paymentToDate").value;

    if (!from || !to) {
        alert("Please select both dates.");
        return;
    }

    if (new Date(from) > new Date(to)) {
        alert("From Date cannot be after To Date.");
        return;
    }

    window.location.href =
        `${API_BASE_URL}/api/dashboard/payment-report?from=${from}&to=${to}`;

    closePaymentReportModal();
}


const paymentModal = document.getElementById("paymentReportModal");

if (paymentModal) {
    paymentModal.addEventListener("click", function (event) {
        if (event.target === paymentModal) {
            closePaymentReportModal();
        }
    });
}