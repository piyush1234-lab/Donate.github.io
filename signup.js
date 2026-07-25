/*=====================================
      GIFTBLOOM API CONNECTION
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbz3j7pEIhMfam_dVATTNJe6rHAaMNUAz55ywLqEj4XDJ5qb6hygrvGQQfSj2x1KLtRM/exec";


/*=====================================
        MOBILE MENU
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if(menuBtn){
    menuBtn.addEventListener("click",(e)=>{
        e.stopPropagation();
        menu.classList.toggle("show");
    });
}

document.addEventListener("click",(e)=>{
    if(menu && !menu.contains(e.target) && menuBtn && !menuBtn.contains(e.target)){
        menu.classList.remove("show");
    }
});


/*=====================================
      FLOATING HEARTS
=====================================*/
const hearts=document.querySelector(".hearts");

for(let i=0;i<20;i++){
    let heart=document.createElement("div");
    heart.className="heart";
    heart.innerHTML="❤";
    heart.style.left=Math.random()*100+"vw";
    heart.style.fontSize=(12+Math.random()*18)+"px";
    heart.style.animationDuration=(8+Math.random()*8)+"s";
    heart.style.animationDelay=(Math.random()*5)+"s";
    hearts.appendChild(heart);
}


/*=====================================
      SHOW / HIDE PASSWORD
=====================================*/
document.querySelectorAll(".toggle").forEach(btn=>{
    btn.onclick=()=>{
        const input=document.getElementById(btn.dataset.target);
        if(input.type==="password"){
            input.type="text";
            btn.innerHTML="🙈";
        }else{
            input.type="password";
            btn.innerHTML="👁";
        }
    };
});


/*=====================================
      PASSWORD STRENGTH
=====================================*/
const password=document.getElementById("password");
const bar=document.getElementById("strengthBar");
const text=document.getElementById("strengthText");

password.addEventListener("input",()=>{
    let value=password.value;
    let score=0;

    if(value.length>=8) score++;
    if(/[A-Z]/.test(value)) score++;
    if(/[0-9]/.test(value)) score++;
    if(/[^A-Za-z0-9]/.test(value)) score++;

    switch(score){
        case 1:
            bar.style.width="25%";
            bar.style.background="#ff6b6b";
            text.innerHTML="Weak Password";
            break;
        case 2:
            bar.style.width="50%";
            bar.style.background="#ffb84d";
            text.innerHTML="Medium Password";
            break;
        case 3:
            bar.style.width="75%";
            bar.style.background="#66cc66";
            text.innerHTML="Strong Password";
            break;
        case 4:
            bar.style.width="100%";
            bar.style.background="#28c76f";
            text.innerHTML="Very Strong Password";
            break;
        default:
            bar.style.width="0";
            text.innerHTML="Password Strength";
    }
});


/*=====================================
      SIGNUP (NOW CONNECTED TO CLOUD)
=====================================*/
const form=document.getElementById("signupForm");

// Notice the 'async' added here so we can talk to the database!
form.addEventListener("submit", async (e)=>{
    e.preventDefault();

    const fullName=document.getElementById("fullName").value.trim();
    const email=document.getElementById("email").value.trim();
    const mobile = document.getElementById("mobile").value.trim();
    const dob = document.getElementById("dob").value;
    const gender = document.getElementById("gender").value;
    const confirmPassword=document.getElementById("confirmPassword").value;
    const agree=document.getElementById("agree").checked;

    /*============ Validation ============*/
    if(fullName===""){
        alert("Enter your name.");
        return;
    }

    const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(email)){
        alert("Enter a valid email.");
        return;
    }

    if(!/^\d{10}$/.test(mobile)){
        alert("Enter a valid 10 digit mobile number.");
        return;
    }

    if(password.value.length<8){
        alert("Password should be at least 8 characters.");
        return;
    }

    if(password.value!==confirmPassword){
        alert("Passwords do not match.");
        return;
    }

    if(!agree){
        alert("Please accept Terms & Conditions.");
        return;
    }

    /* --- DOB & Age Validation --- */
    if(dob === ""){
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

    if(age < 16){
        alert("You must be at least 16 years old to create an account on GiftBloom.");
        return; 
    }
if(gender === ""){
        alert("Please select your gender.");
        return;
    }
    /*=====================================
          GENERATE ID & DATA
    =====================================*/
    const uniqueId = "GBU" + Date.now().toString().slice(-6); 
    document.getElementById("uniqueOwnerId").value = uniqueId;

    const userData = {
        userId: uniqueId,
        name: fullName,
        email: email,
        mobile: mobile,
        dob: dob,
        gender: gender;
        password: password.value
    };

    /*=====================================
          SEND TO GOOGLE SHEETS API
    =====================================*/
    const submitBtn = form.querySelector("button[type='submit']");
    const originalBtnText = submitBtn.innerHTML;
    
    // Change button to show loading status
    submitBtn.innerHTML = "Creating Account... ⏳";
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.7";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "registerUser",
                data: userData
            })
        });

        const result = await response.json();

        if (result.status === "Success") {
            /*=====================================
                  LOGIN SESSION & REDIRECT
            =====================================*/
            // We save this locally so the user doesn't have to log in every time they open the app
            localStorage.setItem("currentUser", JSON.stringify(result.data));
            localStorage.setItem("isLoggedIn", "true");
            localStorage.setItem("isNewLogin", "true");

            alert("Account created successfully ❤️");
            window.location = "dashboard.html";
            
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


/*=====================================
      GOOGLE SIGNUP
=====================================*/
document.getElementById("googleSignup").onclick=()=>{
    alert("Google Sign-In will be connected using Google OAuth later.");
};


/*=====================================
      REAL-TIME PASSWORD MATCH
=====================================*/
const confirmPasswordInput = document.getElementById("confirmPassword");
const matchMsg = document.getElementById("passwordMatchMsg");

function checkPasswordMatch() {
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
