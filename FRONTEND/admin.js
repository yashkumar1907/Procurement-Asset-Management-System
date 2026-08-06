// ===============================
// CHECK ADMIN ACCESS
// ===============================
const userRole = localStorage.getItem("loggedInUserRole");
if (userRole !== "admin") {
    if (typeof showToast === "function") {
        showToast("error", "Access Denied");
    }
    window.location.href = "login.html";
}


// ===============================
// GLOBAL VARIABLES
// ===============================
const adminName = localStorage.getItem("loggedInUserName");
let editingUserId = null;
let deletingUserId = null;
let usersData = [];


// ===============================
// WELCOME MESSAGE
// ===============================
document.getElementById("adminName").innerText = `Welcome, ${adminName}`;


// ===============================
// LOAD PROFILE (Used to show data in profile section)
// ===============================
function loadProfile() {
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileRole = document.getElementById("profileRole");
    if (profileName) {
        profileName.innerText = localStorage.getItem("loggedInUserName") || "-";
    }
    if (profileEmail) {
        profileEmail.innerText = localStorage.getItem("loggedInUserEmail") || "-";
    }
    if (profileRole) {
        profileRole.innerText = localStorage.getItem("loggedInUserRole") || "-";
    }
}

function openEditProfileModal() {

    document.getElementById("editName").value =
    localStorage.getItem("loggedInUserName");
    
    document.getElementById("editEmail").value =
    localStorage.getItem("loggedInUserEmail");
    
    document.getElementById("editProfileModal").style.display="block";
    
}

function closeEditProfileModal(){
    document.getElementById("editProfileModal").style.display="none";
}

function openPasswordModal(){
    document.getElementById("passwordForm").reset();
    document.getElementById("passwordModal").style.display="block";    
}


function closePasswordModal(){
    document.getElementById("passwordModal").style.display="none";
    document.getElementById("passwordForm").reset();
}


// ===============================
// UPDATE PROFILE
// ===============================
async function updateProfile(event) {
    event.preventDefault();

    const id = localStorage.getItem("loggedInUserId");
    const name = document.getElementById("editName").value.trim();
    const email = document.getElementById("editEmail").value.trim();

    const saveButton = document.querySelector("#editProfileModal .save-btn");

    saveButton.disabled = true;

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/auth/profile/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name,
                        email
                    })
                }
            );

        const data = await response.json();

        if (!response.ok) {
            showToast("error", data.message);
            return;
        }

        // Update Local Storage
        localStorage.setItem("loggedInUserName", data.user.name);
        localStorage.setItem("loggedInUserEmail", data.user.email);

        
        // Refresh UI
        loadProfile();

        document.getElementById("adminName").innerText = `Welcome, ${data.user.name}`;

        closeEditProfileModal();
        showToast("success", data.message);
    }
    catch (error) {
        console.error(error);
        showToast("error", "Server Error");
    }
    finally {
        saveButton.disabled = false;
    }
}

// ===============================
// CHANGE PASSWORD
// ===============================
async function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (newPassword.length < 6) {
        showToast("warning", "Password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast("warning", "New Password and Confirm Password do not match.");
        return;
    }

    const updateButton = document.querySelector("#passwordModal .save-btn");

    updateButton.disabled = true;

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/auth/change-password/${localStorage.getItem("loggedInUserId")}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        currentPassword,
                        newPassword
                    })
                }
            );

        const data = await response.json();

        if (!response.ok) {
            showToast("error", data.message);
            return;
        }

        showToast("success", data.message);
        closePasswordModal();
    }
    catch (error) {
        console.error(error);
        showToast("error", "Server Error");
    }
    finally {
        updateButton.disabled = false;
    }
}


// ===============================
// SIDEBAR SECTION SWITCHING
// ===============================
function showSection(sectionId, button) {
    document.querySelectorAll(".content-section").forEach(section => {section.style.display = "none";});
    document.querySelectorAll(".sidebar-btn").forEach(btn => {btn.classList.remove("active");});
    document.getElementById(sectionId).style.display = "block";
    if (button) {
        button.classList.add("active");
    }
}


// ===============================
// FETCH ALL USERS (SHOWING ALL USERS IN EMPLOYEE TABLE)
// ===============================
async function fetchUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users`);
        const users = await response.json();
        // Storing data globally so that it can be used later also in any other function
        usersData = users;

        const tableBody = document.getElementById("userTableBody");
        if (!tableBody) {
            return;
        }

        // Clear old rows
        tableBody.innerHTML = "";

        // Fills the data (response we got) in table 
        users.forEach((user) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.permissions?.network || "none"}</td>
                <td>${user.permissions?.amc || "none"}</td>
                <td>${user.permissions?.contract || "none"}</td>
                <td>${user.permissions?.inventoryNetwork || "none"}</td>
                <td>${user.permissions?.inventoryHardware || "none"}</td>
                <td>${user.permissions?.inventoryDepartment || "none"}</td>
                <td>${user.permissions?.plantMaterial || "none"}</td>
                <td>${user.permissions?.plantService || "none"}</td>
                <td>${user.permissions?.wbsProject || "none"}</td>
                <td>
                    ${user.role === "admin"?
                        `<span>Admin</span>`
                        :
                        ` <button class="edit-btn" onclick="editPermissions('${user._id}')">Edit</button>
                          <button class="delete-btn" onclick="deleteUser('${user._id}')">Delete</button>
                        `
                    }
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    catch (error) {
        console.error(error);
        showToast("error", "Failed to fetch users");
    }
}


// ===============================
// ADD USER
// ===============================
async function addUser() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const networkPermission = document.getElementById("networkPermission").value;
    const amcPermission = document.getElementById("amcPermission").value;
    const contractPermission = document.getElementById("contractPermission").value;
    const inventoryNetworkPermission = document.getElementById("inventoryNetworkPermission").value;
    const inventoryHardwarePermission = document.getElementById("inventoryHardwarePermission").value;
    const inventoryDepartmentPermission = document.getElementById("inventoryDepartmentPermission").value;
    const plantMaterialPermission = document.getElementById("plantMaterialPermission").value;
    const plantServicePermission = document.getElementById("plantServicePermission").value;
    const wbsProjectPermission = document.getElementById("wbsProjectPermission").value;

    if (!name || !email || !password) {
        showToast("warning", "Please fill all fields");
        return;
    }

    const addButton = document.querySelector("#addEmployeeSection button");
    addButton.disabled = true;

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/add-user`,
                {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        name,
                        email,
                        password,
                        permissions:
                            {
                                network: networkPermission,
                                amc: amcPermission,
                                contract: contractPermission,
                                inventoryNetwork: inventoryNetworkPermission,
                                inventoryHardware: inventoryHardwarePermission,
                                inventoryDepartment: inventoryDepartmentPermission,
                                plantMaterial: plantMaterialPermission,
                                plantService: plantServicePermission,
                                wbsProject: wbsProjectPermission
                            }
                    })
                }
            );

            const data = await response.json();
            
            if (response.ok) {
                showToast("success", "Employee Added Successfully");

                document.getElementById("name").value = "";
                document.getElementById("email").value = "";
                document.getElementById("password").value = "";

                document.getElementById("networkPermission").value = "none";
                document.getElementById("amcPermission").value = "none";
                document.getElementById("contractPermission").value = "none";
                document.getElementById("inventoryNetworkPermission").value = "none";
                document.getElementById("inventoryHardwarePermission").value = "none";
                document.getElementById("inventoryDepartmentPermission").value = "none";
                document.getElementById("plantMaterialPermission").value = "none";
                document.getElementById("plantServicePermission").value = "none";
                document.getElementById("wbsProjectPermission").value = "none";

                fetchUsers();  
                showSection("employeeListSection",document.querySelectorAll(".sidebar-btn")[2]);
            }
            else {
                showToast("error", data.message);
            }
    }
    catch (error) {
        console.error(error);
        showToast("error", "Server Error");
    }
    finally {
        addButton.disabled = false;
    }
}


function deleteUser(id) {
    const user = usersData.find(user => user._id === id);
    if (!user) {
        return;
    }

    deletingUserId = id;

    document.getElementById("deleteUserName").innerText = user.name;
    document.getElementById("deleteUserEmail").innerText = user.email;
    document.getElementById("deleteUserRole").innerText = user.role;

    document.getElementById("deletePermissionsContainer").innerHTML = `
        <div class="profile-row">
            <span>Network</span>
            <strong>${user.permissions?.network || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>AMC</span>
            <strong>${user.permissions?.amc || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>Contract</span>
            <strong>${user.permissions?.contract || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>Inventory Network</span>
            <strong>${user.permissions?.inventoryNetwork || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>Inventory Hardware</span>
            <strong>${user.permissions?.inventoryHardware || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>Inventory Department</span>
            <strong>${user.permissions?.inventoryDepartment || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>Plant Material</span>
            <strong>${user.permissions?.plantMaterial || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>Plant Service</span>
            <strong>${user.permissions?.plantService || "none"}</strong>
        </div>

        <div class="profile-row">
            <span>WBS Project</span>
            <strong>${user.permissions?.wbsProject || "none"}</strong>
        </div>
    `;

    document.getElementById("deleteUserModal").style.display = "block";
}


async function confirmDeleteUser() {
    const deleteButton = document.getElementById("confirmDeleteBtn");

    deleteButton.disabled = true;
    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/delete-user/${deletingUserId}`,
                {
                    method: "DELETE"
                }
            );

        const data = await response.json();

        if (response.ok) {
            showToast("success", "Employee Deleted Successfully");
            closeDeleteModal();
            fetchUsers();
        }
        else {
            showToast("error", data.message);
        }
    }
    catch (error) {
        console.error(error);
        showToast("error", "Server Error");
    }
    finally {
        deleteButton.disabled = false;
    }
}



function closeDeleteModal() {
    document.getElementById("deleteUserModal").style.display = "none";
    deletingUserId = null;
}


// ===============================
// OPEN PERMISSION MODAL
// ===============================
function editPermissions(id) {
    editingUserId = id;

    const user = usersData.find(user => user._id === id);
    if (!user) {
        return;
    }

    document.getElementById("editNetworkPermission").value = user.permissions?.network || "none";
    document.getElementById("editAmcPermission").value = user.permissions?.amc || "none";
    document.getElementById("editContractPermission").value = user.permissions?.contract || "none";
    document.getElementById("editInventoryNetworkPermission").value = user.permissions?.inventoryNetwork || "none";
    document.getElementById("editInventoryHardwarePermission").value = user.permissions?.inventoryHardware || "none";
    document.getElementById("editInventoryDepartmentPermission").value = user.permissions?.inventoryDepartment || "none";
    document.getElementById("editPlantMaterialPermission").value = user.permissions?.plantMaterial || "none";
    document.getElementById("editPlantServicePermission").value = user.permissions?.plantService || "none";
    document.getElementById("editWbsProjectPermission").value = user.permissions?.wbsProject || "none";
    document.getElementById("permissionModal").style.display = "block";
}


// ===============================
// CLOSE PERMISSION MODAL
// ===============================
function closePermissionModal() {
    document.getElementById("permissionModal").style.display = "none";
    editingUserId = null;
}


// ===============================
// SAVE PERMISSIONS
// ===============================
async function savePermissions() {
    const network = document.getElementById("editNetworkPermission").value;
    const amc = document.getElementById("editAmcPermission").value;
    const contract = document.getElementById("editContractPermission").value;
    const inventoryNetwork = document.getElementById("editInventoryNetworkPermission").value;
    const inventoryHardware = document.getElementById("editInventoryHardwarePermission").value;
    const inventoryDepartment = document.getElementById("editInventoryDepartmentPermission").value;
    const plantMaterial = document.getElementById("editPlantMaterialPermission").value;
    const plantService = document.getElementById("editPlantServicePermission").value;
    const wbsProject = document.getElementById("editWbsProjectPermission").value;

    const saveButton = document.querySelector("#permissionModal button");
    saveButton.disabled = true;

    try {
        const response =
            await fetch(
                `${API_BASE_URL}/api/admin/update-permissions/${editingUserId}`,
                {
                    method: "PUT",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({permissions: {network, amc, contract, inventoryNetwork, inventoryHardware, inventoryDepartment, plantMaterial, plantService, wbsProject}
                    })
                }
            );

        const data = await response.json();

        if (response.ok) {
            showToast("success", "Permissions Updated Successfully");
            closePermissionModal();
            fetchUsers();
        }
        else {
            showToast("error", data.message);
        }
    }
    catch (error) {
        console.error(error);
        showToast("error", "Server Error");
    }
    finally {
        saveButton.disabled = false;
    }
}


// ===============================
// CLOSE MODAL ON OUTSIDE CLICK
// ===============================
window.onclick = function(event) {
    const permissionModal = document.getElementById("permissionModal");
    const deleteModal = document.getElementById("deleteUserModal");
    const editModal = document.getElementById("editProfileModal");
    const passwordModal = document.getElementById("passwordModal");

    if (event.target === permissionModal) {
        closePermissionModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    if(event.target===editModal){
        closeEditProfileModal();
    }
    if(event.target===passwordModal){
        closePasswordModal();
    }
};


// ===============================
// LOGOUT
// ===============================
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}


// ===============================
// INITIAL LOAD
// ===============================
loadProfile();
fetchUsers();

const defaultButton = document.getElementById("profileBtn");
if (defaultButton) {
    showSection("profileSection",defaultButton);
}


document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDeleteUser);