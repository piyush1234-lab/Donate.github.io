/*=====================================
        FLOATING HEARTS
=====================================*/
const hearts = document.querySelector(".hearts");

for(let i=0; i<20; i++){
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
      LOAD LATEST PUBLISHED CAMPAIGN
=====================================*/
const allCampaigns = JSON.parse(localStorage.getItem("myCampaigns")) || [];

// 🌟 FIX: Read the exact Campaign ID we just saved
const savedCampaignId = localStorage.getItem("lastPublishedCampaignId");

// Find the campaign in the array using its ID
let campaign = allCampaigns.find(c => c.campaignId === savedCampaignId);

// Fallback in case of an error (shows the last created campaign)
if (!campaign && allCampaigns.length > 0) {
    campaign = allCampaigns[allCampaigns.length - 1];
} else if (!campaign) {
    campaign = {}; 
}

document.getElementById("giftName").innerText = campaign.gift || "Gift";
document.getElementById("receiver").innerText = campaign.receiver || "Receiver";

/*=====================================
      LOAD IMAGE
=====================================*/
if(campaign.giftImageBase64){
    document.getElementById("giftImage").src = campaign.giftImageBase64;
} else {
    document.getElementById("giftImage").src = "images/default-gift.png"; // Fallback image
}

/*=====================================
      CAMPAIGN ID & LINK
=====================================*/
const campaignId = campaign.campaignId || "GB000000";
document.getElementById("campaignId").innerText = campaignId;

// 🌟 FIX: The URL now uses the unique Database ID (e.g., ?id=GBC-123456)
const campaignLink = window.location.origin + "/campaigns.html?id=" + campaignId;
document.getElementById("campaignLink").value = campaignLink;

/*=====================================
      COPY BUTTON
=====================================*/
document.getElementById("copyBtn").onclick = () => {
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
    const title = campaign.gift + " ❤️";
    const text = `Support my GiftBloom campaign for ${campaign.receiver} ❤️`;
    
    if(navigator.share){
        try{
            await navigator.share({
                title: title,
                text: text,
                url: campaignLink
            });
        }catch(err){
            console.log(err);
        }
    } else {
        navigator.clipboard.writeText(campaignLink);
        alert("Sharing is not supported.\nCampaign link copied.");
    }
};

/*=====================================
      VIEW CAMPAIGN
=====================================*/
document.getElementById("viewBtn").onclick = () => {
    // Links to the detail page using the real ID
    window.location = "campaigns.html?id=" + campaignId;
};

/*=====================================
      DASHBOARD & HOME
=====================================*/
document.getElementById("dashboardBtn").onclick = () => {
    window.location = "dashboard(combined).html";
};

document.getElementById("homeBtn").onclick = () => {
    window.location = "index.html";
};
