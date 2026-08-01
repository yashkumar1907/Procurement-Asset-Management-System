// ===============================
// COPYRIGHT SECTION YEAR (CHANGES AUTOMATICALLY)
// ===============================
document.getElementById("currentYear").textContent = new Date().getFullYear();


// ===============================
// LOGIN FUNCTION
// ===============================
async function login(event) {
    // Stops page reload
    event.preventDefault();

    // Getting email and password enter by user
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        // SEND LOGIN REQUEST
        const response = await fetch(
            `${API_BASE_URL}/api/auth/login`,
            {
                method: "POST",
                headers: {
                    // Telling backend that I am sending data in json formar
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );
        
        // Wait for backend response
        const data = await response.json();

        // LOGIN SUCCESS
        if (response.ok) {
            // STORE USER DATA IN BROWSER
            localStorage.setItem("loggedInUserId", data.user.id);
            localStorage.setItem("loggedInUserName",data.user.name);
            localStorage.setItem("loggedInUserEmail",data.user.email);
            localStorage.setItem("loggedInUserRole",data.user.role);
            localStorage.setItem("networkPermission",data.user.networkPermission);
            localStorage.setItem("amcPermission",data.user.amcPermission);
            localStorage.setItem("contractPermission",data.user.contractPermission);
            localStorage.setItem("inventoryNetworkPermission",data.user.inventoryNetworkPermission);
            localStorage.setItem("inventoryHardwarePermission",data.user.inventoryHardwarePermission);
            localStorage.setItem("inventoryDepartmentPermission",data.user.inventoryDepartmentPermission);
            localStorage.setItem("plantMaterialPermission", data.user.plantMaterialPermission);
            localStorage.setItem("plantServicePermission", data.user.plantServicePermission);
            localStorage.setItem("wbsProjectPermission", data.user.wbsProjectPermission);
            localStorage.removeItem("selectedCategory");

            // Redirect to dashboard based on role
            if (data.user.role ===  "admin") {
                window.location.href = "admin.html";
            } else {
                window.location.href = "profile.html";
            }
        }
        // LOGIN FAILED
        else {
            // This div is present in html and shown only when login failed
            document.getElementById("error-message").innerText = data.message;
            document.getElementById("error-message").style.display = "flex";
        }
    }
    catch (error) {
        console.log(error);
        document.getElementById("error-message").innerText = "Server Error";
        document.getElementById("error-message").style.display = "flex";
    }
}


// ===============================
// FORM SUBMIT EVENT
// ===============================
document.getElementById("loginForm").addEventListener("submit",login);


// ===============================
// TOGGLE PASSWORD
// ===============================
function togglePassword() {
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.querySelector(".show-password");

    // SHOW PASSWORD
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtn.innerText = "Hide";
    }
    
    // HIDE PASSWORD
    else {
        passwordInput.type = "password";
        toggleBtn.innerText = "Show";
    }
}