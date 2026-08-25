/*=====================================
    GIFTBLOOM API CONNECTION
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbxyVajhdo-ZT_N5px_hqM2fFWNqpAu3yw6YRZDhK0_3jQ_eLdzKYhnvyfeQyxuGP_jS/exec";

/*=====================================
        STRICT LOGIN CHECK 
=====================================*/
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (localStorage.getItem("isLoggedIn") !== "true" || !currentUser || !currentUser.userId || currentUser.userId === "guest") {
    window.location.href = "login.html";
}

/*=====================================
        FLOATING HEARTS
=====================================*/
const hearts = document.querySelector(".hearts");
for(let i = 0; i < 20; i++){
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = (12 + Math.random() * 20) + "px";
    heart.style.animationDuration = (8 + Math.random() * 8) + "s";
    heart.style.animationDelay = (Math.random() * 5) + "s";
    if(hearts) hearts.appendChild(heart);
}

/*=====================================
      GLOBAL VARIABLES
=====================================*/
// Grab ID from URL OR fallback to localStorage
const urlParams = new URLSearchParams(window.location.search);
const currentCampaignId = urlParams.get('id') || localStorage.getItem("lastPublishedCampaignId");

let campaignLink = "";
let currentCampaignData = null;

// If no ID is found at all, boot them to the dashboard
if (!currentCampaignId) {
    window.location.href = "dashboard.html";
}

/*=====================================
      LOAD CAMPAIGN DETAILS
=====================================*/
function initSuccessPage() {
    // 1. Try to load INSTANTLY from the local cache saved by preview.js
    const allCampaigns = JSON.parse(localStorage.getItem("myCampaigns")) || [];
    currentCampaignData = allCampaigns.find(c => c.campaignId === currentCampaignId);

    if (currentCampaignData) {
        // Found locally! Render instantly without waiting for backend
        renderCampaignDetails();
    } else {
        // 2. Fallback to API if cache was cleared
        fetchCampaignFromAPI();
    }
}

async function fetchCampaignFromAPI() {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getCampaignById",
                data: { campaignId: currentCampaignId }
            })
        });

        const result = await response.json();

        if (result.status === "Success") {
            currentCampaignData = result.data;
            renderCampaignDetails();
        } else {
            console.error("Backend Error:", result.message);
            document.getElementById("giftName").innerText = "Campaign Published (Pending Sync)";
            document.getElementById("campaignId").innerText = currentCampaignId;
        }
    } catch (error) {
        console.error("Network Error:", error);
        document.getElementById("giftName").innerText = "Campaign Published";
        document.getElementById("campaignId").innerText = currentCampaignId;
    }
}

/*=====================================
      RENDER FETCHED DATA
=====================================*/
function renderCampaignDetails() {
    document.getElementById("giftName").innerText = currentCampaignData.gift || "Amazing Gift";
    document.getElementById("receiver").innerText = currentCampaignData.receiver || "Someone Special";
    document.getElementById("campaignId").innerText = currentCampaignId;

    // Load Image (Base64 from cache or Google Drive URL from backend)
    const imgElement = document.getElementById("giftImage");
    if (currentCampaignData.giftImageBase64) {
        imgElement.src = currentCampaignData.giftImageBase64; 
    } else if (currentCampaignData.giftImageUrl) {
        imgElement.src = currentCampaignData.giftImageUrl;
    } else {
        imgElement.src = "images/default-gift.png"; // Fallback image if you have one
    }

    // Construct the Public Share Link
    const baseURL = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    campaignLink = baseURL + "/campaigns.html?id=" + currentCampaignId;
    
    document.getElementById("campaignLink").value = campaignLink;
}

/*=====================================
      COPY BUTTON
=====================================*/
document.getElementById("copyBtn").onclick = () => {
    if (!campaignLink) return;
    
    navigator.clipboard.writeText(campaignLink);
    
    const btn = document.getElementById("copyBtn");
    btn.innerText = "✅ Copied";
    
    setTimeout(() => {
        btn.innerText = "📋 Copy";
    }, 2000);
};

/*=====================================
      SHARE CAMPAIGN
=====================================*/
document.getElementById("shareBtn").onclick = async () => {
    if (!campaignLink) return;

    // Provide default fallbacks if data is still loading
    const giftName = currentCampaignData ? currentCampaignData.gift : "a special gift";
    const receiverName = currentCampaignData ? currentCampaignData.receiver : "someone special";

    const title = giftName + " ❤️";
    const text = `Support my GiftBloom campaign for ${receiverName}! Let's make it happen ❤️`;
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: text,
                url: campaignLink
            });
        } catch(err) {
            console.log("User cancelled share or error:", err);
        }
    } else {
        navigator.clipboard.writeText(campaignLink);
        alert("Native sharing is not supported on this browser.\nCampaign link copied to clipboard instead!");
    }
};

/*=====================================
      NAVIGATION BUTTONS
=====================================*/
document.getElementById("viewBtn").onclick = () => {
    if (currentCampaignId) {
        window.location.href = "campaigns.html?id=" + currentCampaignId;
    }
};

document.getElementById("dashboardBtn").onclick = () => {
    // Note: Changed from "dashboard(combined).html" to standard "dashboard.html"
    window.location.href = "dashboard(combined).html";
};

document.getElementById("homeBtn").onclick = () => {
    window.location.href = "index.html";
};

// 🔥 KICK OFF THE LOGIC ON PAGE LOAD
initSuccessPage();
