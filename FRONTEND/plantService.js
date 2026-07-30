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
        <a href="#" class="logout-btn" onclick="logout(event)">
            Logout
        </a>
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

    // No plant service access
    if (plantServicePermission === "none") {
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

    if (plantMaterialPermission === "none") {
        document.getElementById("plantMaterialBtn").style.display = "none";
    }
    if (wbsProjectPermission === "none") {
        document.getElementById("wbsProjectBtn").style.display = "none";
    }
}

// ============================================================================================================================
// SIDEBAR AND NAVIGATION
// ============================================================================================================================


// ===============================
// GET CURRENT PERMISSIONS
// ===============================
function getCurrentPermission() {
    return localStorage.getItem("plantServicePermission") || "none";
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
    window.open(`${API_BASE_URL}/api/plant-service-records/export`,"_blank");
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
                `${API_BASE_URL}/api/plant-service-records/import`,
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
// FORMAT AMOUNT INPUT
// ===============================
function formatAmountInput(input) {
    let value = input.value.replace(/,/g, "");
    if (value === "") {
        input.value = "";
        return;
    }
    input.value = Number(value).toLocaleString("en-IN");
}

// ===============================
// FORMAT AMOUNT
// ===============================
function formatAmount(amount) {
    return `Rs. ${Number(amount).toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}


// ===============================
// FORMAT DATE
// ===============================
function formatDate(dateString) {
    if (!dateString) {
        return "-";
    }

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// ===============================
// UPDATE STATISTICS
// ===============================
function updateStatistics() {
    const totalRecords = records.length;

    const totalPrAmount =
        records.reduce(
            (sum, record) => sum + Number(record.prAmount || 0), 0);

    const totalPoAmount =
        records.reduce(
            (sum, record) => sum + Number(record.poAmount || 0), 0);

    document.getElementById("totalRecords").innerText = totalRecords;
    document.getElementById("totalPrAmount").innerText =formatAmount(totalPrAmount);
    document.getElementById("totalPoAmount").innerText = formatAmount(totalPoAmount);
}


// ===============================
// RENDER TABLE
// ===============================
function renderTable() {
    const tableContainer = document.getElementById("tableContainer");

    updateStatistics();

    const searchText = document.getElementById("searchBox")?.value.toLowerCase().trim() || "";

    const filteredRecords =
        records.filter(record => {
            return ( (record.prNum || "").toLowerCase().includes(searchText) || (record.poNum || "").toLowerCase().includes(searchText));
        });

    let html = `
        <div class="table-scroll">
            <table id="data-table">
                <thead>
                    <tr>
                        <th>S.No.</th>
                        <th>PR Requirement Date</th>
                        <th>PR Creation Date</th>
                        <th>PR Number</th>
                        <th>Material Code</th>
                        <th>Material Text</th>
                        <th>Material Description</th>
                        <th>Quantity</th>
                        <th>Price Per Quantity</th>
                        <th>PR Amount</th>
                        <th>PO Number</th>
                        <th>PO Amount</th>
                        <th>Last Edited By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    filteredRecords.forEach((item, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${formatDate(item.prReqDate)}</td>
                <td>${formatDate(item.prCreationDate)}</td>
                <td>${item.prNum || "-"}</td>
                <td>${(item.plantServiceDetails || []).map((x, i) => `${i + 1}. ${x.code}`).join("<br><br>")}</td>
                <td>${(item.plantServiceDetails || []).map(x => x.shortText).join("<br><br>")}</td>
                <td>${(item.plantServiceDetails || []).map(x => x.desc).join("<br><br>")}</td>
                <td>${(item.plantServiceDetails || []).map(x => x.quantity).join("<br><br>")}</td>
                <td>${(item.plantServiceDetails || []).map(x =>formatAmount(x.pricePerQuantity)).join("<br><br>")}</td>
                <td>${formatAmount(item.prAmount || 0)}</td>
                <td>${item.poNum || "-"}</td>
                <td>${formatAmount(item.poAmount || 0)}</td>
                <td>
                    <div class="last-edited">
                        <i class="fa-solid fa-user"></i>
                        <span>${item.lastEditedBy || "-"}</span>
                    </div>
                </td>
                <td>
                    ${getCurrentPermission() === "edit" ? `
                        <button class="edit-btn" onclick="editRecord('${item._id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteRecord('${item._id}')">Delete</button>
                        `
                        : ""
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
                `${API_BASE_URL}/api/plant-service-records`
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
                `${API_BASE_URL}/api/plant-service-records/${editingRecordId}`,
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
                `${API_BASE_URL}/api/plant-service-records`,
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
                `${API_BASE_URL}/api/plant-service-records/${id}`,
                {
                    method: "DELETE"
                }
            );

        const data = await response.json();

        if (!response.ok) {
            showToast("error", data.message);
            return;
        }
        
        showToast("success", data.message || "Plant Service Record Deleted Successfully");

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
    document.getElementById("serviceContainer").innerHTML = "";

    const countText = document.getElementById("serviceCountText");
    if (countText) {
        countText.innerText = "Total Plant Service Items Added: 0";
    }
}


// ===============================
// OPEN ADD MODAL
// ===============================
function openAddModal() {
    editingRecordId = null;
    openModal();
    // Plant Service requires at least one row
    addMaterialRow();
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

    const prReqDate = document.getElementById("prReqDate").value;
    const prCreationDate = document.getElementById("prCreationDate").value;
    const prNum = document.getElementById("prNum").value.trim();
    const poNum = document.getElementById("poNum").value.trim();
    const poAmount = Number(document.getElementById("poAmount").value.replace(/,/g, "")) || 0;
    const plantServiceRows = document.querySelectorAll(".plantService-entry");
    

    if (plantServiceRows.length === 0) {
        showToast("warning", "Please add at least one Plant Service");
        return;
    }

    let plantServiceDetails = [];
    let prAmount = 0;

    plantServiceRows.forEach(row => {
        const quantity = Number(row.querySelector(".quantityField").value);
        const pricePerQuantity = Number(row.querySelector(".pricePerQuantityField").value);

        prAmount += quantity * pricePerQuantity;

        plantServiceDetails.push({
            code: row.querySelector(".codeField").value,
            shortText: row.querySelector(".shortTextField").value,
            desc: row.querySelector(".descField").value,
            quantity,
            pricePerQuantity
        });
    });

    const recordData = {
        prReqDate,
        prCreationDate,
        prNum,
        prAmount,
        poNum,
        poAmount,
        plantServiceDetails
    };
    
    await saveRecord(recordData);
}


function formatDateForInput(dateValue) {
    if (!dateValue) {
        return "";
    }
    return new Date(dateValue).toISOString().split("T")[0];
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

    document.getElementById("prReqDate").value = formatDateForInput(record.prReqDate);
    document.getElementById("prCreationDate").value = formatDateForInput(record.prCreationDate);
    document.getElementById("prNum").value = record.prNum || "";
    document.getElementById("poNum").value = record.poNum || "";
    document.getElementById("poAmount").value = Number(record.poAmount || 0).toLocaleString("en-IN");
    document.getElementById("serviceContainer").innerHTML = "";

    if (record.plantServiceDetails && record.plantServiceDetails.length > 0) {
        record.plantServiceDetails.forEach(plantService => {
            addMaterialRow(plantService);
        });
    }
}


// ============================================================================================================================
// SERVICE MANAGEMENT
// ============================================================================================================================

// ===============================
// ADD MATERIAL ROW
// ===============================
function addMaterialRow(material = {}) {

    const container = document.getElementById("serviceContainer");

    const div = document.createElement("div");

    div.className = "plantService-entry";

    div.innerHTML = `
        <button type="button" class="remove-service-btn" onclick="removeMaterialRow(this)">✖</button>
        <div class="service-title">Material</div>

        <input type="text" class="codeField" placeholder="Material Code" value="${material.code || ""}" required>
        <input type="text" class="shortTextField" placeholder="Material Text" value="${material.shortText || ""}" required>
        <input type="text" class="descField" placeholder="Material Description" value="${material.desc || ""}" required>
        <input type="number" class="quantityField" placeholder="Quantity" value="${material.quantity || ""}" min="1" required>
        <input type="number" class="pricePerQuantityField" placeholder="Price Per Quantity" value="${material.pricePerQuantity || ""}" min="0" required>
    `;

    container.appendChild(div);

    updateMaterialDeleteButtons();
    updateMaterialCount();
    updateMaterialNumbers();
}


// ===============================
// REMOVE MATERIAL ROW
// ===============================
function removeMaterialRow(button) {
    button.closest(".plantService-entry").remove();

    updateMaterialDeleteButtons();
    updateMaterialCount();
    updateMaterialNumbers();
}


function updateMaterialDeleteButtons() {
    const rows = document.querySelectorAll(".plantService-entry");

    rows.forEach(row => {
        const btn = row.querySelector(".remove-service-btn");
        btn.style.display = rows.length === 1 ? "none" : "flex";
    });

}

function updateMaterialCount() {
    const total = document.querySelectorAll(".plantService-entry").length;
    const countText = document.getElementById("serviceCountText");

    if (countText) {
        countText.innerText = `Total Plant Service Items Added: ${total}`;
    }
}

function updateMaterialNumbers() {
    const rows = document.querySelectorAll(".plantService-entry");

    rows.forEach((row, index) => {
        const title = row.querySelector(".service-title");
        if (title) {
            title.innerText = `${index + 1}`;
        }
    });
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



document.getElementById("poAmount").addEventListener("input", function () {
    formatAmountInput(this);
});



// ===============================
// INVENTORY MENU TOGGLE
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    const inventoryBtn =
        document.getElementById("inventoryToggleBtn");

    const inventorySubMenu =
        document.getElementById("inventorySubMenu");

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