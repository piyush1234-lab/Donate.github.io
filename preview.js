/*=====================================
        API & USER KEYS (THE FIX)
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbz3j7pEIhMfam_dVATTNJe6rHAaMNUAz55ywLqEj4XDJ5qb6hygrvGQQfSj2x1KLtRM/exec";

const currentUser = JSON.parse(localStorage.getItem("currentUser")) || { name: "", email: "", userId: "guest" };
const DRAFT_KEY = "draftData_" + (currentUser.userId || "guest");
const EXPENSES_KEY = "campaignExpenses_" + (currentUser.userId || "guest");
const DRAFT_TIME_KEY = "draftTime_" + (currentUser.userId || "guest");
const EXPENSE_TIME_KEY = "expenseTime_" + (currentUser.userId || "guest");

/*=====================================
        MOBILE MENU
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

menuBtn.addEventListener("click",(e)=>{
    e.stopPropagation();
    menu.classList.toggle("show");
});

document.querySelectorAll("#menu a").forEach(link=>{
    link.addEventListener("click",()=>{
        menu.classList.remove("show");
    });
});

document.addEventListener("click",(e)=>{
    if(!menu.contains(e.target) && !menuBtn.contains(e.target)){
        menu.classList.remove("show");
    }
});

/*=====================================
      FLOATING HEARTS
=====================================*/
const hearts=document.querySelector(".hearts");
for(let i=0;i<18;i++){
    let heart=document.createElement("div");
    heart.className="heart";
    heart.innerHTML="❤";
    heart.style.left=Math.random()*100+"vw";
    heart.style.fontSize=(12+Math.random()*18)+"px";
    heart.style.animationDuration=(8+Math.random()*8)+"s";
    heart.style.animationDelay=(Math.random()*5)+"s";
    if (hearts) hearts.appendChild(heart);
}

/*=====================================
      LOAD CAMPAIGN & IMAGES
=====================================*/
// 🌟 FIX: Pulling from the correct User-Specific Draft Key
const campaign = JSON.parse(localStorage.getItem(DRAFT_KEY));

if(!campaign){
    window.location.href = "create.html";
} else {
    document.getElementById("giftName").innerText = campaign.gift || "Unknown Gift";
    document.getElementById("receiver").innerText = campaign.receiver || "Unknown";
    document.getElementById("creator").innerText = campaign.creator || "Unknown";
    document.getElementById("occasion").innerText = campaign.occasion || "Not specified";
    document.getElementById("category").innerText = campaign.category || "Not specified";
    document.getElementById("target").innerText = campaign.target || "0";
    document.getElementById("targetAmount").innerText = campaign.target || "0";
    document.getElementById("date").innerText = campaign.targetDate || "--";
    document.getElementById("story").innerText = campaign.story || "No story provided.";
}

// 🌟 FIX: Loading images directly from the draft object
const giftPreview = document.getElementById("giftPreview");
if(campaign && campaign.giftImageBase64){
    giftPreview.src = campaign.giftImageBase64;
} else {
    giftPreview.style.display = "none";
}

const qrPreview = document.getElementById("qrPreview");
const qrDeletedText = document.getElementById("qrDeletedText");
const upiIdPreview = document.getElementById("upiIdPreview");

if(campaign && campaign.qrImageBase64){
    qrPreview.src = campaign.qrImageBase64;
} else {
    qrPreview.style.display = "none";
    if (campaign && campaign.upiId) qrDeletedText.style.display = "block";
}

upiIdPreview.value = (campaign && campaign.upiId) ? campaign.upiId : "No UPI ID found";

/*=====================================
      QR & UPI VERIFICATION LOGIC
=====================================*/
const upiCorrectRadios = document.getElementsByName("upiCorrect");
const manualUpdateBox = document.getElementById("manualUpdateBox");
const manualUpdateRadios = document.getElementsByName("manualUpdate");
const newUpiBox = document.getElementById("newUpiBox");
const newUpiInput = document.getElementById("newUpiInput");
const upiTick = document.getElementById("upiTick");
const updateUpiBtn = document.getElementById("updateUpiBtn");

upiCorrectRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "no") {
            manualUpdateBox.style.display = "block";
            manualUpdateRadios.forEach(r => r.checked = false);
            newUpiBox.style.display = "none";
            newUpiInput.value = "";
            upiTick.style.display = "none";
            updateUpiBtn.style.display = "none";
        } else {
            manualUpdateBox.style.display = "none";
        }
    });
});

manualUpdateRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "no") {
            alert("You are requested to recreate the campaign");
            window.location.href = "create.html";
        } else if (e.target.value === "yes") {
            newUpiBox.style.display = "block";
        }
    });
});

// SCAN UPLOADED FILE & STRICTLY MATCH TYPED ID
let newlyScannedUpi = "";
let newQrBase64 = "";
const newQrUpload = document.getElementById("newQrUpload");
const qrScanStatus = document.getElementById("qrScanStatus");
const upiMatchError = document.getElementById("upiMatchError");

if(newQrUpload) {
    newQrUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        qrScanStatus.style.display = "block";
        qrScanStatus.innerText = "Scanning QR... ⏳";
        qrScanStatus.style.color = "#ffb300";

        const reader = new FileReader();
        reader.onload = function(event) {
            newQrBase64 = event.target.result; 
            
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d", { willReadFrequently: true });
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0, img.width, img.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code && code.data.toLowerCase().includes("upi://pay")) {
                    let upiId = "Unknown UPI ID";
                    try {
                        const params = new URLSearchParams(code.data.substring(code.data.indexOf('?')));
                        if(params.has('pa')) upiId = params.get('pa');
                    } catch(err) {}
                    
                    newlyScannedUpi = upiId;
                    qrScanStatus.innerText = "✅ QR Scanned Successfully!";
                    qrScanStatus.style.color = "#2e7d32";
                    checkMatch(); 
                } else {
                    newlyScannedUpi = "";
                    qrScanStatus.innerText = "❌ Could not detect valid UPI QR.";
                    qrScanStatus.style.color = "#ff4d4d";
                    checkMatch();
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function checkMatch() {
    const val = newUpiInput.value.trim();
    if (val === "" || newlyScannedUpi === "") {
        upiTick.style.display = "none";
        updateUpiBtn.style.display = "none";
        if(upiMatchError) upiMatchError.style.display = "none";
        return;
    }
    if (val === newlyScannedUpi) {
        upiTick.style.display = "inline";
        updateUpiBtn.style.display = "block";
        if(upiMatchError) upiMatchError.style.display = "none";
    } else {
        upiTick.style.display = "none";
        updateUpiBtn.style.display = "none";
        if(upiMatchError) upiMatchError.style.display = "block";
    }
}

if(newUpiInput) newUpiInput.addEventListener("input", checkMatch);

if(updateUpiBtn) {
    updateUpiBtn.addEventListener("click", () => {
        alert("The QR image and UPI ID have been successfully updated.");
        const newUpi = newUpiInput.value.trim();
        
        campaign.upiId = newUpi;
        if (newQrBase64) campaign.qrImageBase64 = newQrBase64;
        
        localStorage.setItem(DRAFT_KEY, JSON.stringify(campaign));
        
        if (newQrBase64) {
            qrPreview.src = newQrBase64;
            qrPreview.style.display = "block";
            if(qrDeletedText) qrDeletedText.style.display = "none";
        }
        
        upiIdPreview.value = newUpi;
        document.querySelector('input[name="upiCorrect"][value="yes"]').checked = true;
        manualUpdateBox.style.display = "none";
    });
}

/*=====================================
      LOAD EXPENSES
=====================================*/
// 🌟 FIX: Pulling expenses from the correct User-Specific Key
const expenses = JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [];
const table = document.getElementById("expenseTable");
let total = 0;

expenses.forEach(exp=>{
    const row=document.createElement("div");
    row.className="expense-item";
    row.innerHTML=`<span>${exp.item}</span><strong>₹${exp.amount}</strong>`;
    table.appendChild(row);
    total+=Number(exp.amount);
});

document.getElementById("expenseTotal").innerText = total;

const target = Number(campaign.target||0);
document.getElementById("remaining").innerText = (target - total);

/*=====================================
      PROGRESS
=====================================*/
let percent = target > 0 ? (total/target)*100 : 0;
document.getElementById("progressFill").style.width = Math.min(percent, 100) + "%";

/*=====================================
      BACK & EDIT BUTTONS
=====================================*/
document.querySelector(".back-btn").onclick = () => { history.back(); };
document.getElementById("editBtn").onclick = () => { window.location="create.html"; };

/*=====================================
      PUBLISH (TO GOOGLE SHEETS)
=====================================*/
document.getElementById("publishBtn").addEventListener("click", async () => {

    const agree1 = document.getElementById("agree1");
    const agree2 = document.getElementById("agree2");

    if(!agree1.checked || !agree2.checked){
        alert("Please accept both agreements.");
        return;
    }

    if(campaign) {
        const publishBtn = document.getElementById("publishBtn");
        publishBtn.innerHTML = "Publishing... 🚀";
        publishBtn.disabled = true;

        if (!campaign.campaignId) {
            campaign.campaignId = "GBC-" + Date.now().toString().slice(-6);
        }
        
        // Bundle everything for Google Sheets
        const fullData = {
            ...campaign,
            expenses: JSON.stringify(expenses) 
        };

        try {
            // 1. SEND TO GOOGLE SHEETS
            const response = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({ action: "createCampaign", data: fullData })
            });
            
            const result = await response.json();

            if (result.status === "Success") {
                
                // 2. SAVE LOCALLY FOR DASHBOARD
                let allCampaigns = JSON.parse(localStorage.getItem("myCampaigns")) || [];
                const editingIndex = localStorage.getItem("editingIndex");
                let targetIndex;

                if (editingIndex !== null) {
                    targetIndex = parseInt(editingIndex);
                    allCampaigns[targetIndex] = fullData; // ✅ Saving fullData
                } else {
                    allCampaigns.push(fullData); // ✅ Saving fullData
                    targetIndex = allCampaigns.length - 1;
                }

                localStorage.setItem("myCampaigns", JSON.stringify(allCampaigns));
                localStorage.setItem("lastPublishedIndex", targetIndex);
                
                // 3. CLEAN UP ALL USER DRAFTS
                localStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(EXPENSES_KEY);
                localStorage.removeItem(DRAFT_TIME_KEY);
                localStorage.removeItem(EXPENSE_TIME_KEY);
                localStorage.removeItem("editingIndex");

                alert("Campaign Published Successfully ❤️");
                window.location="success.html";
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            alert("❌ Error publishing to database: " + error.message);
            publishBtn.innerHTML = "🚀 Publish Campaign";
            publishBtn.disabled = false;
        }
    }
});
