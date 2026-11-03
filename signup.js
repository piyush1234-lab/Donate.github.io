/*=====================================
      GIFTBLOOM API CONNECTION
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbyspj1ezHNVn6e0AFTDqhPNHJAnclSB9sbVCLeVOfRIla_RpWuBVJr7jViB1zm-RyD-/exec";

// Check both localStorage (Remember Me) and sessionStorage (standard login)
const currentUserStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";

if (isLoggedIn && currentUser && (currentUser.userId || currentUser.id)) {
    window.location.href = "dashboard(combined).html"; // Skip signup screen if already logged in
}

/*=====================================
        MOBILE MENU
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

/*=====================================
      FLOATING HEARTS
=====================================*/
const hearts = document.querySelector(".hearts");
if (hearts) {
    for (let i = 0; i < 20; i++) {
        let heart = document.createElement("div");
        heart.className = "heart";
        heart.innerHTML = "❤";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.fontSize = (12 + Math.random() * 18) + "px";
        heart.style.animationDuration = (8 + Math.random() * 8) + "s";
        heart.style.animationDelay = (Math.random() * 5) + "s";
        hearts.appendChild(heart);
    }
}

/*=====================================
      SHOW / HIDE PASSWORD
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
      PASSWORD STRENGTH
=====================================*/
const password = document.getElementById("password");
const bar = document.getElementById("strengthBar");
const text = document.getElementById("strengthText");

if (password && bar && text) {
    password.addEventListener("input", () => {
        let value = password.value;
        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        switch (score) {
            case 1:
                bar.style.width = "25%";
                bar.style.background = "#ff6b6b";
                text.innerHTML = "Weak Password";
                break;
            case 2:
                bar.style.width = "50%";
                bar.style.background = "#ffb84d";
                text.innerHTML = "Medium Password";
                break;
            case 3:
                bar.style.width = "75%";
                bar.style.background = "#66cc66";
                text.innerHTML = "Strong Password";
                break;
            case 4:
                bar.style.width = "100%";
                bar.style.background = "#28c76f";
                text.innerHTML = "Very Strong Password";
                break;
            default:
                bar.style.width = "0";
                text.innerHTML = "Password Strength";
        }
    });
}

/*=====================================
      SIGNUP 
=====================================*/
let pendingSignupEmail = "";
let resendCooldownInterval;
const form = document.getElementById("signupForm");

if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim().toLowerCase();
        const mobile = document.getElementById("mobile").value.trim();
        const dob = document.getElementById("dob").value;
        const gender = document.getElementById("gender").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const agree = document.getElementById("agree").checked;

        if (fullName === "") {
            alert("Enter your name.");
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            alert("Enter a valid email.");
            return;
        }

        if (!/^\d{10}$/.test(mobile)) {
            alert("Enter a valid 10 digit mobile number.");
            return;
        }

        if (password.value.length < 8) {
            alert("Password should be at least 8 characters.");
            return;
        }

        if (password.value !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        if (!agree) {
            alert("Please accept Terms & Conditions.");
            return;
        }

        if (dob === "") {
            alert("Please enter your Date of Birth.");
            return;
        }

        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();

        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 16) {
            alert("You must be at least 16 years old to create an account on GiftBloom.");
            return; 
        }

        if (gender === "") {
            alert("Please select your gender.");
            return;
        }

        const uniqueId = "GBU" + Date.now().toString().slice(-6); 
        const uniqueOwnerEl = document.getElementById("uniqueOwnerId");
        if (uniqueOwnerEl) uniqueOwnerEl.value = uniqueId;

        const userData = {
            userId: uniqueId,
            name: fullName,
            email: email,
            mobile: mobile,
            dob: dob,
            gender: gender,
            password: password.value,
            state: userDetectedState,
            emailVerified: true
        };

        const submitBtn = form.querySelector("button[type='submit']");
        const originalBtnText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = "Creating Account... ⏳";
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "registerUser",
                    data: userData
                })
            });

            const result = await response.json();

            if (result.status === "Success") {
                pendingSignupEmail = email;
                const otpEmailEl = document.getElementById("otpEmailDisplay");
                if (otpEmailEl) otpEmailEl.innerText = email;
                document.getElementById("signupFormSection").style.display = "none";
                document.getElementById("otpSection").style.display = "block";
                const otpInputEl = document.getElementById("otpInput");
                if (otpInputEl) otpInputEl.focus();
                startResendCooldown();
            } else {
                alert("❌ " + result.message);
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
            }
            
        } catch (error) {
            alert("❌ Network Error. Please check your internet connection.");
            console.error("API Error:", error);
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
        }
    });
}

function startResendCooldown() {
    let seconds = 30;
    const resendBtn = document.getElementById("resendOtpBtn");
    const timerEl = document.getElementById("resendTimer");
    if (!resendBtn || !timerEl) return;

    resendBtn.style.pointerEvents = "none";
    resendBtn.style.opacity = "0.5";
    timerEl.innerText = ` (${seconds}s)`;
    clearInterval(resendCooldownInterval);
    resendCooldownInterval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(resendCooldownInterval);
            resendBtn.style.pointerEvents = "auto";
            resendBtn.style.opacity = "1";
            timerEl.innerText = "";
        } else {
            timerEl.innerText = ` (${seconds}s)`;
        }
    }, 1000);
}

const otpInputEl = document.getElementById("otpInput");
if (otpInputEl) {
    otpInputEl.addEventListener("input", () => {
        otpInputEl.value = otpInputEl.value.replace(/\D/g, "").slice(0, 6);
    });
    otpInputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            document.getElementById("verifyOtpBtn")?.click();
        }
    });
}

const verifyOtpBtn = document.getElementById("verifyOtpBtn");
if (verifyOtpBtn) {
    verifyOtpBtn.onclick = async () => {
        const otp = document.getElementById("otpInput").value.trim();
        if (otp.length !== 6) {
            alert("Please enter the 6-digit code.");
            return;
        }

        verifyOtpBtn.innerHTML = "Verifying... ⏳";
        verifyOtpBtn.disabled = true;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "verifySignupOtp",
                    data: { email: pendingSignupEmail, otp: otp, emailVerified: true }
                })
            });
            const result = await response.json();
            if (result.status === "Success") {
                alert("✅ Email verified! Your account has been created. Please login.");
                localStorage.setItem("justSignedUp", "true");
                localStorage.setItem("isNewLogin", "true");
                window.location.href = "login.html";
            } else {
                alert("❌ " + result.message);
                verifyOtpBtn.innerHTML = "Verify & Create Account";
                verifyOtpBtn.disabled = false;
            }
        } catch (error) {
            alert("❌ Network Error. Please try again.");
            verifyOtpBtn.innerHTML = "Verify & Create Account";
            verifyOtpBtn.disabled = false;
        }
    };
}

const resendOtpBtn = document.getElementById("resendOtpBtn");
if (resendOtpBtn) {
    resendOtpBtn.onclick = async () => {
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "resendSignupOtp",
                    data: { email: pendingSignupEmail }
                })
            });
            const result = await response.json();
            if (result.status === "Success") {
                alert("✅ A new code has been sent.");
                startResendCooldown();
            } else {
                alert("❌ " + result.message);
            }
        } catch (error) {
            alert("❌ Network Error. Please try again.");
        }
    };
}

/*=====================================
      GOOGLE SIGNUP
=====================================*/
const googleSignupBtn = document.getElementById("googleSignup");
if (googleSignupBtn) {
    googleSignupBtn.onclick = () => {
        alert("Google Sign-In will be connected using Google OAuth later.");
    };
}

/*=====================================
      REAL-TIME PASSWORD MATCH
=====================================*/
const confirmPasswordInput = document.getElementById("confirmPassword");
const matchMsg = document.getElementById("passwordMatchMsg");

function checkPasswordMatch() {
    if (!confirmPasswordInput || !matchMsg) return;
    if (confirmPasswordInput.value === "") {
        matchMsg.style.display = "none";
        return;
    }
    
    matchMsg.style.display = "block";
    
    if (password.value === confirmPasswordInput.value) {
        matchMsg.innerHTML = "✅ Passwords match";
        matchMsg.style.color = "#0b8a38"; 
    } else {
        matchMsg.innerHTML = "❌ Passwords do not match";
        matchMsg.style.color = "#d60000"; 
    }
}

if (password && confirmPasswordInput) {
    password.addEventListener("input", checkPasswordMatch);
    confirmPasswordInput.addEventListener("input", checkPasswordMatch);
}

/*=====================================
      SILENT LOCATION CAPTURE
=====================================*/
let userDetectedState = "";

async function silentlyFetchLocation() {
    try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (res.ok) {
            const geo = await res.json();
            if (geo.region) {
                userDetectedState = geo.region;
                console.log("State detected silently:", userDetectedState);
                return;
            }
        }
    } catch (e) {
        console.log("GeoJS fetch failed. Moving to fallback...");
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const { latitude, longitude } = pos.coords;
                const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                const geo = await res.json();
                if (geo.principalSubdivision) {
                    userDetectedState = geo.principalSubdivision;
                    console.log("State detected via fallback:", userDetectedState);
                }
            } catch (err) {
                console.log("Reverse geocode failed.");
            }
        }, (err) => {
            console.log("Location fallback denied/unavailable.");
        }, { timeout: 8000 });
    }
}

silentlyFetchLocation();
