// ===============================
// GLOBAL VARIABLES
// ===============================
let records = [];
let editingRecordId = null;


// ============================================================================================================================
// AUTHENTICATION & INITIALIZATION
// ============================================================================================================================
window.onload = function () {

    // Load employee info
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

    const searchBox = document.getElementById("searchBox");
    
    if (searchBox) {
        searchBox.addEventListener("input", renderTable);
    }

    applyPermissions();
    loadRecords();
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

    // No wbs Project access
    if (wbsProjectPermission === "none") {
        window.location.href = "profile.html";
        return;
    }

    // Hide sidebar options
    if (networkPermission === "none") {
        document.getElementById("networkBtn").style.display = "none";
    }
    if (amcPermission === "none") {
        document.getElementById("amcBtn").style.display = "none";
    }
    if (contractPermission === "none") {
        document.getElementById("contractBtn").style.display = "none";
    }
    if (inventoryNetworkPermission === "none") {
        document.getElementById("inventoryNetworkBtn").style.display = "none";
    }
    if (inventoryHardwarePermission === "none") {
        document.getElementById("inventoryHardwareBtn").style.display = "none";
    }
    if (inventoryDepartmentPermission === "none") {
        document.getElementById("inventoryDepartmentBtn").style.display = "none";
    }
    if (plantServicePermission === "none") {
        document.getElementById("plantServiceBtn").style.display = "none";
    }
    if (plantMaterialPermission === "none") {
        document.getElementById("plantMaterialBtn").style.display = "none";
    }
}

// ============================================================================================================================
// SIDEBAR AND NAVIGATION
// ============================================================================================================================


// ===============================
// GET CURRENT PERMISSIONS
// ===============================
function getCurrentPermission() {
    return localStorage.getItem("wbsProjectPermission") || "none";
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
// EXPORT EXCEL
// ===============================
function exportExcel() {
    window.open(`${API_BASE_URL}/api/wbs-project-records/export`,"_blank");
}


// ===============================
// IMPORT EXCEL
// ===============================
async function importExcel(input) {
    const file = input.files[0];
    if (!file) {
        return;
    }

    const formData = new FormData();
    formData.append("excelFile", file);
    formData.append("lastEditedBy", localStorage.getItem("loggedInUserName"));

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/wbs-project-records/import`,
                {
                    method: "POST",
                    body: formData
                }
            );

        const data = await response.json();
        if (!response.ok) {
            showToast("error", data.message);
            return;
        }
        showToast("success", data.message);
        await loadRecords();
    }
    catch(error) {
        console.log(error);
        showToast("error", "Import Failed");
    }
    input.value = "";
}

// ============================================================================================================================
// RECORD TABLE UTILITIES
// ============================================================================================================================

// ===============================
// FORMAT AMOUNT
// ===============================
function formatAmount(amount) {
    return `Rs. ${Number(amount).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

// ===============================
// UPDATE STATISTICS
// ===============================
function updateStatistics() {
    const totalRecords = records.length;

    const totalBudget = records.reduce(
        (sum, record) => sum + Number(record.budget || 0),
        0
    );

    const totalActual = records.reduce(
        (sum, record) => sum + Number(record.actual || 0),
        0
    );

    document.getElementById("totalRecords").innerText = totalRecords;
    document.getElementById("totalBudget").innerText = formatAmount(totalBudget);
    document.getElementById("totalActual").innerText = formatAmount(totalActual);
}


function displayValue(value) {
    return value === "" || value === null || value === undefined ? "-" : value;
}

// ===============================
// RENDER TABLE
// ===============================
function renderTable() {
    const tableContainer = document.getElementById("tableContainer");
    updateStatistics();

    const searchText =
        document.getElementById("searchBox")
        ?.value
        .toLowerCase()
        .trim() || "";

    const filteredRecords = records.filter(record => {
        return (
            String(record.wbsNum || "")
                .toLowerCase()
                .includes(searchText)

            ||

            String(record.description || "")
                .toLowerCase()
                .includes(searchText)
        );
    });

    let html = `
        <div class="table-scroll">
        <table>
        <thead>
            <tr>
                <th>S.No.</th>
                <th>WBS Number</th>
                <th>Description</th>
                <th>Budget</th>
                <th>Transfer</th>
                <th>Released</th>
                <th>Preq Comm</th>
                <th>PO Commt</th>
                <th>Commitment</th>
                <th>Actual</th>
                <th>Assigned</th>
                <th>Total Available</th>
                <th>Last Edited By</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

    filteredRecords.forEach((record, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${record.wbsNum}</td>
                <td>${displayValue(record.description)}</td>
                <td>${formatAmount(record.budget)}</td>
                <td>${displayValue(record.transfer)}</td>
                <td>${displayValue(record.released)}</td>
                <td title="PR Number: ${record.linkedInfo?.prNum || "Not Linked"}">
                    ${displayValue(record.preqComm)}
                </td>
                <td title="PO Number: ${record.linkedInfo?.poNum || "Not Linked"}">
                    ${displayValue(record.poCommt)}
                </td>
                <td>${displayValue(record.commitment)}</td>
                <td>${formatAmount(record.actual)}</td>
                <td>${displayValue(record.assigned)}</td>
                <td>${displayValue(record.totalAvailable)}</td>
                <td>
                    <div class="last-edited">
                        <i class="fa-solid fa-user"></i>
                        <span>${record.lastEditedBy || "-"}</span>
                    </div>
                </td>
                <td>
                    ${getCurrentPermission() === "edit"
                        ?
                        `
                        <button class="edit-btn" onclick="editRecord('${record._id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteRecord('${record._id}')">Delete</button>
                        `
                        :
                        ""
                    }
                </td>
            </tr>
        `;

    });

    html += `
        </tbody>
        </table>
        </div>
    `;

    if (filteredRecords.length === 0) {
        html = html.replace(
            "</tbody>",
            `
                <tr>
                    <td colspan="14" class="no-data">
                        No Records Found
                    </td>
                </tr>
            </tbody>
            `
        );
    }

    tableContainer.innerHTML = html;
}



// ============================================================================================================================
// RECORD DATA APIs
// ============================================================================================================================

// ===============================
// LOAD RECORDS
// ===============================
async function loadRecords() {
    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/wbs-project-records`
            );

        records = await response.json();
        renderTable();
    }
    catch (error) {
        console.log(error);
        showToast("error", "Failed to load records");
    }
}


// ===============================
// SAVE RECORD
// ===============================
async function saveRecord(recordData) {
    try {
        let response;

        recordData.lastEditedBy = localStorage.getItem("loggedInUserName");

        if (editingRecordId) {
            response = await fetch(
                `${API_BASE_URL}/api/wbs-project-records/${editingRecordId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(recordData)
                }
            );
        }
        else {
            response = await fetch(
                `${API_BASE_URL}/api/wbs-project-records`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(recordData)
                }
            );
        }

        const data = await response.json();

        if (!response.ok) {
            showToast("error", data.message || "Operation Failed");
            return;
        }

        showToast("success", data.message);
        await loadRecords();
        closeModal();
    }
    catch (error) {
        console.log(error);
        showToast("error", "Server Error");
    }
}

// ===============================
// DELETE RECORD
// ===============================
async function deleteRecord(id) {
    if (getCurrentPermission() !== "edit") {
        showToast("warning", "You do not have permission.");
        return;
    }

    const confirmed =
        await showConfirm({
            title: "Delete Record",
            message: "Are you sure you want to delete this record?",
            confirmText: "Delete",
            cancelText: "Cancel"
        });

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/wbs-project-records/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data = await response.json();

        if (!response.ok) {
            showToast("error", data.message);
            return;
        }
        
        showToast("success", data.message || "WBS Project Record Deleted Successfully");

        await loadRecords();
    }
    catch (error) {
        console.log(error);
        showToast("error", "Server Error");
    }
}


// ============================================================================================================================
// RECORD MODAL
// ============================================================================================================================

// ===============================
// OPEN MODAL
// ===============================
function openModal() {
    document.getElementById("recordModal").style.display = "block";
    document.getElementById("recordForm").reset();
}


// ===============================
// OPEN ADD MODAL
// ===============================
function openAddModal() {
    editingRecordId = null;
    openModal();
}


// ===============================
// CLOSE MODAL
// ===============================
function closeModal() {
    document.getElementById("recordModal").style.display = "none";
}

// ===============================
// ADD RECORD
// ===============================
async function addRecord(event) {
    event.preventDefault();

    const recordData = {
        wbsNum: document.getElementById("WbsNum").value.trim(),
        description: document.getElementById("Description").value.trim(),
        budget: Number(document.getElementById("Budget").value),
        transfer: document.getElementById("Transfer").value.trim(),
        released: document.getElementById("Released").value.trim(),
        preqComm: document.getElementById("PreqComm").value.trim(),
        poCommt: document.getElementById("POCommt").value.trim(),
        commitment: document.getElementById("Commitment").value.trim(),
        actual: Number(document.getElementById("Actual").value),
        assigned: document.getElementById("Assigned").value.trim(),
        totalAvailable: document.getElementById("TotalAvailable").value.trim()
    };

    await saveRecord(recordData);
}


// ===============================
// EDIT RECORD
// ===============================
function editRecord(id) {
    if (getCurrentPermission() !== "edit") {
        showToast("warning", "You do not have permission.");
        return;
    }

    const record = records.find(item => item._id === id);
    
    if (!record) {
        return;
    }

    editingRecordId = id;

    openModal();

    document.getElementById("WbsNum").value = record.wbsNum || "";
    document.getElementById("Description").value = record.description || "";
    document.getElementById("Budget").value = record.budget || "";
    document.getElementById("Transfer").value = record.transfer || "";
    document.getElementById("Released").value = record.released || "";
    document.getElementById("PreqComm").value = record.preqComm || "";
    document.getElementById("POCommt").value = record.poCommt || "";
    document.getElementById("Commitment").value = record.commitment || "";
    document.getElementById("Actual").value = record.actual || "";
    document.getElementById("Assigned").value = record.assigned || "";
    document.getElementById("TotalAvailable").value = record.totalAvailable || "";
}

// ============================================================================================================================
// UI EVENTS
// ============================================================================================================================

// ===============================
// SIDEBAR TOGGLE
// ===============================
window.addEventListener("DOMContentLoaded", () => {
    const toggleBtn = document.getElementById("toggleSidebarBtn");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            document.querySelector(".sidebar").classList.toggle("collapsed");
        });
    }
});

// ===============================
// CLOSE MODAL OUTSIDE CLICK
// ===============================
window.onclick = function(event) {
    const recordModal = document.getElementById("recordModal");
    if (event.target === recordModal) {
        closeModal();
    }
};



// ===============================
// INVENTORY MENU TOGGLE
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    const inventoryBtn = document.getElementById("inventoryToggleBtn");
    const inventorySubMenu = document.getElementById("inventorySubMenu");

    if (!inventoryBtn || !inventorySubMenu) {
        return;
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