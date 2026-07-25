/*=====================================
      API ENDPOINT
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbz3j7pEIhMfam_dVATTNJe6rHAaMNUAz55ywLqEj4XDJ5qb6hygrvGQQfSj2x1KLtRM/exec";

/*=====================================
        AUTO LOGIN CHECK
=====================================*/
if(localStorage.getItem("isLoggedIn") === "true"){
    window.location.href = "dashboard(combined).html";
}

/*=====================================
        MOBILE MENU & HEARTS
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if(menuBtn){
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("show");
    });
}
document.addEventListener("click", (e) => {
    if(menu && !menu.contains(e.target) && menuBtn && !menuBtn.contains(e.target)){
        menu.classList.remove("show");
    }
});

const hearts = document.querySelector(".hearts");
if (hearts) {
    for(let i=0; i<20; i++){
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
        if(input.type === "password"){
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
if(localStorage.getItem("rememberLoginId")){
    const loginIdField = document.getElementById("loginId");
    const rememberCheck = document.getElementById("remember");
    if(loginIdField) loginIdField.value = localStorage.getItem("rememberLoginId");
    if(rememberCheck) rememberCheck.checked = true;
}

/*=====================================
      LOGIN TO GOOGLE SHEETS
=====================================*/
const form = document.getElementById("loginForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const loginId = document.getElementById("loginId").value.trim();
        const password = document.getElementById("password").value;
        const remember = document.getElementById("remember").checked;

        /*============ Validation ============*/
        if(loginId === ""){
            alert("Enter Email or User ID");
            return;
        }
        if(password === ""){
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
                body: JSON.stringify({
                    action: "loginUser",
                    data: {
                        loginId: loginId,
                        password: password
                    }
                })
            });

            const result = await response.json();

            if (result.status === "Success") {
                /*============ REMEMBER ME ============*/
                if(remember){
                    localStorage.setItem("rememberLoginId", loginId);
                } else {
                    localStorage.removeItem("rememberLoginId");
                }

                /*============ SESSION SAVING ============*/
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("currentUser", JSON.stringify(result.data));
                localStorage.setItem("isNewLogin", "false"); 

                alert("Welcome back ❤️");
                window.location.href = "dashboard(combined).html";
            } else {
                alert("❌ " + result.message);
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        } catch (error) {
            alert("❌ Network Error. Please check your connection.");
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

        if(email === ""){
            alert("Enter your email.");
            return;
        }

        sendResetBtn.innerHTML = "Sending... ⏳";
        sendResetBtn.disabled = true;
        resetMsg.innerHTML = "";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "resetPassword",
                    data: { email: email }
                })
            });

            const result = await response.json();

            if (result.status === "Success") {
                resetMsg.innerHTML = "✅ " + result.message;
                resetMsg.style.color = "#0b8a38";
            } else {
                resetMsg.innerHTML = "❌ " + result.message;
                resetMsg.style.color = "#d60000";
            }
        } catch (error) {
            resetMsg.innerHTML = "❌ Network Error. Please try again.";
            resetMsg.style.color = "#d60000";
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

if(openAdminModal) {
    openAdminModal.onclick = () => {
        adminModal.classList.add("show");
        adminStep1.style.display = "block";
        adminStep2.style.display = "none";
        adminLoginForm.reset();
    };
}

if(closeAdmin) {
    closeAdmin.onclick = () => {
        adminModal.classList.remove("show");
    };
}

if(verifyBtn) {
    verifyBtn.onclick = () => {
        const email = document.getElementById("adminEmail").value.trim();
        const pass = document.getElementById("adminPassword").value;

        if(email === "" || pass === "") {
            alert("Please enter both ID/Email and Password.");
            return;
        }

        // Dummy Validation (To be replaced later)
        if(email === "sagarwal2k20@gmail.com" && pass === "Piyush@1234") {
            adminStep1.style.display = "none";
            adminStep2.style.display = "block";
            document.getElementById("adminPin").required = true; 
        } else {
            alert("❌ Invalid Administrator Credentials!");
        }
    };
}

if(adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
        e.preventDefault(); 
        
        const pin = document.getElementById("adminPin").value;

        if(pin === "1234") {
            localStorage.setItem("adminLogin", "true");
            alert("✅ Welcome back, Administrator.");
            window.location.href = "admin.html"; 
        } else {
            alert("❌ Incorrect Secret PIN!");
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
