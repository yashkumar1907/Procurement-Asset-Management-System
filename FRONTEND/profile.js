// ===============================
// PAGE INITIALIZATION
// ===============================
window.onload = function () {

    const userName =
        localStorage.getItem("loggedInUserName");

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

    loadProfile();
    applyPermissions();
};


// ===============================
// LOAD PROFILE
// ===============================
function loadProfile() {

    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");
    const profileRole = document.getElementById("profileRole");

    if (profileName) {
        profileName.innerText = localStorage.getItem("loggedInUserName") || "-";
    }
    if (profileEmail) {
        profileEmail.innerText =
            localStorage.getItem("loggedInUserEmail") || "-";
    }
    if (profileRole) {
        profileRole.innerText =
            localStorage.getItem("loggedInUserRole") || "-";
    }
}


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



// ===============================
// OPEN EDIT PROFILE MODAL
// ===============================
function openEditProfileModal() {
    document.getElementById("editName").value = localStorage.getItem("loggedInUserName") || "";
    document.getElementById("editEmail").value = localStorage.getItem("loggedInUserEmail") || "";

    document.getElementById("editProfileModal").style.display = "block";
}

// ===============================
// CLOSE EDIT PROFILE MODAL
// ===============================
function closeEditProfileModal() {
    document.getElementById("editProfileModal").style.display = "none";
}


// ===============================
// OPEN PASSWORD MODAL
// ===============================
function openPasswordModal() {
    document.getElementById("passwordForm").reset();
    document.getElementById("passwordModal").style.display = "block";
}


// ===============================
// CLOSE PASSWORD MODAL
// ===============================
function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
    document.getElementById("passwordForm").reset();
}


// ===============================
// CLOSE MODALS ON OUTSIDE CLICK
// ===============================
window.onclick = function (event) {
    const editModal = document.getElementById("editProfileModal");
    const passwordModal = document.getElementById("passwordModal");

    if (event.target === editModal) {
        closeEditProfileModal();
    }
    if (event.target === passwordModal) {
        closePasswordModal();
    }
};


// ===============================
// UPDATE PROFILE
// ===============================
async function updateProfile(event) {
    event.preventDefault();

    const id = localStorage.getItem("loggedInUserId");
    const name = document.getElementById("editName").value.trim();
    const email = document.getElementById("editEmail").value.trim();

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

        document.querySelector(".user-info").innerHTML = `
            Welcome, <strong>${data.user.name}</strong>
            <a href="#" class="logout-btn" onclick="logout(event)">
                Logout
            </a>
        `;

        closeEditProfileModal();
        showToast("success", data.message);
    }
    catch (error) {
        console.log(error);
        showToast("error", "Server Error");
    }
}



// ===============================
// CHANGE PASSWORD
// ===============================
async function changePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword.length < 6) {
        showToast("warning", "Password must be at least 6 characters.");
        return;
    }

    if (newPassword !== confirmPassword) {
        showToast("warning", "New Password and Confirm Password do not match.");
        return;
    }

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
        console.log(error);
        showToast("error", "Server Error");
    }
}