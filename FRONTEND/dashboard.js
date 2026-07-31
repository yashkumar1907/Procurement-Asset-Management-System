let poStatusChart;
let moduleRecordsChart;
let paymentVsPoChart;
let monthlyTrendChart;
let inventoryProgressChart;
let poExpiryChart;
let monthlyPoChart;

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
};


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
const toggleBtn =
    document.getElementById("toggleSidebarBtn");

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
        inventoryBtn.innerHTML = "📦 IT Inventory ▲";
    }

    inventoryBtn.addEventListener("click", () => {
        inventorySubMenu.classList.toggle("show");

        if (inventorySubMenu.classList.contains("show")) {
            inventoryBtn.innerHTML = "📦 IT Inventory ▲";
        }
        else {
            inventoryBtn.innerHTML = "📦 IT Inventory ▼";
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


async function loadNetworkDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/network`);

        const data = await response.json();

        document.getElementById("networkRecords").textContent = data.totalRecords;
        document.getElementById("networkPoAmount").textContent = "₹" + Number(data.totalPoAmount).toLocaleString("en-IN");
        document.getElementById("networkPayment").textContent = "₹" + Number(data.totalPayment).toLocaleString("en-IN");
    }
    catch (error) {
        console.log(error);
    }
}


// ===============================
// LOAD INVENTORY DASHBOARD
// ===============================
async function loadInventoryDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/inventory`);

        const data = await response.json();

        document.getElementById("inventoryRecords").textContent = data.totalRecords;
        document.getElementById("inventoryDraftRecords").textContent = data.draftRecords;
        document.getElementById("inventoryReleasedRecords").textContent = data.releasedRecords;
        document.getElementById("inventoryPoReceivedRecords").textContent = data.poReceivedRecords;
    } catch (error) {
        console.log(error);
    }
}

// ===============================
// LOAD PLANT DASHBOARD
// ===============================
async function loadPlantDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/plants`);
        const data = await response.json();

        document.getElementById("plantMaterialRecords").textContent = data.materialRecords;
        document.getElementById("plantServiceRecords").textContent = data.serviceRecords;
        document.getElementById("plantPrCount").textContent = data.totalPr;
        document.getElementById("plantPoCount").textContent = data.totalPo;
    }
    catch (error) {
        console.log(error);
    }
}

// ===============================
// LOAD WBS DASHBOARD
// ===============================
async function loadWbsDashboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/wbs`);
        const data = await response.json();

        document.getElementById("wbsProjects").textContent = data.totalProjects;
        document.getElementById("wbsLinkedPr").textContent = data.linkedPr;
        document.getElementById("wbsLinkedPo").textContent = data.linkedPo;
    }
    catch (error) {
        console.log(error);
    }
}



// GRAPHS 

// ===============================
// LOAD PO STATUS CHART
// ===============================
async function loadPoStatusChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/po-status`);
        const data = await response.json();

        renderPoStatusChart(
            data.active,
            data.expiringSoon,
            data.expired
        );
    }
    catch (error) {
        console.log(error);
    }
}

// ===============================
// LOAD MODULE RECORDS CHART
// ===============================
async function loadModuleRecordsChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/module-records`);
        const data = await response.json();
        renderModuleRecordsChart(data);
    }
    catch (error) {
        console.log(error);
    }
}

// ===============================
// LOAD PAYMENT VS PO CHART
// ===============================
async function loadPaymentVsPoChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/network`);
        const data = await response.json();

        renderPaymentVsPoChart(data);
    }
    catch (error) {
        console.log(error);
    }
}


// ===============================
// LOAD MONTHLY TREND CHART
// ===============================
async function loadMonthlyTrendChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/monthly-records`);
        const data = await response.json();

        renderMonthlyTrendChart(data);
    }
    catch (error) {
        console.log(error);
    }
}

// ===============================
// LOAD INVENTORY PROGRESS CHART
// ===============================
async function loadInventoryProgressChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/inventory`);
        const data = await response.json();

        renderInventoryProgressChart(data);
    }
    catch (error) {
        console.log(error);
    }
}

// ===============================
// LOAD PO EXPIRY CHART
// ===============================
async function loadPoExpiryChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/po-expiry`);
        const data = await response.json();
        renderPoExpiryChart(data);
    }
    catch (error) {
        console.log(error);
    }
}


// ===============================
// LOAD MONTHLY PO AMOUNT CHART
// ===============================
async function loadMonthlyPoChart() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dashboard/monthly-po`);
        const data = await response.json();
        renderMonthlyPoChart(data);
    }

    catch (error) {
        console.log(error);
    }
}



function renderPoStatusChart(active, expiringSoon, expired) {
    const ctx = document.getElementById("poStatusChart").getContext("2d");

    if (poStatusChart) {
        poStatusChart.destroy();
    }

    poStatusChart = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Active", "Expiring Soon", "Expired"],

            datasets: [{
                data: [active, expiringSoon, expired],

                backgroundColor: ["#22c55e", "#facc15", "#ef4444"],

                borderWidth: 2
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                }
            }
        }
    });
}


function renderModuleRecordsChart(data) {
    const ctx = document.getElementById("moduleRecordsChart").getContext("2d");

    if (moduleRecordsChart) {
        moduleRecordsChart.destroy();
    }

    moduleRecordsChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "Network",
                "Inventory",
                "Plants",
                "WBS"
            ],
            datasets: [{
                label: "Records",
                data: [data.network, data.inventory, data.plants, data.wbs],
                backgroundColor: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"],
                borderRadius: 8
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
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 10,
                        precision: 0
                    }
                }
            }
        }
    });
}


function renderPaymentVsPoChart(data) {
    const ctx = document.getElementById("paymentVsPoChart").getContext("2d");

    if (paymentVsPoChart) {
        paymentVsPoChart.destroy();
    }

    paymentVsPoChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["PO Amount", "Payment"],
            datasets: [{
                data: [data.totalPoAmount, data.totalPayment],
                backgroundColor: ["#2563eb", "#22c55e"],
                borderRadius: 10
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
                        label: function(context) {
                            return "₹" + Number(context.raw).toLocaleString("en-IN");
                        }
                    }
                }
            },

            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return "₹" + Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}



function renderMonthlyTrendChart(chartData) {
    const ctx = document.getElementById("monthlyTrendChart").getContext("2d");

    if (monthlyTrendChart) {
        monthlyTrendChart.destroy();
    }

    monthlyTrendChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: chartData.labels,

            datasets: [{
                label: "Records",
                data: chartData.data,
                borderColor: "#ff6b00",
                backgroundColor: "rgba(255,107,0,0.15)",
                fill: true,
                tension: 0.35,
                pointRadius: 5,
                pointHoverRadius: 7
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


function renderInventoryProgressChart(data) {
    const ctx = document.getElementById("inventoryProgressChart").getContext("2d");

    if (inventoryProgressChart) {
        inventoryProgressChart.destroy();
    }

    inventoryProgressChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Draft", "Released", "PO Received"],

            datasets: [{
                data: [data.draftRecords, data.releasedRecords, data.poReceivedRecords],
                backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"],
                borderWidth: 2,
                borderColor: "#ffffff"
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: {
                    position: "bottom"
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}


function renderPoExpiryChart(data) {
    const ctx = document.getElementById("poExpiryChart").getContext("2d");

    if (poExpiryChart) {
        poExpiryChart.destroy();
    }

    poExpiryChart = new Chart(ctx, {
        type: "bar",

        data: {
            labels: ["Expired", "0-30 Days", "31-60 Days", "60+ Days"],

            datasets: [{
                data: [data.expired, data.days30, data.days60, data.more60],

                backgroundColor: ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e"],

                borderRadius: 8
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
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 10,
                        precision: 0
                    }
                }
            }
        }
    });
}

function renderMonthlyPoChart(chartData) {
    const ctx = document.getElementById("monthlyPoChart").getContext("2d");

    if (monthlyPoChart) {
        monthlyPoChart.destroy();
    }

    monthlyPoChart = new Chart(ctx, {
        type: "line",

        data: {
            labels: chartData.labels,

            datasets: [{
                label: "PO Amount",
                data: chartData.data,
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.15)",
                fill: true,
                tension: 0.35,
                pointRadius: 5
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
                        callback: function(value) {
                            return "₹" + Number(value).toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    });
}


// ===============================
// PAYMENT REPORT MODAL
// ===============================
const paymentReportBtn = document.getElementById("paymentReportBtn");
const paymentReportModal = document.getElementById("paymentReportModal");
const cancelPaymentReportBtn = document.getElementById("cancelPaymentReportBtn");

paymentReportBtn.addEventListener("click", () => {
    paymentReportModal.style.display = "flex";
});

cancelPaymentReportBtn.addEventListener("click", () => {
    paymentReportModal.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === paymentReportModal) {
        paymentReportModal.style.display = "none";
    }
});


const downloadPaymentReportBtn = document.getElementById("downloadPaymentReportBtn");

downloadPaymentReportBtn.addEventListener("click", () => {
    const from = document.getElementById("paymentFromDate").value;
    const to = document.getElementById("paymentToDate").value;

    if (!from || !to) {
        alert("Please select both dates.");
        return;
    }

    if (from > to) {
        alert("From Date cannot be greater than To Date.");
        return;
    }

    const url = `${API_BASE_URL}/api/dashboard/payment-report?from=${from}&to=${to}`;

    window.open(url, "_blank");
    paymentReportModal.style.display = "none";
});


loadNetworkDashboard();
loadInventoryDashboard();
loadPlantDashboard();
loadWbsDashboard();

loadPoStatusChart();
loadModuleRecordsChart();
loadPaymentVsPoChart();
loadMonthlyTrendChart();
loadInventoryProgressChart();
loadPoExpiryChart();
loadMonthlyPoChart();