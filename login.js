/*=====================================
      API ENDPOINT
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbyspj1ezHNVn6e0AFTDqhPNHJAnclSB9sbVCLeVOfRIla_RpWuBVJr7jViB1zm-RyD-/exec";

// Check both localStorage (Remember Me) and sessionStorage (standard login)
const currentUserStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

const isLoggedIn = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";

if (isLoggedIn && currentUser && (currentUser.userId || currentUser.id) && (currentUser.role || "User") === "User") {
    window.location.href = "dashboard(combined).html"; // Skip login screen
}


/*=====================================
        MOBILE MENU & HEARTS
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (menuBtn && menu) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });
}
document.addEventListener("click", (e) => {
    if (menu && !menu.contains(e.target) && menuBtn && !menuBtn.contains(e.target)) {
        menu.classList.remove("show");
    }
});

const hearts = document.querySelector(".hearts");
if (hearts) {
    for (let i = 0; i < 20; i++) {
        let heart = document.createElement("div");
        heart.className = "heart";
        heart.innerHTML = "❤";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.fontSize = 12 + Math.random() * 18 + "px";
        heart.style.animationDuration = 8 + Math.random() * 8 + "s";
        heart.style.animationDelay = Math.random() * 5 + "s";
        hearts.appendChild(heart);
    }
}

/*=====================================
      SHOW PASSWORD
=====================================*/
document.querySelectorAll(".toggle").forEach(btn => {
    btn.onclick = () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        if (input.type === "password") {
            input.type = "text";
            btn.innerHTML = "🙈";
        } else {
            input.type = "password";
            btn.innerHTML = "👁";
        }
    };
});

/*=====================================
      REMEMBER ME (ON LOAD)
=====================================*/
if (localStorage.getItem("rememberLoginId")) {
    const loginIdField = document.getElementById("loginId");
    const rememberCheck = document.getElementById("remember");
    if (loginIdField) loginIdField.value = localStorage.getItem("rememberLoginId");
    if (rememberCheck) rememberCheck.checked = true;
}

/*=====================================
      NORMAL USER LOGIN (EMAIL OR ID)
=====================================*/
const form = document.getElementById("loginForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const loginId = document.getElementById("loginId").value.trim();
        const password = document.getElementById("password").value;
        const remember = document.getElementById("remember").checked;

        /*============ Validation ============*/
        if (loginId === "") {
            alert("Enter Email or User ID");
            return;
        }
        if (password === "") {
            alert("Enter Password");
            return;
        }

        const submitBtn = form.querySelector("button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = "Verifying... ⏳";
        submitBtn.disabled = true;

        try {
            /*============ API CALL ============*/
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "loginUser",
                    data: {
                        loginId: loginId,
                        email: loginId,
                        password: password,
                        remember: remember
                    }
                })        
            });

            const result = await response.json();

            if (result.status === "Success") {
                // Background Role Check: Ensure account role is strictly "User"
                const userRole = String(result.data?.role || "").trim();
                if (userRole !== "User") {
                    alert("❌ Access Denied: This account is not a standard User account. Please use the Administrator login.");
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                    return;
                }

                const isFirstLogin = result.data?.isNewUser === true;
                const primaryStorage = remember ? localStorage : sessionStorage;
                const secondaryStorage = remember ? sessionStorage : localStorage;

                // Clear opposite storage so stale sessions never conflict
                secondaryStorage.removeItem("isLoggedIn");
                secondaryStorage.removeItem("currentUser");
                secondaryStorage.removeItem("isNewLogin");

                primaryStorage.setItem("isLoggedIn", "true");
                primaryStorage.setItem("currentUser", JSON.stringify(result.data));
                primaryStorage.setItem("isNewLogin", isFirstLogin ? "true" : "false");
                localStorage.setItem("isNewLogin", isFirstLogin ? "true" : "false");

                if (remember) {
                    localStorage.setItem("rememberLoginId", loginId);
                } else {
                    localStorage.removeItem("rememberLoginId");
                }

                // Show "Welcome ❤️" on first login, "Welcome back ❤️" afterwards
                alert(isFirstLogin ? "Welcome ❤️" : "Welcome back ❤️");
                window.location.href = "dashboard(combined).html";
            } else {
                alert("❌ " + result.message);
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            alert("❌ Network error. Please try again.");
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

/*=====================================
      GOOGLE LOGIN PLACEHOLDER
=====================================*/
const googleLoginBtn = document.getElementById("googleLogin");
if (googleLoginBtn) {
    googleLoginBtn.addEventListener("click", () => {
        alert("Google Login will be connected with Google OAuth later.");
    });
}

/*=====================================
      FORGOT PASSWORD (REAL API)
=====================================*/
const forgotBtn = document.getElementById("forgotBtn");
const forgotModal = document.getElementById("forgotModal");
const closeForgot = document.getElementById("closeForgot");

if (forgotBtn && forgotModal) {
    forgotBtn.onclick = (e) => {
        e.preventDefault();
        forgotModal.classList.add("show");
    };
}

if (closeForgot && forgotModal) {
    closeForgot.onclick = () => {
        forgotModal.classList.remove("show");
    };
}

const sendResetBtn = document.getElementById("sendReset");
if (sendResetBtn) {
    sendResetBtn.onclick = async () => {
        const email = document.getElementById("resetEmail").value.trim();
        const resetMsg = document.getElementById("resetMessage");

        if (email === "") {
            alert("Enter your email.");
            return;
        }

        sendResetBtn.innerHTML = "Sending... ⏳";
        sendResetBtn.disabled = true;
        if (resetMsg) resetMsg.innerHTML = "";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "resetPassword",
                    data: { email: email }
                })
            });

            const result = await response.json();

            if (result.status === "Success") {
                if (resetMsg) {
                    resetMsg.innerHTML = "✅ " + result.message;
                    resetMsg.style.color = "#0b8a38";
                }
            } else {
                if (resetMsg) {
                    resetMsg.innerHTML = "❌ " + result.message;
                    resetMsg.style.color = "#d60000";
                }
            }
        } catch (error) {
            if (resetMsg) {
                resetMsg.innerHTML = "❌ Network Error. Please try again.";
                resetMsg.style.color = "#d60000";
            }
        }

        sendResetBtn.innerHTML = "Send Reset Link";
        sendResetBtn.disabled = false;
    };
}

/*=====================================
      ADMIN LOGIN LOGIC (TWO-STEP)
=====================================*/
const adminModal = document.getElementById("adminModal");
const openAdminModal = document.getElementById("openAdminModal");
const closeAdmin = document.getElementById("closeAdmin");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminStep1 = document.getElementById("adminStep1");
const adminStep2 = document.getElementById("adminStep2");
const verifyBtn = document.getElementById("verifyCredentialsBtn");

if (openAdminModal && adminModal) {
    openAdminModal.onclick = () => {
        adminModal.classList.add("show");
        if (adminStep1) adminStep1.style.display = "block";
        if (adminStep2) adminStep2.style.display = "none";
        const pinInput = document.getElementById("adminPin");
        if (pinInput) pinInput.required = false;
        if (adminLoginForm) adminLoginForm.reset();
    };
}

if (closeAdmin && adminModal) {
    closeAdmin.onclick = () => {
        adminModal.classList.remove("show");
    };
}

if (verifyBtn) {
    verifyBtn.onclick = async () => {
        const loginId = document.getElementById("adminEmail").value.trim();
        const pass = document.getElementById("adminPassword").value;
        if (loginId === "" || pass === "") {
            return alert("Please enter both Admin ID/Email and Password.");
        }

        verifyBtn.innerHTML = "Verifying... ⏳"; 
        verifyBtn.disabled = true;
        
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "verifyAdminStep1",
                    data: { loginId: loginId, email: loginId, password: pass }
                })
            });
            const result = await response.json();
            if (result.status === "Success") {
                const adminRole = String(result.data?.role || "").trim();
                if (adminRole !== "Admin" && adminRole !== "Owner") {
                    alert("❌ Access Denied: Only Admin or Owner accounts can log in here.");
                    return;
                }

                if (adminStep1) adminStep1.style.display = "none";
                if (adminStep2) adminStep2.style.display = "block";
                const pinInput = document.getElementById("adminPin");
                if (pinInput) {
                    pinInput.required = true;
                    pinInput.focus();
                }
            } else {
                alert("❌ " + result.message);
            }
        } catch (error) {
            alert("❌ Network error. Please try again.");
        } finally {
            verifyBtn.innerHTML = "Verify Credentials"; 
            verifyBtn.disabled = false;
        }
    };
}

if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        // If the user pressed Enter while still on Step 1, run Step 1 verification instead
        if (adminStep2 && adminStep2.style.display === "none") {
            if (verifyBtn) verifyBtn.click();
            return;
        }

        const loginId = document.getElementById("adminEmail").value.trim();
        const pass = document.getElementById("adminPassword").value;
        const pin = document.getElementById("adminPin").value.trim();
        const submitBtn = document.getElementById("finalAdminLoginBtn");
        
        if (!pin) {
            alert("Please enter the secret PIN.");
            return;
        }

        submitBtn.innerHTML = "Verifying... ⏳"; 
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "loginAdmin",
                    data: { loginId: loginId, email: loginId, password: pass, pin: pin, remember: true }
                })
            });
            const result = await response.json();
            if (result.status === "Success") {
                const adminRole = String(result.data?.role || "").trim();
                if (adminRole !== "Admin" && adminRole !== "Owner") {
                    alert("❌ Access Denied: Only Admin or Owner accounts can log in here.");
                    submitBtn.innerHTML = "🛡️ Login as Admin";
                    submitBtn.disabled = false;
                    return;
                }

                localStorage.setItem("adminLogin", "true");
                localStorage.setItem("adminToken", result.data.token);
                localStorage.setItem("adminRole", adminRole);
                localStorage.setItem("adminProfile", JSON.stringify({
                    userId: result.data.userId || "",
                    name: result.data.name || "GiftBloom Administrator",
                    email: result.data.email || loginId,
                    role: adminRole
                }));

                alert("✅ Welcome back, " + adminRole + ".");
                window.location.href = "admin.html";
            } else {
                alert("❌ " + result.message);
                submitBtn.innerHTML = "🛡️ Login as Admin"; 
                submitBtn.disabled = false;
            }
        } catch (error) {
            alert("❌ Network error. Please try again.");
            submitBtn.innerHTML = "🛡️ Login as Admin"; 
            submitBtn.disabled = false;
        }
    });
}

/*=====================================
      MODAL OUTSIDE CLICK FIX
=====================================*/
window.onclick = (e) => {
    if (forgotModal && e.target === forgotModal) {
        forgotModal.classList.remove("show");
    }
    if (adminModal && e.target === adminModal) {
        adminModal.classList.remove("show");
    }
};
