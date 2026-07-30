// ===============================
// GLOBAL VARIABLES
// ===============================
let records = [];    // Stores all PO records
let editingRecordId = null;  // record being edited
let deletedDocuments = [];  // stores deleted documents
let poDateSortOrder = "desc";
let currentInvoicePdf = null;
let removeInvoicePdfFlag = false;
let fixedDocuments = {  // Justification / NFA / Agreement files
    JUSTIFICATION: {
        existing: null,
        newFile: null
    },
    NFA: {
        existing: null,
        newFile: null
    },
    AGREEMENT: {
        existing: null,
        newFile: null
    }
};


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

    // No Contract access
    if (contractPermission === "none") {
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

    if (plantServicePermission === "none") {
        document.getElementById("plantServiceBtn").style.display = "none";
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
    return localStorage.getItem("contractPermission") || "none";
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
    window.open(`${API_BASE_URL}/api/contract-records/export`, "_blank");
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
                `${API_BASE_URL}/api/contract-records/import`,
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

function getPOStatus(record) {
    if(record.renewed){
        return{
            text:"Created New PR/PO",
            className:"status-renewed"
        };
    }
    
    const poEndDate = record.poEndDate;
    
    if(!poEndDate) {
        return {
            text: "-",
            className: "status-unknown"
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(poEndDate);
    endDate.setHours(0, 0, 0, 0);
    
    const twoMonthsLater = new Date(today);
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    
    if (endDate < today) {
        return {
            text: "Expired",
            className: "status-expired"
        };
    }
    
    if (endDate <= twoMonthsLater) {
        return {
            text: "Expiring Soon",
            className: "status-expiring"
        };
    }
    
    return {
        text: "Active",
        className: "status-active"
    };
}

// ===============================
// UPDATE STATISTICS
// ===============================
function updateStatistics() {

    const totalRecords = records.length;

    const totalPoAmount =
        records.reduce(
            (sum, record) =>
                sum + Number(record.poAmount || 0),
            0
        );

    const totalBalanceAmount =
        records.reduce(
            (sum, record) =>
                sum + Number(record.balanceAmount || 0),
            0
        );

    const totalInvoices =
        records.reduce(
            (sum, record) =>
                sum + Number(record.invoiceCount || 0),
            0
        );

    document.getElementById("totalRecords").innerText = totalRecords;
    document.getElementById("totalPoAmount").innerText = formatAmount(totalPoAmount);
    document.getElementById("totalBalanceAmount").innerText = formatAmount(totalBalanceAmount);
    document.getElementById("totalInvoices").innerText = totalInvoices;
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
            const matchesSearch = (record.vendorName || "").toLowerCase().includes(searchText) || (record.po || "").toLowerCase().includes(searchText);
            return matchesSearch;
        });

    filteredRecords.sort((a, b) => {
        const dateA = new Date(a.poDate);
        const dateB = new Date(b.poDate);
        
        return poDateSortOrder === "desc"
            ? dateB - dateA
            : dateA - dateB;
    });

    let html = `
        <div class="table-scroll">
            <table id="data-table">
                <thead>
                    <tr>
                        <th>S.No.</th>
                        <th>Vendor Name</th>
                        <th>Vendor Code</th>
                        <th>Total Invoices Paid</th>
                        <th>Purchase Requestor (PR)</th>
                        <th>Purchase Order (PO)</th>
                        <th>PO Date</th>
                        <th>PO Description</th>
                        <th>Type</th>
                        <th>Service / Material Code</th>
                        <th>Service / Material Short Text</th>
                        <th>PO Period</th>
                        <th>PO Status</th>
                        <th>PO Amount</th>
                        <th>Balance Amount</th>
                        <th>Documents</th>
                        <th>More Details</th>
                        <th>Last Edited By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
            <tbody>                    
    `;

    filteredRecords.forEach((item, index) => {
        const status = getPOStatus(item);
        html += `
            <tr id="row-${item._id}" class="${status.className}-row">
                <td>${index + 1}</td>
                <td>${item.vendorName}</td>
                <td>${item.vendorCode}</td>
                <td>${item.invoiceCount || 0}</td>
                <td>${item.pr}</td>
                <td>${item.po}</td>
                <td>${formatDate(item.poDate)}</td>
                <td>${item.poDescription}</td>
                <td>${(item.serviceDetails || []).map((x, index) => `${index + 1}. ${x.itemType === "service" ? "Service" : "Material"}`).join("<br><br>")}</td>
                <td>${item.serviceDetails?.map(x => x.code).join("<br><br>")}</td>
                <td>${item.serviceDetails ?.map(x => x.shortText).join("<br><br>")}</td>
                <td>${formatDate(item.poStartDate)} to ${formatDate(item.poEndDate)}</td>
                <td>
                    <span class="status-badge ${status.className}">
                        ${status.text}
                    </span>
                </td>
                <td>${formatAmount(item.poAmount)}</td>
                <td>${formatAmount(item.balanceAmount)}</td>
                <td>
                    ${item.documents && item.documents.length > 0 ? item.documents.map(doc => `
                        <div style="margin-bottom:8px;">
                            <a href="${API_BASE_URL}/uploads/${doc.fileName}" target="_blank">${doc.type}</a>
                        </div>
                    `).join("")
                    : "No Document"
                    }
                </td>
                <td>
                    <button id="details-btn-${item._id}" onclick="toggleDetails('${item._id}')" class="details-btn">
                        View Details
                    </button>
                </td>

                <td>
                    <div class="last-edited">
                        <i class="fa-solid fa-user"></i>
                        <span>${item.lastEditedBy || "-"}</span>
                    </div>
                </td>

                <td>
                    ${getCurrentPermission() === "edit"? `
                        <button class="edit-btn" onclick="editRecord('${item._id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteRecord('${item._id}')">Delete</button>
                    `
                    : ""
                    }
                </td>
            </tr>
            <tr id="details-${item._id}" class="details-row" style="display:none;">
            <td colspan="100%">
            <div class="detail-section">
                ${getCurrentPermission() === "edit" ? `
                    <button class="add-btn" onclick="addDetailRow('${item._id}')">+ Add Detail</button>
                    ` : ""
                }
                <div id="detail-form-${item._id}"></div>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>S.No.</th>
                            <th>Service Code</th>
                            <th>Invoice / External Number</th>
                            <th>Invoice Date</th>
                            <th>Tracking Number</th>
                            <th>Invoice Period</th>
                            <th>Invoice Amount</th>
                            <th>Service Entry Number</th>
                            <th>Document Number</th>
                            <th>Invoice PDF</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody id="details-body-${item._id}">
                        <tr>
                            <td colspan="11">
                                Loading...
                            </td>
                        </tr>
                    </tbody>
                </table>
                </div>
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
                    <td colspan="18" class="no-data">
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
        const response = await fetch(`${API_BASE_URL}/api/contract-records`);

        records = await response.json();

        renderTable();
    }
    catch (error) {
        console.log(error);
    }
}


async function loadReferencePOs() {

    const select = document.getElementById("referencePO");

    select.innerHTML = `
        <option value="">
            No Reference PO
        </option>
    `;

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/contract-records/reference-pos`
        );

        const data = await response.json();

        data.forEach(record => {

            const status = getPOStatus(record);

            if (
                status.text === "Expired" ||
                status.text === "Expiring Soon"
            ) {

                const option = document.createElement("option");

                option.value = record._id;

                option.textContent =
                    `${record.po} - ${record.vendorName} (${status.text})`;

                select.appendChild(option);
            }

        });

    }
    catch(error){
        console.log(error);
    }
}

// ===============================
// SAVE RECORD
// ===============================
async function saveRecord(formData) {
    try {
        let response;

        formData.append("lastEditedBy", localStorage.getItem("loggedInUserName"));

        if (editingRecordId) {
            formData.append("removedDocuments",JSON.stringify(deletedDocuments));

            response = await fetch(
                `${API_BASE_URL}/api/contract-records/${editingRecordId}`,
                {
                    method: "PUT",
                    body: formData
                }
            );
        }
        else {
            response = await fetch(
                `${API_BASE_URL}/api/contract-records`,
                {
                    method: "POST",
                    body: formData
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
        await loadReferencePOs();
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
        const response = await fetch(
            `${API_BASE_URL}/api/contract-records/${id}`,
            {
                method: "DELETE"
            }
        );
        
        const data = await response.json();

        if (response.ok) {
            showToast("success", data.message || "Record Deleted Successfully");
            await loadRecords();
        }
        else {
            showToast("error", data.message);
        }
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

    document.getElementById("documentContainer").innerHTML = "";
    document.getElementById("serviceContainer").innerHTML = "";

    const countText = document.getElementById("serviceCountText");
    if (countText) {
        countText.innerText =
            "Total Services Added: 0";
    }

    // Contract always uses Service Section
    document.getElementById("serviceSection").style.display = "block";
    fixedDocuments = {
        JUSTIFICATION: {
            existing: null,
            newFile: null
        },
        NFA: {
            existing: null,
            newFile: null
        },
        AGREEMENT: {
            existing: null,
            newFile: null
        }
    };

    document.getElementById("fixedDocumentPreview").innerHTML = "";
    document.getElementById("fixedDocumentFile").disabled = false;
    document.getElementById("documentTypeSelector").value = "JUSTIFICATION";

    switchDocumentType();
}

// ===============================
// OPEN ADD MODAL
// ===============================
function openAddModal() {
    editingRecordId = null;
    deletedDocuments = [];

    document.getElementById("documentContainer").innerHTML =
        "";

    openModal();
    loadReferencePOs();

    // Contract always requires at least one Service/Material row
    addServiceRow();
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

    const vendorCode = document.getElementById("vendorCode").value.trim();
    const vendorName = document.getElementById("vendorName").value.trim();
    const po = document.getElementById("po").value.trim();
    const poDate = document.getElementById("poDate").value;
    const pr = document.getElementById("pr").value.trim();
    const poDescription = document.getElementById("poDescription").value.trim();
    const poStartDate = document.getElementById("poStartDate").value;
    const poEndDate = document.getElementById("poEndDate").value;
    const documentRows = document.querySelectorAll("#documentContainer .document-entry");

    if (poEndDate < poStartDate) {
        showToast("warning", "End Date cannot be before Start Date");
        return;
    }

    let serviceDetails = [];
    let poAmount = 0;

    const serviceRows = document.querySelectorAll(".service-entry");

    if (serviceRows.length === 0) {
        showToast("warning", "Please add at least one Service / Material");
        return;
    }

    serviceRows.forEach(row => {
        const quantity = Number(row.querySelector(".quantityField").value);
        const pricePerQuantity = Number(row.querySelector(".pricePerQuantityField").value);

        poAmount += quantity * pricePerQuantity;
    
        serviceDetails.push({
            itemType: row.querySelector(".itemType").value,
            code: row.querySelector(".codeField").value,
            shortText: row.querySelector(".shortTextField").value,
            quantity,
            pricePerQuantity
        });
    });

    const formData = new FormData();

    formData.append("category","Contract Resource and Support PRs");
    formData.append("vendorCode",vendorCode);
    formData.append("vendorName",vendorName);
    formData.append("po",po);
    formData.append("poDate", poDate);
    formData.append("pr", pr);
    formData.append("poDescription",poDescription);
    formData.append("poAmount",poAmount);
    formData.append("poStartDate",poStartDate);
    formData.append("poEndDate",poEndDate);
    formData.append("poPeriod", document.getElementById("poPeriod").value);
    formData.append("serviceDetails",JSON.stringify(serviceDetails));

    const documentTypes = [];
    
    ["JUSTIFICATION","NFA","AGREEMENT"].forEach(type => {
        const file = fixedDocuments[type]?.newFile;
        if(file){
            formData.append("documents", file);
            documentTypes.push(type);
        }
    });

    // OTHERS
    documentRows.forEach(row => {
        const fileInput = row.querySelector(".documentFile");
        if (!fileInput) {
            return;
        }
        const file = fileInput.files[0];
        if (file) {
            formData.append("documents", file);
            documentTypes.push("OTHER");
        }
    });

    formData.append("documentTypes", JSON.stringify(documentTypes));

    formData.append("referencePO", document.getElementById("referencePO").value);

    await saveRecord(formData);
}



function formatDateForInput(dateValue) {
    if (!dateValue) {
        return "";
    }
    return new Date(dateValue).toISOString().split("T")[0];
}

// ===============================
// CALCULATE END DATE
// ===============================
function calculateEndDate(startDateValue, periodType) {

    if (!startDateValue || !periodType) {
        return "";
    }

    const date = new Date(startDateValue);

    if (periodType === "Monthly") {
        date.setMonth(date.getMonth() + 1);
    }
    else if (periodType === "Quarterly") {
        date.setMonth(date.getMonth() + 3);
    }
    else if (periodType === "Half-Yearly") {
        date.setMonth(date.getMonth() + 6);
    }
    else if (periodType === "Yearly") {
        date.setFullYear(date.getFullYear() + 1);
    }

    date.setDate(date.getDate() - 1);

    return date.toISOString().split("T")[0];
}


// ===============================
// EDIT RECORD
// ===============================
async function editRecord(id) {
    if (getCurrentPermission() !== "edit") {
        showToast("warning", "You do not have permission.");
        return;
    }

    const record = records.find(item => item._id === id);
    if (!record) {
        return;
    }

    editingRecordId = id;
    deletedDocuments = [];

    openModal();
    await loadReferencePOs();

    document.getElementById("documentContainer").innerHTML = "";

    document.getElementById("vendorCode").value = record.vendorCode;
    document.getElementById("vendorName").value = record.vendorName;
    document.getElementById("po").value = record.po;
    document.getElementById("poDate").value = formatDateForInput(record.poDate);
    document.getElementById("pr").value = record.pr || "";
    document.getElementById("poDescription").value = record.poDescription;
    document.getElementById("poStartDate").value = formatDateForInput(record.poStartDate);
    document.getElementById("poPeriod").value = record.poPeriod || "";
    document.getElementById("poEndDate").value = formatDateForInput(record.poEndDate);
    document.getElementById("serviceContainer").innerHTML = "";

    if (record.serviceDetails) {
        record.serviceDetails.forEach(service => {
            addServiceRow(service);
        });
    }
    if (record.documents) {    
        fixedDocuments = {
            JUSTIFICATION: {
                existing: null,
                newFile: null
            },
            NFA: {
                existing: null,
                newFile: null
            },
            AGREEMENT: {
                existing: null,
                newFile: null
            }
        };
        
        record.documents.forEach(doc => {
        
            if (doc.type === "JUSTIFICATION" || doc.type === "NFA" || doc.type === "AGREEMENT") {
                fixedDocuments[doc.type] = {
                    existing: {
                        id: doc._id,
                        fileName: doc.fileName
                    },
                    newFile: null
                };
            }
            else if (doc.type === "OTHER") {
                addDocumentRow(doc.fileName, doc._id);
            }
        });
        
        switchDocumentType();
    }
}


// ============================================================================================================================
// SERVICE MANAGEMENT
// ============================================================================================================================

// ===============================
// ADD SERVICE ROW
// ===============================
function addServiceRow(service = {}) {
    service.itemType = service.itemType || "service";

    const container = document.getElementById("serviceContainer");

    const div = document.createElement("div");

    div.className = "service-entry";

    div.innerHTML = `
        <button type="button" class="remove-service-btn" onclick="removeServiceRow(this)">✖</button>

        <div class="service-title">
            Service
        </div>

        <select class="itemType" onchange="toggleTypeFields(this)">
            <option value="service" ${service.itemType === "service" ? "selected" : ""}>
                Service
            </option>
            <option value="material" ${service.itemType === "material" ? "selected" : ""}>
                Material
            </option>
        </select>

        <input type="text" class="codeField" placeholder="${service.itemType === "material" ? "Material Code" : "Service Code"}" value="${service.code || ""}" required>
        <input type="text" class="shortTextField" placeholder="${service.itemType === "material" ? "Material Short Text" : "Service Short Text"}" value="${service.shortText || ""}" required>
        <input type="number" class="quantityField" placeholder="Quantity" value="${service.quantity || ""}" min="1" required oninput="calculatePoAmount()">
        <input type="number" class="pricePerQuantityField" placeholder="Price Per Quantity" value="${service.pricePerQuantity || ""}" min="0" required oninput="calculatePoAmount()">
    `;

    container.appendChild(div);

    updateServiceDeleteButtons();
    updateServiceCount();
    updateServiceNumbers();
}


function removeServiceRow(button) {

    button.closest(".service-entry").remove();

    updateServiceDeleteButtons();
    updateServiceCount();
    updateServiceNumbers();

    calculatePoAmount();
}

function updateServiceDeleteButtons() {
    const rows = document.querySelectorAll(".service-entry");

    rows.forEach(row => {
        const btn = row.querySelector(".remove-service-btn");
        btn.style.display = rows.length === 1 ? "none" : "flex";
    });
}

function updateServiceCount() {
    const total = document.querySelectorAll(".service-entry").length;
    const countText = document.getElementById("serviceCountText");

    if (countText) {
        countText.innerText = `Total Services Added: ${total}`;
    }
}

function updateServiceNumbers() {
    const rows = document.querySelectorAll(".service-entry");

    rows.forEach((row, index) => {
        const title = row.querySelector(".service-title");
        if (title) {
            title.innerText = `${index + 1}`;
        }
    });
}

// ===============================
// CALCULATE PO AMOUNT
// ===============================
function calculatePoAmount() {

    let total = 0;

    document
        .querySelectorAll(".service-entry")
        .forEach(row => {

            const quantity =
                Number(
                    row.querySelector(".quantityField").value
                ) || 0;

            const price =
                Number(
                    row.querySelector(".pricePerQuantityField").value
                ) || 0;

            total += quantity * price;
        });

    return total;
}


// ===============================
// SELECTOR (SERVICE/MATERIAL)
// ===============================
function toggleTypeFields(selectElement) {
    const row = selectElement.closest(".service-entry");
    const codeField = row.querySelector(".codeField");
    const shortTextField = row.querySelector(".shortTextField");
    if (selectElement.value === "service") {
        codeField.placeholder = "Service Code";
        shortTextField.placeholder = "Service Short Text";
    } else {
        codeField.placeholder = "Material Code";
        shortTextField.placeholder = "Material Short Text";
    }
}


// ============================================================================================================================
// DOCUMENT MANAGEMENT
// ============================================================================================================================

// ===============================
// ADD DOCUMENTS
// ===============================
function addDocumentRow(fileName = "", documentId = "") {
    const container = document.getElementById("documentContainer");
    const div = document.createElement("div");

    div.className = "document-entry";

    if (fileName) {
        div.innerHTML = `
            <span>${fileName}</span>
            <button type="button" class="remove-document-btn" onclick="removeExistingOtherDocument('${documentId}', this)">✖</button>
        `;
    }
    else {
        div.innerHTML = `
            <input type="file" class="documentFile" accept=".pdf">
        `;
    }
    container.appendChild(div);
}

// ===============================
// REMOVE EXISTING DOCUMENTS
// ===============================
function removeExistingDocument(documentId, type) {
    deletedDocuments.push(documentId);

    fixedDocuments[type] = {
        existing: null,
        newFile: null
    };
    switchDocumentType();
}

// ===============================
// REMOVE EXISTING DOCUMENTS (IN OTHER FIELD)
// ===============================
function removeExistingOtherDocument(documentId, button) {
    deletedDocuments.push(documentId);
    button.closest(".document-entry").remove();
}

// ===============================
// REMOVE NEW DOCUMENT
// ===============================
function removeNewDocument(type) {
    fixedDocuments[type].newFile = null;

    document.getElementById("fixedDocumentFile").value = "";

    switchDocumentType();
}


// ===============================
// SWITCH DOCUMENT TYPE
// ===============================
function switchDocumentType() {

    const selectedType = document.getElementById("documentTypeSelector").value;
    const fileInput = document.getElementById("fixedDocumentFile");
    const preview = document.getElementById("fixedDocumentPreview");
    const documentData = fixedDocuments[selectedType];

    preview.innerHTML = "";
    fileInput.value = "";

    if (documentData?.existing) {
        fileInput.disabled = true;

        preview.innerHTML = `
            <div class="document-entry">
                <span>${documentData.existing.fileName}</span>
                <button type="button" class="remove-document-btn" onclick="removeExistingDocument('${documentData.existing.id}', '${selectedType}')">✖</button>
            </div>
        `;
    }
    else {
        fileInput.disabled = false;

        if (documentData?.newFile) {
            preview.innerHTML = `
                <div class="document-entry">
                    <span>${documentData.newFile.name}</span>
                    <button type="button" class="remove-document-btn" onclick="removeNewDocument('${selectedType}')">✖</button>
                </div>
            `;
        }
    }
}


// ============================================================================================================================
// DETAIL MANAGEMENT
// ============================================================================================================================

// ===============================
// ADD DETAIL ROW
// ===============================
function addDetailRow(recordId) {
    if (getCurrentPermission() !== "edit") {
        showToast("warning", "You do not have permission.");
        return;
    }

    currentInvoicePdf = null;
    removeInvoicePdfFlag = false;

    document.getElementById("invoicePdf").disabled = false;
    document.getElementById("invoicePdfPreview").innerHTML = "";

    document.getElementById("detailForm").reset();
    document.getElementById("detailId").value = "";
    document.getElementById("detailRecordId").value = recordId;

    const record = records.find(r => r._id === recordId);
    const serviceGroup = document.getElementById("serviceCodeGroup");
    const serviceList = document.getElementById("serviceCodeList");
    
    serviceGroup.style.display = "block";
    serviceList.innerHTML = "";
    
    if (record?.serviceDetails) {
        record.serviceDetails.forEach((service, index) => {
            serviceList.innerHTML += `
                <label class="service-checkbox-item">
                    <input type="checkbox" class="serviceCodeCheckbox" value="${service.code}">
                    ${index + 1}. ${service.code} (${service.shortText})
                </label>
            `;
        });
    }
    document.getElementById("detailModal").style.display = "block";
}

// ===============================
// SAVE DETAIL
// ===============================
async function saveDetail(event) {
    event.preventDefault();

    const detailId = document.getElementById("detailId").value;
    const recordId = document.getElementById("detailRecordId").value;
    const selectedServices = Array.from(
        document.querySelectorAll(".serviceCodeCheckbox:checked")
    ).map(checkbox => checkbox.value);
    
    if (selectedServices.length === 0) {
        showToast("warning", "Please select at least one Service / Material Code");
        return;
    }
    const serviceEntryNumber = document.getElementById("serviceEntryNumber").value.trim();
    const invoiceNumber = document.getElementById("invoiceNumber").value.trim();
    const trackingNumber = document.getElementById("trackingNumber").value.trim();
    const documentNumber = document.getElementById("documentNumber").value.trim();
    const invoicePeriodStartDate = document.getElementById("invoicePeriodStartDate").value;
    const invoicePeriodEndDate = document.getElementById("invoicePeriodEndDate").value;
    const invoiceDate = document.getElementById("invoiceDate").value;
    const invoiceAmount = document.getElementById("invoiceAmount").value.replace(/,/g, "");
    const invoicePdf = currentInvoicePdf;

    const record = records.find(record => record._id === recordId);

    if (!detailId && record && Number(invoiceAmount) > Number(record.balanceAmount)) {
        showToast("warning", "Invoice Amount should be less than or equal to Balance Amount");
        return;
    }

    const formData = new FormData();

    formData.append("recordId", recordId);
    formData.append("serviceCodes", JSON.stringify(selectedServices));
    formData.append("serviceEntryNumber", serviceEntryNumber);
    formData.append("invoiceNumber", invoiceNumber);
    formData.append("trackingNumber", trackingNumber);
    formData.append("documentNumber", documentNumber);
    formData.append("invoicePeriodStartDate",invoicePeriodStartDate);
    formData.append("invoicePeriodEndDate",invoicePeriodEndDate);
    formData.append("invoicePeriod",document.getElementById("invoicePeriod").value);
    formData.append("invoiceDate", invoiceDate);
    formData.append("invoiceAmount",invoiceAmount);
    formData.append("removeInvoicePdf",removeInvoicePdfFlag);
    formData.append("lastEditedBy", localStorage.getItem("loggedInUserName"));
    if (invoicePdf) {
        formData.append("invoicePdf", invoicePdf);
    }

    try {
        const baseUrl = `${API_BASE_URL}/api/contract-details`;

        const url = detailId ? `${baseUrl}/${detailId}` : baseUrl;

        const method = detailId ? "PUT" : "POST";
        const response =
            await fetch(
                url,
                {
                    method,
                    body: formData
                }
            );

        const data = await response.json();

        if (response.ok) {
            showToast(
                "success",
                detailId
                    ? "Detail Updated Successfully"
                    : "Detail Added Successfully"
            );

            document.getElementById("detailForm").reset();
            document.getElementById("detailId").value = "";
            closeDetailModal();
            await loadRecords();
        }
        else {
            showToast("error", data.message);
        }
    }
    catch(error) {
        console.log(error);
        showToast("error", "Server Error");
    }
}

// ===============================
// EDIT DETAIL
// ===============================
async function editDetail(id) {
    if (getCurrentPermission() !== "edit") {
        showToast("warning", "You do not have permission.");
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/api/contract-details/single/${id}`);

        const detail = await response.json();

        if (!response.ok) {
            showToast("error", detail.message);
            return;
        }

        removeInvoicePdfFlag = false;

        document.getElementById("detailId").value = detail._id;
        document.getElementById("detailRecordId").value = detail.recordId;

        const record = records.find(r => r._id === detail.recordId);

        const serviceGroup = document.getElementById("serviceCodeGroup");
        const serviceList = document.getElementById("serviceCodeList");
        
        serviceGroup.style.display = "block";
        serviceList.innerHTML = "";
        
        const selectedServices = detail.serviceCodes || [];
        
        if (record?.serviceDetails) {
            record.serviceDetails.forEach((service, index) => {
        
                const checked = selectedServices.includes(service.code)
                    ? "checked"
                    : "";
        
                serviceList.innerHTML += `
                    <label class="service-checkbox-item">
                        <input
                            type="checkbox"
                            class="serviceCodeCheckbox"
                            value="${service.code}"
                            ${checked}
                        >
        
                        ${index + 1}. ${service.code} (${service.shortText})
                    </label>
                `;
            });
        }
        
        document.getElementById("serviceEntryNumber").value = detail.serviceEntryNumber;
        document.getElementById("invoiceNumber").value = detail.invoiceNumber;
        document.getElementById("trackingNumber").value = detail.trackingNumber || "";
        document.getElementById("documentNumber").value = detail.documentNumber || "";
        document.getElementById("invoicePeriodStartDate").value = formatDateForInput(detail.invoicePeriodStartDate);
        document.getElementById("invoicePeriod").value = detail.invoicePeriod || "";
        document.getElementById("invoicePeriodEndDate").value = formatDateForInput(detail.invoicePeriodEndDate);
        document.getElementById("invoiceDate").value = formatDateForInput(detail.invoiceDate);
        document.getElementById("invoiceAmount").value = Number(detail.invoiceAmount).toLocaleString("en-IN");

        const preview = document.getElementById("invoicePdfPreview");
        preview.innerHTML = "";
        
        currentInvoicePdf = detail.invoicePdf || null;

        const invoicePdfInput = document.getElementById("invoicePdf");

        if (detail.invoicePdf) {
            invoicePdfInput.disabled = true;
            
            preview.innerHTML = `
                <div class="invoice-pdf-entry">
                    <span>${detail.invoicePdf}</span>
                    <button type="button" class="remove-document-btn" onclick="removeExistingInvoicePdf()">✖</button>
                </div>
            `;
        }
        else {
            invoicePdfInput.disabled = false;
        }
        document.getElementById("detailModal").style.display = "block";
    }
    catch(error) {
        console.log(error);
        showToast("error", "Server Error");
    }
}

// ===============================
// DELETE DETAILS
// ===============================
async function deleteDetail(id) {
    if (getCurrentPermission() !== "edit") {
        showToast("warning", "You do not have permission.");
        return;
    }

    const confirmed =
        await showConfirm({
            title: "Delete Detail",
            message: "Are you sure you want to delete this detail?",
            confirmText: "Delete",
            cancelText: "Cancel"
        });

    if (!confirmed) {
        return;
    }

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/contract-details/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        lastEditedBy: localStorage.getItem("loggedInUserName")
                    })
                }
            );

        const data = await response.json();

        if (response.ok) {
            showToast("success", "Detail Deleted Successfully");
            await loadRecords();
        }
        else {
            showToast("error", data.message);
        }
    }
    catch(error) {
        console.log(error);
        showToast("error", "Server Error");
    }
}

// ===============================
// CLOSE DETAIL TABLE
// ===============================
function closeDetailModal() {

    document.getElementById("detailModal").style.display = "none";

    currentInvoicePdf = null;
    removeInvoicePdfFlag = false;

    document.getElementById("invoicePdf").disabled = false;
    document.getElementById("invoicePdfPreview").innerHTML = "";
}

// ===============================
// LOAD DETAIL TABLE
// ===============================
async function loadDetails(recordId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/contract-details/${recordId}`);
        const details = await response.json();
        const tbody = document.getElementById(`details-body-${recordId}`);
        if (!details.length) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align:center;">
                        No Details Added Yet
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML =
            details.map((detail, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${Array.isArray(detail.serviceCodes) && detail.serviceCodes.length? detail.serviceCodes.join("<br>"): "-"}</td>
                    <td>${detail.invoiceNumber}</td>
                    <td>${formatDate(detail.invoiceDate)}</td>
                    <td>${detail.trackingNumber || "-"}</td>
                    <td>${formatDate(detail.invoicePeriodStartDate)} to ${formatDate(detail.invoicePeriodEndDate)}</td>
                    <td>${formatAmount(detail.invoiceAmount)}</td>
                    <td>${detail.serviceEntryNumber}</td>
                    <td>${detail.documentNumber || "-"}</td>
                    <td>
                        ${detail.invoicePdf?
                            `<a href="${API_BASE_URL}/uploads/${detail.invoicePdf}" target="_blank">View PDF</a>`
                            : "No PDF"
                        }
                    </td>
                    <td>
                        ${getCurrentPermission() === "edit"?
                            `
                            <button class="edit-btn" onclick="editDetail('${detail._id}')">Edit</button>
                            <button class="delete-btn" onclick="deleteDetail('${detail._id}')">Delete</button>
                            `
                            : ""
                        }
                    </td>
                </tr>
            `).join("");
    }
    catch (error) {
        console.log(error);
        showToast("error", "Failed to load records");
    }
}

// ===============================
// TOGGLE DETAILS
// ===============================
function toggleDetails(id) {
    const row = document.getElementById(`details-${id}`);
    const button = document.getElementById(`details-btn-${id}`);
    
    if (row.style.display === "none") {
        row.style.display = "table-row";
        button.textContent = "Hide Details";
        loadDetails(id);
    } else {
        row.style.display = "none";
        button.textContent = "View Details";
    }
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
            document.querySelector(".sidebar")
                .classList.toggle("collapsed");
        });
    }
});

// ===============================
// CLOSE MODAL OUTSIDE CLICK
// ===============================
window.onclick = function(event) {
    const recordModal = document.getElementById("recordModal");
    const detailModal = document.getElementById("detailModal");

    if (event.target === recordModal) {
        closeModal();
    }
    if (event.target === detailModal) {
        closeDetailModal();
    }
};

document.getElementById("fixedDocumentFile").addEventListener("change",
    function () {
        const type = document.getElementById("documentTypeSelector").value;
        fixedDocuments[type].newFile = this.files[0];
        switchDocumentType();
});


// ===============================
// INVOICE AMOUNT FORMATTING
// ===============================
document.getElementById("invoiceAmount").addEventListener("input",
    function() {
        formatAmountInput(this);
    }
);

function removeInvoicePdf() {
    currentInvoicePdf = null;

    document.getElementById("invoicePdf").value = "";
    document.getElementById("invoicePdfPreview").innerHTML = "";
}

function removeExistingInvoicePdf() {
    removeInvoicePdfFlag = true;
    currentInvoicePdf = null;

    document.getElementById("invoicePdfPreview").innerHTML = "";
    document.getElementById("invoicePdf").disabled = false;
    document.getElementById("invoicePdf").value = "";
}

// ===============================
// INVOICE PDF PREVIEW
// ===============================
function renderInvoicePdfPreview() {
    const preview = document.getElementById("invoicePdfPreview");

    preview.innerHTML = "";

    if (!currentInvoicePdf) {
        return;
    }

    preview.innerHTML = `
        <div class="invoice-pdf-entry">
            <span>${currentInvoicePdf.name}</span>

            <button type="button" class="remove-document-btn" onclick="removeInvoicePdf()">✖</button>
        </div>
    `;
}


document.getElementById("invoicePdf").addEventListener("change",
    function () {
        currentInvoicePdf = this.files[0];
        removeInvoicePdfFlag = false;
        renderInvoicePdfPreview();
    }
);


document.getElementById("poStartDate").addEventListener("change", updatePoEndDate);

document.getElementById("poPeriod").addEventListener("change", updatePoEndDate);

function updatePoEndDate() {
    const startDate = document.getElementById("poStartDate").value;
    const period = document.getElementById("poPeriod").value;

    const endDate = calculateEndDate(startDate, period);

    if (endDate) {
        document.getElementById("poEndDate").value = endDate;
    }
}

document.getElementById("invoicePeriodStartDate").addEventListener("change", updateInvoiceEndDate);
document.getElementById("invoicePeriod").addEventListener("change", updateInvoiceEndDate);

function updateInvoiceEndDate() {
    const startDate = document.getElementById("invoicePeriodStartDate").value;
    const period = document.getElementById("invoicePeriod").value;

    const endDate = calculateEndDate(startDate, period);

    if (endDate) {
        document.getElementById("invoicePeriodEndDate").value = endDate;
    }
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


// ===============================
// TOGGLE PO DATE SORT
// ===============================
function togglePoDateSort() {
    poDateSortOrder = poDateSortOrder === "desc" ? "asc" : "desc";

    document.getElementById("sortPoDateBtn").innerText = poDateSortOrder === "desc" ? "Sort by PO Date ↓" : "Sort by PO Date ↑";

    renderTable();
}