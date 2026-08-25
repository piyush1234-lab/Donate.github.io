/*=====================================
      API & ROUTING CONFIGURATION
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbxyVajhdo-ZT_N5px_hqM2fFWNqpAu3yw6YRZDhK0_3jQ_eLdzKYhnvyfeQyxuGP_jS/exec";

// Get Campaign ID from URL query parameters (e.g. donate.html?id=GBC123456)
const urlParams = new URLSearchParams(window.location.search);
const campaignId = urlParams.get('id');

let activeCampaign = null;

/*=====================================
        FLOATING HEARTS
=====================================*/
const heartsContainer = document.querySelector(".hearts");
if (heartsContainer) {
    for (let i = 0; i < 18; i++) {
        let heart = document.createElement("div");
        heart.className = "heart";
        heart.innerHTML = "❤";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.fontSize = (12 + Math.random() * 18) + "px";
        heart.style.animationDuration = (8 + Math.random() * 8) + "s";
        heart.style.animationDelay = (Math.random() * 5) + "s";
        heartsContainer.appendChild(heart);
    }
}

/*=====================================
        BACK BUTTON
=====================================*/
document.querySelector(".back-btn").onclick = () => {
    if (campaignId) {
        window.location.href = `campaigns.html?id=${campaignId}`;
    } else {
        history.back();
    }
};

/*=====================================
        LOAD CAMPAIGN DETAILS
=====================================*/
async function loadDonateCampaign() {
    if (!campaignId) {
        alert("No campaign selected! Returning to home.");
        window.location.href = "index.html";
        return;
    }

    // 1. First check local storage cache for speed
    const allCampaigns = JSON.parse(localStorage.getItem("allCampaigns")) || JSON.parse(localStorage.getItem("myCampaigns")) || [];
    let found = allCampaigns.find(c => c.campaignId === campaignId || c.id === campaignId);

    if (found) {
        activeCampaign = found;
        renderCampaignDetails(found);
    }

    // 2. Fetch fresh data from Google Apps Script backend
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "getCampaignById",
                data: { campaignId: campaignId }
            })
        });

        const result = await response.json();
        if (result.status === "Success" && result.data) {
            activeCampaign = result.data;
            renderCampaignDetails(result.data);
        } else if (!found) {
            alert("Campaign not found.");
            window.location.href = "index.html";
        }
    } catch (err) {
        console.warn("Backend fetch offline or slow, using cached data if available.", err);
    }
}

function renderCampaignDetails(data) {
    document.getElementById("campaignName").textContent = data.giftName || data.gift || "Special Gift";
    document.getElementById("campaignReceiver").textContent = "For " + (data.receiverName || data.receiver || "Someone Special") + " ❤️";
    document.getElementById("campaignCreator").textContent = "By " + (data.creatorName || data.creator || "Anonymous");

    // Display Campaign Image
    if (data.image || data.giftImageUrl || data.giftImageBase64) {
        document.getElementById("campaignImage").src = data.image || data.giftImageUrl || data.giftImageBase64;
    }

    // Progress Bar
    const raised = Number(data.raisedAmount || data.raised) || 0;
    const goal = Number(data.targetAmount || data.target) || 1;
    const pct = Math.min(Math.round((raised / goal) * 100), 100);

        // Change these from "raisedAmountText" and "targetAmountText"
    document.getElementById("raisedText").textContent = `₹${raised} Raised`;
    document.getElementById("goalText").textContent = `₹${goal} Goal`;

    document.getElementById("progressFill").style.width = pct + "%";

    // Payment Info (UPI & QR)
    if (data.upiId) {
        document.getElementById("upiId").value = data.upiId;
    }
    if (data.qrImageUrl || data.qrImageBase64 || data.qrImage) {
        document.getElementById("qrImage").src = data.qrImageUrl || data.qrImageBase64 || data.qrImage;
    }

    // NEW: Show Message box ONLY if campaign allows it
    const msgSection = document.getElementById("messageSection");
    // Change "receiveMessages" below to whatever your column name is in Google Sheets
    if (data.receiveMessages === "Yes" || data.receiveMessages === "TRUE" || data.receiveMessages === true) {
        msgSection.style.display = "block";
    } else {
        msgSection.style.display = "none";
    }
}


// Initial Call
loadDonateCampaign();

/*=====================================
        DONATION AMOUNT BUTTONS
=====================================*/
let selectedAmount = 0;
const amountBtns = document.querySelectorAll(".amount-btn");

amountBtns.forEach(btn => {
    btn.onclick = () => {
        amountBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        selectedAmount = parseInt(btn.innerText.replace("₹", ""));
        document.getElementById("customAmount").value = "";
    };
});

document.getElementById("customAmount").addEventListener("input", (e) => {
    amountBtns.forEach(b => b.classList.remove("active"));
    selectedAmount = Number(e.target.value);
});

/*=====================================
        COPY UPI ID
=====================================*/
document.getElementById("copyUpi").onclick = () => {
    const upiInput = document.getElementById("upiId");
    navigator.clipboard.writeText(upiInput.value);

    const btn = document.getElementById("copyUpi");
    btn.innerHTML = "✅ Copied";
    setTimeout(() => {
        btn.innerHTML = "📋 Copy";
    }, 2000);
};

/*=====================================
        SUBMIT DONATION
=====================================*/
document.getElementById("submitDonation").onclick = async () => {
    const name = document.getElementById("donorName").value.trim();
    const email = document.getElementById("donorEmail").value.trim();
    const message = document.getElementById("donorMessage").value.trim();
    const anonymous = document.getElementById("anonymous").checked;
    const paid = document.getElementById("paymentDone").checked;

    if (selectedAmount <= 0) {
        alert("Please select or enter a valid donation amount.");
        return;
    }
    if (!name) {
        alert("Please enter your name.");
        return;
    }
    if (!email) {
        alert("Please enter your email.");
        return;
    }
    if (!paid) {
        alert("Please confirm that you have completed the payment.");
        return;
    }

    const submitBtn = document.getElementById("submitDonation");
    submitBtn.innerText = "⏳ Processing Donation...";
    submitBtn.disabled = true;

    const donationId = "GBD" + Date.now().toString().slice(-8);

    const donationPayload = {
        action: "recordDonation",
        data: {
            donationId: donationId,
            campaignId: campaignId,
            donorName: anonymous ? "Anonymous" : name,
            donorEmail: email,
            amount: selectedAmount,
            message: message,
            anonymous: anonymous,
            status: "Pending",
            timestamp: new Date().toISOString()
        }
    };

    // Save locally for instant offline availability
    const donations = JSON.parse(localStorage.getItem("donations")) || [];
    donations.push(donationPayload.data);
    localStorage.setItem("donations", JSON.stringify(donations));

    // Send donation details to Google Apps Script Backend
    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(donationPayload)
        });
    } catch (err) {
        console.warn("Could not sync donation immediately with server, saved locally.", err);
    }

    // Update UI State to Success
    document.querySelector(".payment-box").style.display = "none";
    submitBtn.style.display = "none";
    document.querySelector(".payment-check").style.display = "none";
    
    document.getElementById("successCard").classList.remove("hidden");
    document.getElementById("donationId").innerText = donationId;
};

/*=====================================
        NAVIGATION BUTTONS
=====================================*/
document.getElementById("backCampaign").onclick = () => {
    window.location.href = `campaigns.html?id=${campaignId}`;
};

document.getElementById("goDashboard").onclick = () => {
    window.location.href = "dashboard(combined).html";
};
