/*=====================================
      API ENDPOINT (Single Declaration)
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbyspj1ezHNVn6e0AFTDqhPNHJAnclSB9sbVCLeVOfRIla_RpWuBVJr7jViB1zm-RyD-/exec";

/*=====================================
        LOGIN CHECK
=====================================*/
const isPersistentLogin = localStorage.getItem("isLoggedIn") === "true";
const isSessionLogin = sessionStorage.getItem("isLoggedIn") === "true";

// If neither storage has a valid login state, kick them out
if (!isPersistentLogin && !isSessionLogin) {
    
    // 1. Stop them and show the alert
    alert("You have been logged out for security reasons. Please log in again to access your dashboard.");
    
    // 2. Redirect back to login ONLY after they click "OK"
    window.location.href = "login.html"; 
}


/**
 * Universal Utility function to communicate with Google Apps Script backend
 * (Global loader.js automatically intercepts fetch() calls to show/hide the loader)
 */
async function sendToBackend(action, payload) {
    try {
        document.body.style.cursor = 'wait';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: action, data: payload })
        });
        const result = await response.json();
        
        document.body.style.cursor = 'default';
        return result;
        
    } catch (error) {
        console.error("Backend Error:", error);
        document.body.style.cursor = 'default';
        alert("Failed to communicate with the server. Please check your network.");
        return null;
    }
}


/*=====================================
      CONNECTED PAYMENT FUNCTIONS
=====================================*/

async function creatorVerify(index) {
    const activeUserId = currentUser.userId || currentUser.id;
    const pendingDonations = donations.filter(d => {
        const campaign = campaigns.find(c => (c.campaignId || "") === (d.campaignId || d.campaign));
        return (!campaign || campaign.ownerId === activeUserId) && d.status === "Pending";
    });

    const payment = pendingDonations[index];
    if (!payment) return;

    if (!confirm(`Verify payment of ₹${payment.amount} from ${payment.name}?`)) return;

    const result = await sendToBackend('verifyPayment', { paymentId: payment.id, token: currentUser.token });

    if (result && result.status === "Success") {
        payment.status = 'Verified';
        localStorage.setItem("donations", JSON.stringify(donations));
        loadPendingPayments();
        loadPaymentHistory();
        loadCampaigns();
        alert("✅ Payment successfully verified!");
    } else {
        alert("❌ Verification failed: " + (result?.message || "Unknown error"));
    }
}

async function creatorReject(index) {
    const activeUserId = currentUser.userId || currentUser.id;
    const pendingDonations = donations.filter(d => {
        const campaign = campaigns.find(c => (c.campaignId || "") === (d.campaignId || d.campaign));
        return (!campaign || campaign.ownerId === activeUserId) && d.status === "Pending";
    });

    const payment = pendingDonations[index];
    if (!payment) return;

    const reason = prompt(`Rejecting payment from ${payment.name}. Provide a reason (Optional):`);
    if (reason === null) return;

    const result = await sendToBackend('rejectPayment', { paymentId: payment.id, reason: reason, token: currentUser.token });

    if (result && result.status === "Success") {
        payment.status = 'Rejected';
        localStorage.setItem("donations", JSON.stringify(donations));
        loadPendingPayments();
        loadPaymentHistory();
        alert("Payment has been rejected.");
    } else {
        alert("❌ Rejection failed: " + (result?.message || "Unknown error"));
    }
}


/*=====================================
      VIEW DONATION DETAILS
=====================================*/
function viewCreatorDonation(index) {
    // This will currently trigger a safe alert. 
    // Once you build your modal (HTML popup), you can link it here!
    alert("Donation details clicked! You can connect your modal popup here.");
}


/*=====================================
      USER GREETING SYSTEM
=====================================*/
async function loadUserGreeting(userEmail) {
    const welcomeElement = document.getElementById("welcomeGreeting");
    if (!welcomeElement) return;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "getUserGreeting",
                data: { email: userEmail }
            })
        });
        
        const result = await response.json();

        if (result.status === "Success") {
            if (result.data.isNewUser === true) {
                welcomeElement.innerText = "Welcome,";
            } else {
                welcomeElement.innerText = "Welcome Back,";
            }
        } else {
            welcomeElement.innerText = "Welcome,"; 
        }
    } catch (error) {
        welcomeElement.innerText = "Welcome,";
    }
}


/*=====================================
      LOAD USER
=====================================*/

let currentUserStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
let currentUser = currentUserStr ? JSON.parse(currentUserStr) : {};

if (currentUser && (currentUser.userId || currentUser.id)){

    if(document.getElementById("welcomeGreeting")){
        if(localStorage.getItem("isNewLogin") === "true" || sessionStorage.getItem("isNewLogin") === "true"){
            document.getElementById("welcomeGreeting").innerText = "Welcome,";
        } else {
            document.getElementById("welcomeGreeting").innerText = "Welcome Back,";
        }
    }

    if(document.getElementById("userId")) {
        document.getElementById("userId").value = currentUser.userId || currentUser.id;
    }
    if(document.getElementById("dashboardUsername"))
        document.getElementById("dashboardUsername").innerText=currentUser.name;

    if(document.getElementById("profileUserName"))
        document.getElementById("profileUserName").innerText=currentUser.name;

    if(document.getElementById("userEmail"))
        document.getElementById("userEmail").innerText=currentUser.email || "";

    if(document.getElementById("fullName"))
        document.getElementById("fullName").value=currentUser.name || "";

    if(document.getElementById("email"))
        document.getElementById("email").value=currentUser.email || "";

    if(document.getElementById("mobile"))
        document.getElementById("mobile").value=currentUser.mobile || "";

    if(document.getElementById("dob")) {
        let formattedDob = "";
        if (currentUser.dob) {
            try {
                // Extracts just the YYYY-MM-DD part from the date string
                formattedDob = new Date(currentUser.dob).toISOString().split('T')[0];
            } catch(e) {
                // Fallback just in case it's already a simple string
                formattedDob = currentUser.dob; 
            }
        }
        document.getElementById("dob").value = formattedDob;
    }

    if(document.getElementById("gender"))
        document.getElementById("gender").value=currentUser.gender || "Male";

    if(document.getElementById("bio"))
        document.getElementById("bio").value=currentUser.bio || "";

}

/*=====================================
      MOBILE MENU
=====================================*/

const paymentList =
document.getElementById("paymentList");

const menuBtn=document.getElementById("menuBtn");

const menu=document.getElementById("menu");

if (menuBtn && menu) {
menuBtn.addEventListener("click",(e)=>{

e.stopPropagation();

menu.classList.toggle("show");

});

document.addEventListener("click",(e)=>{

if(

!menu.contains(e.target)&&
!menuBtn.contains(e.target)

){

menu.classList.remove("show");

}

});
}

/*=====================================
      FLOATING HEARTS
=====================================*/

const hearts=document.querySelector(".hearts");

if (hearts) {
for(let i=0;i<20;i++){

let heart=document.createElement("div");

heart.className="heart";

heart.innerHTML="❤";

heart.style.left=Math.random()*100+"vw";

heart.style.fontSize=
12+Math.random()*18+"px";

heart.style.animationDuration=
8+Math.random()*8+"s";

heart.style.animationDelay=
Math.random()*5+"s";

hearts.appendChild(heart);

}
}


/*=====================================
      LOAD CAMPAIGNS
=====================================*/
const messagesList = document.getElementById("messagesList");

const campaignContainer =
document.getElementById("campaignContainer");

let campaigns = [];

let donations =
JSON.parse(localStorage.getItem("donations")) || [];


/*=====================================
      LOAD CAMPAIGNS
=====================================*/
async function loadCampaigns() {
    if (!campaignContainer) return;

    campaignContainer.innerHTML = `
    <div class="glass" style="padding:30px;text-align:center;">
    <p>Loading live campaigns... ⏳</p>
    </div>`;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "getUserCampaigns",
                data: { userId: currentUser.id || currentUser.userId }
            })
        });
        const result = await response.json();

        if (result.status === "Success") {
            campaigns = result.data.map(c => ({
                ...c,
                // Fallbacks to handle naming inconsistencies between frontend and backend
                giftName: c.giftName || c.gift || c.title || c.campaignName || "Campaign",
                target: c.targetAmount || c.target || 0,
                raised: c.raisedAmount || c.raised || 0,
                donors: c.donorsCount || c.donors || 0,
                image: c.giftImageUrl || c.image || ""
            }));

            campaignContainer.innerHTML = "";

            if (campaigns.length === 0) {
                campaignContainer.innerHTML = `
                <div class="glass" style="padding:30px;text-align:center;">
                <h3>No Campaigns Yet ❤️</h3>
                <p>Create your first campaign.</p>
                </div>`;
                updateDashboardStats();
                return;
            }

            campaigns.forEach((campaign) => {
                let percent = campaign.target > 0 ? Math.round((campaign.raised / campaign.target) * 100) : 0;
                if (percent > 100) percent = 100;

                // --- Improved Image URL Formatting (fallback aligned with campaign.js) ---
                let sourceImg = (campaign.image || "").trim();
                let displayImage = 'images/teddy.jpg'; 

                if (sourceImg !== "") {
                    displayImage = sourceImg;
                    // Handle all variations of Google Drive URLs
                    if (displayImage.includes("drive.google.com")) {
                        let fileId = "";
                        if (displayImage.includes("/file/d/")) {
                            fileId = displayImage.split("/file/d/")[1].split("/")[0];
                        } else if (displayImage.includes("id=")) {
                            fileId = displayImage.split("id=")[1].split("&")[0];
                        }

                        if (fileId) {
                            displayImage = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                        }
                    }
                }

                // Verification check — same admin verification logic as campaign.js's renderCampaignPage()
                let isVerified = Boolean(campaign.verified) && 
                                 String(campaign.verified).toLowerCase() !== "false" && 
                                 String(campaign.verified).trim() !== "";

                if (campaign.adminStatus === "Approved") {
                    isVerified = true;
                }

                let adminBadge = "";
                if (isVerified) {
                    adminBadge = `<span style="display:inline-flex;align-items:center;gap:4px;background:#e8f5e9;color:#2e7d32;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;margin-left:8px;">✅ Admin Verified</span>`;
                }

                // Hidden-by-admin check — same status flag campaign.js checks (ADMIN FIX 1) to block public viewers.
                // The owner still needs to see their own campaign here, just with a clear heads-up why it's not public.
                let isHiddenByAdmin = campaign.status === "Hidden";
                let hiddenBadge = "";
                if (isHiddenByAdmin) {
                    hiddenBadge = `<span style="display:inline-flex;align-items:center;gap:4px;background:#fdecea;color:#c62828;font-size:12px;font-weight:600;padding:4px 10px;border-radius:20px;margin-left:6px;">🚫 Hidden by Admin</span>`;
                }

                // Render card using resolved giftName and robust fallback placeholder
                campaignContainer.innerHTML += `
                <div class="campaign-card">
                    <img src="${displayImage}" alt="Campaign" onerror="this.onerror=null; this.src='https://placehold.co/600x400/ff4d8d/ffffff?text=GiftBloom';">
                    <div class="campaign-info">
                        <h3>${campaign.giftName} ${adminBadge}${hiddenBadge}</h3>
                        <p>For ${campaign.receiver || "Someone Special"} ❤️</p>

                        <div class="progress">
                            <div class="fill" style="width:${percent}%"></div>
                        </div>
                        <span>₹${campaign.raised || 0} / ₹${campaign.target}</span>
                        <div class="campaign-buttons">
                            <button onclick="window.location.href='campaigns.html?id=${campaign.campaignId}'">👀 View</button>
                            <button onclick="editCampaign('${campaign.campaignId}')">✏ Edit</button>
                            <button onclick="campaignAnalytics('${campaign.campaignId}')">📊 Analytics</button>
                            <button onclick="shareCampaign('${campaign.campaignId}')">📤 Share</button>
                            <button onclick="deleteCampaign('${campaign.campaignId}')">🗑 Delete</button>
                        </div>
                    </div>
                </div>`;
            });

            updateDashboardStats();
            if (typeof loadProfileStats === 'function') loadProfileStats();
            if (typeof loadCampaignListForAnalytics === 'function') loadCampaignListForAnalytics();
            loadPendingPayments();
            loadPaymentHistory();
            loadMessages();

        } else {
            campaignContainer.innerHTML = `<div class="glass" style="padding:30px;text-align:center;"><p>❌ ${result.message}</p></div>`;
        }
    } catch (error) {
        campaignContainer.innerHTML = `<div class="glass" style="padding:30px;text-align:center;"><p>❌ Network Error.</p></div>`;
    }
}


/*=====================================
      DASHBOARD STATS
=====================================*/

function updateDashboardStats(){

const totalCampaigns=campaigns.length;

let totalRaised=0;

let totalViews=0;

let totalDonors=0;

campaigns.forEach(c=>{

totalRaised+=Number(c.raised)||0;

totalViews+=Number(c.views)||0;

totalDonors+=Number(c.donors)||0;

});

const statCards=document.querySelectorAll(".stat-card h2");

if(statCards.length>=4){

statCards[0].innerText=totalCampaigns;

statCards[1].innerText="₹"+totalRaised;

statCards[2].innerText=totalDonors;

statCards[3].innerText=totalViews;

}

}

/*=====================================
      DELETE CAMPAIGN
=====================================*/
async function deleteCampaign(campaignId){

if(!confirm("Delete this campaign permanently?")){
return;
}

try {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "deleteCampaign",
            data: { campaignId: campaignId, userId: currentUser.id || currentUser.userId, token: currentUser.token }
        })
    });
    
    const result = await response.json();
    if (result.status === "Success") {
        alert("✅ Campaign deleted.");
        loadCampaigns(); // Refresh UI live from DB
    } else {
        alert("❌ " + result.message);
    }
} catch (error) {
    alert("❌ Network Error.");
}
}

/*=====================================
      EDIT CAMPAIGN
=====================================*/
function editCampaign(campaignId) {
    let campaignToEdit = campaigns.find(c => c.campaignId === campaignId);
    if(!campaignToEdit) return;
    
    const uid = currentUser.userId || currentUser.id || "";

    // Save the data and the exact ID (supports both legacy keys and per-user draft keys in create.js)
    localStorage.setItem("newCampaign", JSON.stringify(campaignToEdit));
    localStorage.setItem("editingId", campaignId); 
    localStorage.setItem("draftTime", Date.now());
    if (uid) {
        localStorage.setItem("draftData_" + uid, JSON.stringify(campaignToEdit));
        localStorage.setItem("draftTime_" + uid, Date.now());
    }
    
    // Send the user to the form
    window.location.href = "create.html";
}

/*=====================================
      OPEN ANALYTICS FROM BUTTON
=====================================*/
function campaignAnalytics(campaignId){
    openPage('analytics'); 
    const select = document.getElementById("campaignSelect");
    if(select) {
        select.value = campaignId; 
    }
    loadAnalytics(campaignId); 
}

/*=====================================
      PAYMENT VERIFICATION
=====================================*/

function loadPendingPayments(){

if(!paymentList) return;

paymentList.innerHTML="";

const activeUserId = currentUser.userId || currentUser.id;

const pendingDonations = donations.filter(d=>{

const campaign = campaigns.find(c=>

(c.campaignId||"")===

(d.campaignId||d.campaign)

);

return (!campaign || campaign.ownerId===activeUserId) &&
d.status==="Pending";

});

if(pendingDonations.length===0){

paymentList.innerHTML=`

<div class="glass"
style="padding:25px;text-align:center;">

<h3>🎉 No pending Payments</h3>

<p>Everything is verified.</p>

</div>

`;

return;

}

pendingDonations.forEach((d,index)=>{

paymentList.innerHTML+=`

<div class="glass"
style="padding:20px;margin-bottom:20px;">

<h3>${d.name}</h3>

<p><b>Donation ID :</b> ${d.id}</p>

<p><b>Campaign :</b> ${d.campaignId}</p>

<p><b>Amount :</b> ₹${d.amount}</p>

<p><b>Status :</b> ${d.status}</p>

<div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">

<button onclick="creatorVerify(${index})">
✅ Payment Received
</button>

<button onclick="viewCreatorDonation(${index})">
👁 View
</button>

<button onclick="creatorReject(${index})">
❌ Reject
</button>

</div>

</div>

`;

});

}

/*=====================================
      SHARE
=====================================*/

function shareCampaign(campaignId){

const c = campaigns.find(c => c.campaignId === campaignId);
if(!c) return;

const baseURL = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
const url = baseURL + "/campaigns.html?id=" + campaignId;

if(navigator.share){

navigator.share({

title:c.gift || c.giftName,

text:

"Support my GiftBloom campaign ❤️",

url:url

});

}else{

navigator.clipboard.writeText(url);

alert(

"Campaign link copied."

);

}

}

/*=====================================
      QUICK ACTIONS
=====================================*/

document.querySelectorAll(".actions button")

.forEach(btn=>{

btn.addEventListener("mouseenter",()=>{

btn.style.transform="translateY(-5px)";

});

btn.addEventListener("mouseleave",()=>{

btn.style.transform="";

});

});

/*=====================================
      NOTIFICATION ICON
=====================================*/

const notification=

document.querySelector(".notification");

if(notification){

notification.onclick=()=>{

openPage("notifications");

};
}

/*=====================================
      EDIT PROFILE (FROM SETTINGS)
=====================================*/

const editProfileBtn=
document.getElementById("editProfile");

if(editProfileBtn){

editProfileBtn.onclick=()=>{

openPage("profile");

};

}

/*=====================================
      VERIFY MOBILE
=====================================*/

const verifyMobile=

document.getElementById(

"verifyMobile"

);

if(verifyMobile){

verifyMobile.onclick=()=>{

alert(

"Mobile verification module will be added after Apps Script integration."

);

};

}

/*=====================================
      PROFILE STATS
=====================================*/

function loadProfileStats(){

const campaignCount=

document.getElementById(

"campaignCount"

);

const raisedAmount=

document.getElementById(

"raisedAmount"

);

const donorCount=

document.getElementById(

"donorCount"

);

const donationCount=

document.getElementById(

"donationCount"

);

if(!campaignCount) return;

campaignCount.innerText=

campaigns.length;

let raised=0;

let donors=0;

campaigns.forEach(c=>{

raised+=Number(c.raised)||0;

donors+=Number(c.donors)||0;

});

raisedAmount.innerText=

"₹"+raised;

donorCount.innerText=

donors;

donationCount.innerText=

donors;

}

loadProfileStats();

/*=====================================
      LOAD SETTINGS
=====================================*/

let userSettings=JSON.parse(

localStorage.getItem("userSettings")

)||{

emailNotification:true,

donationNotification:true,

campaignNotification:true,

marketingNotification:false,

language:"English",

currency:"₹ INR",

privacy:"public"

};

loadSettings();

function loadSettings(){

if(document.getElementById("emailNotification")){

document.getElementById(

"emailNotification"

).checked=

userSettings.emailNotification;

}

if(document.getElementById("donationNotification")){

document.getElementById(

"donationNotification"

).checked=

userSettings.donationNotification;

}

if(document.getElementById("campaignNotification")){

document.getElementById(

"campaignNotification"

).checked=

userSettings.campaignNotification;

}

if(document.getElementById("marketingNotification")){

document.getElementById(

"marketingNotification"

).checked=

userSettings.marketingNotification;

}

if(document.getElementById("language")){

document.getElementById(

"language"

).value=

userSettings.language;

}

if(document.getElementById("currency")){

document.getElementById(

"currency"

).value=

userSettings.currency;

}

const privacy=document.querySelector(

`input[name="privacy"][value="${userSettings.privacy}"]`

);

if(privacy){

privacy.checked=true;

}

}

/*=====================================
      SAVE SETTINGS
=====================================*/

const saveSettingsBtn=

document.getElementById(

"saveSettings"

);

if(saveSettingsBtn){

saveSettingsBtn.onclick=saveSettings;

}

function saveSettings(){

userSettings.emailNotification=

document.getElementById(

"emailNotification"

).checked;

userSettings.donationNotification=

document.getElementById(

"donationNotification"

).checked;

userSettings.campaignNotification=

document.getElementById(

"campaignNotification"

).checked;

userSettings.marketingNotification=

document.getElementById(

"marketingNotification"

).checked;

userSettings.language=

document.getElementById(

"language"

).value;

userSettings.currency=

document.getElementById(

"currency"

).value;

userSettings.privacy=

document.querySelector(

'input[name="privacy"]:checked'

).value;

localStorage.setItem(

"userSettings",

JSON.stringify(userSettings)

);

alert(

"Settings saved successfully ❤️"

);

}

/*=====================================
      DELETE ACCOUNT
=====================================*/

const deleteAccountBtn=

document.getElementById(

"deleteAccount"

);

if(deleteAccountBtn){

deleteAccountBtn.onclick=deleteAccount;

}

async function deleteAccount(){

const userInput = prompt("WARNING: This will permanently delete your account, campaigns, Drive images, expenses, donations, and messages. Type 'DELETE' to confirm:");

if (userInput === "DELETE") {
    const result = await sendToBackend('deleteUser', {
        userId: currentUser.userId || currentUser.id,
        token: currentUser.token
    });
    if (result && result.status === "Success") {
        localStorage.clear();
        sessionStorage.clear();
        alert("✅ Your account and all associated data have been permanently deleted.");
        window.location.href = "index.html";
    } else {
        alert("❌ Failed to delete account: " + (result?.message || "Server error"));
    }
} else if (userInput !== null) {
    alert("Action cancelled. Your account is safe.");
}

}

/*=====================================
      LANGUAGE
=====================================*/

const language=

document.getElementById(

"language"

);

if(language){

language.onchange=()=>{

console.log(

"Language:",

language.value

);

};

}

/*=====================================
      CURRENCY
=====================================*/

const currency=

document.getElementById(

"currency"

);

if(currency){

currency.onchange=()=>{

console.log(

"Currency:",

currency.value

);

};

}

/*=====================================
      SETTINGS SHORTCUT
=====================================*/

const settingsMenu=

document.getElementById(

"settingsMenu"

);

if(settingsMenu){

settingsMenu.onclick=()=>{

openPage("settings");

};

}

/*=====================================
      PROFILE SHORTCUT
=====================================*/

const profileMenu=

document.getElementById(

"profileMenu"

);

if(profileMenu){

profileMenu.onclick=()=>{

openPage("profile");

};

}

/*=====================================
      LOGOUT SHORTCUT
=====================================*/

async function logout() {
    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "logoutSession", data: { token: currentUser?.token } })
        });
    } catch (e) { console.log("Session cleanup failed: " + e); }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
}

if(document.getElementById("logoutBtn")){
document.getElementById("logoutBtn").onclick=(e)=>{
e.preventDefault();
logout();
};
}

if(document.getElementById("profileLogout")){
document.getElementById("profileLogout").onclick = logout;
}

if(document.getElementById("settingsLogout")){
document.getElementById("settingsLogout").onclick = logout;
}

/*=====================================
      CARD ANIMATION
=====================================*/

const animatedCards=document.querySelectorAll(

".glass,.stat-box,.campaign-card,.setting-group"

);

const observer=new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.style.opacity="1";

entry.target.style.transform="translateY(0)";

}

});

},

{

threshold:.15

}

);

animatedCards.forEach(card=>{

card.style.opacity="0";

card.style.transform="translateY(40px)";

card.style.transition=".6s";

observer.observe(card);

});

/*=====================================
      NOTIFICATION
=====================================*/

const notificationBtn=

document.querySelector(".notification");

if(notificationBtn){

notificationBtn.onclick=()=>{

if(document.getElementById("notifications")){

openPage("notifications");

}else{

alert(

"Notifications module coming soon."

);

}

};

}

/*=====================================
      BOTTOM NAVIGATION
=====================================*/

document

.querySelectorAll(".bottom-nav a")

.forEach(link=>{

link.addEventListener("click",()=>{

document

.querySelectorAll(".bottom-nav a")

.forEach(a=>{

a.classList.remove("active");

});

link.classList.add("active");

});

});

/*=====================================
      MENU LINKS
=====================================*/

document

.querySelectorAll("#menu a")

.forEach(link=>{

link.addEventListener("click",()=>{

if (menu) menu.classList.remove("show");

});

});

/*=====================================
      KEYBOARD SHORTCUTS
=====================================*/

document.addEventListener(

"keydown",

(e)=>{

if(e.key==="Escape" && menu){

menu.classList.remove("show");

}

}

);

/*=====================================
      REFRESH DASHBOARD
=====================================*/

function refreshDashboard(){
    loadCampaigns();
    loadProfileStats();
    loadSettings();
    loadMessages();
    loadCampaignListForAnalytics(); 
}


function openPage(pageId){

document.querySelectorAll(".page").forEach(page=>{
page.classList.remove("active");
});

const page=document.getElementById(pageId);

if(page){
page.classList.add("active");
window.scrollTo({top:0,behavior:"smooth"});
}

}


/*=====================================
      NOTIFICATIONS (LIVE)
=====================================*/
let notifications = [];
const list = document.getElementById("notificationList");

async function loadNotificationsFromServer() {
    const result = await sendToBackend('getUserNotifications', { token: currentUser.token });
    if (result && result.status === "Success") {
        notifications = result.data;
        updateNotificationBadge();
        loadNotifications(document.querySelector(".filter.active")?.dataset.filter || "all");
    }
}

function updateNotificationBadge() {
    const badge = document.querySelector(".notification .badge");
    if (!badge) return;
    const unread = notifications.filter(n => !n.read).length;
    badge.innerText = unread;
    badge.style.display = unread > 0 ? "inline-block" : "none";
}

function formatRelativeTime(isoString) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    const mins = Math.floor((Date.now() - d.getTime()) / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return mins + " min ago";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + " hr ago";
    const days = Math.floor(hours / 24);
    if (days < 7) return days + "d ago";
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function loadNotifications(filter = "all") {
    if (!list) return;
    list.innerHTML = "";
    let data = notifications;
    if (filter === "unread") data = notifications.filter(n => !n.read);
    else if (filter !== "all") data = notifications.filter(n => n.type === filter);

    if (data.length === 0) {
        list.innerHTML = `<div class="empty">No notifications found ❤️</div>`;
        return;
    }
    data.forEach(item => {
        const icon = item.type === "donation" ? "💰" : item.type === "campaign" ? "🎉" : "🌸";
        list.innerHTML += `
        <div class="notification-item ${item.read ? "" : "unread"}">
            <div class="icon">${icon}</div>
            <div class="content">
                <h3>${item.title}</h3>
                <p>${item.message}</p>
                <div class="time">${formatRelativeTime(item.date)}</div>
                ${item.read ? "" : `<button class="mark-read" onclick="markRead('${item.id}')">Mark Read</button>`}
            </div>
        </div>`;
    });
}

async function markRead(notificationId) {
    const result = await sendToBackend('markNotificationRead', { notificationId, token: currentUser.token });
    if (result && result.status === "Success") {
        const n = notifications.find(x => x.id === notificationId);
        if (n) n.read = true;
        updateNotificationBadge();
        loadNotifications(document.querySelector(".filter.active")?.dataset.filter || "all");
    }
}

document.querySelectorAll(".filter").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        loadNotifications(btn.dataset.filter);
    };
});

if (document.getElementById("markAllRead")) {
    document.getElementById("markAllRead").onclick = async () => {
        const result = await sendToBackend('markAllNotificationsRead', { token: currentUser.token });
        if (result && result.status === "Success") {
            notifications.forEach(n => n.read = true);
            updateNotificationBadge();
            loadNotifications();
        }
    };
}

if (document.getElementById("clearAll")) {
    document.getElementById("clearAll").onclick = async () => {
        if (!confirm("Clear all notifications?")) return;
        const result = await sendToBackend('clearNotifications', { token: currentUser.token });
        if (result && result.status === "Success") {
            notifications = [];
            updateNotificationBadge();
            loadNotifications();
        }
    };
}

async function loadRecentActivity() {
    const activityList = document.querySelector(".activity-list");

    const result = await sendToBackend('getUserDonations', {
        userId: currentUser.userId || currentUser.id,
        token: currentUser.token
    });
    if (!result || result.status !== "Success") return;

    // Sync live donations from backend so Pending Payments, Payment History & Messages work across all devices
    donations = Array.isArray(result.data) ? result.data : [];
    localStorage.setItem("donations", JSON.stringify(donations));
    loadPendingPayments();
    loadPaymentHistory();
    loadMessages();

    if (!activityList) return;
    const recent = donations.slice(0, 5);

    if (recent.length === 0) {
        activityList.innerHTML = `<div class="activity-item">No activity yet — share your campaign to get your first donation! ❤️</div>`;
        return;
    }

    activityList.innerHTML = "";
    recent.forEach(d => {
        const isAnon = d.anonymous === true || d.anonymous === "TRUE";
        const donorName = isAnon ? "Someone" : (d.name || "A supporter");
        const icon = d.status === "Verified" ? "✅" : d.status === "Rejected" ? "❌" : "💰";
        activityList.innerHTML += `<div class="activity-item">${icon} ${donorName} donated ₹${d.amount} — ${d.status}</div>`;
    });
}


/*=====================================
      COPY USER ID
=====================================*/
const copyBtn = document.getElementById("copyUserId");

if (copyBtn) {
    copyBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(
            document.getElementById("userId").value
        );

        copyBtn.innerHTML = "✅";

        setTimeout(() => {
            copyBtn.innerHTML = "📋";
        }, 1500);
    });
}


/*=====================================
      PAYMENT HISTORY
=====================================*/
const paymentHistoryTable =
document.getElementById("paymentHistoryTable");

function loadPaymentHistory(){

if(!paymentHistoryTable) return;

paymentHistoryTable.innerHTML="";

const activeUserId = currentUser.userId || currentUser.id;

const history = donations.filter(d=>{

const campaign = campaigns.find(c=>

(c.campaignId||"")===(d.campaignId||d.campaign)

);

return !campaign || campaign.ownerId===activeUserId;

});

if(history.length===0){

paymentHistoryTable.innerHTML=`

<tr>

<td colspan="9" style="text-align:center;">

No payment history found.

</td>

</tr>

`;

return;

}

history.forEach((d,index)=>{

paymentHistoryTable.innerHTML+=`

<tr>

<td>${d.id}</td>

<td>${d.transactionId||"-"}</td>

<td>${d.name}</td>

<td>${d.campaignId}</td>

<td>₹${d.amount}</td>

<td>${d.status}</td>

<td>${d.verifiedBy||"-"}</td>

<td>${d.verifiedDate||d.date}</td>

<td>

<button onclick="viewCreatorDonation(${index})">

👁 View

</button>

</td>

</tr>

`;

});

}

loadPaymentHistory();
if (document.getElementById("paymentHistorySearch")) {
document.getElementById("paymentHistorySearch")
.addEventListener("input",function(){

const keyword=this.value.toLowerCase();

Array.from(paymentHistoryTable.rows)
.forEach(row=>{

row.style.display=

row.innerText.toLowerCase().includes(keyword)

? ""

: "none";

});

});
}

if (document.getElementById("paymentHistoryFilter")) {
document.getElementById("paymentHistoryFilter")
.onchange=function(){

const filter=this.value.toLowerCase();

Array.from(paymentHistoryTable.rows)
.forEach(row=>{

if(filter==="all"){

row.style.display="";

return;

}

const status=row.cells[5]?.innerText.toLowerCase() || "";

row.style.display=

status.includes(filter)

? ""

: "none";

});

};
}

/*=====================================
        LOAD DONOR MESSAGES
=====================================*/

function loadMessages() {
    if(!messagesList) return;
    messagesList.innerHTML = "";

    const activeUserId = currentUser.userId || currentUser.id;
    
    // Filter donations: Must belong to current user AND have a message
    const userMessages = donations.filter(d => {
        const campaign = campaigns.find(c => (c.campaignId || "") === (d.campaignId || d.campaign));
        
        // Check if user owns campaign AND if a message exists (and isn't just empty spaces)
        return (!campaign || campaign.ownerId === activeUserId) && 
               d.message && 
               String(d.message).trim() !== "";
    });

    if(userMessages.length === 0) {
        messagesList.innerHTML = `
            <div class="empty">
                <h3>No messages yet 💬</h3>
                <p>When donors leave a note with their payment, it will appear here.</p>
            </div>
        `;
        return;
    }

    // Render each message
    userMessages.forEach(msg => {
        const matchedCamp = campaigns.find(c => (c.campaignId || "") === (msg.campaignId || msg.campaign));
        const campaignName = msg.campaignName || (matchedCamp && (matchedCamp.giftName || matchedCamp.gift)) || msg.campaignId || "Your Campaign"; 
        
        messagesList.innerHTML += `
            <div class="message-item">
                <div class="message-header">
                    <h3>${msg.name || "Anonymous Donor"}</h3>
                    <span class="message-amount">₹${msg.amount || 0}</span>
                </div>
                <div class="message-body">
                    "${msg.message}"
                </div>
                <span class="message-campaign">For: ${campaignName} | ${msg.date || ""}</span>
            </div>
        `;
    });
}

/*=====================================
      ANALYTICS SYSTEM
=====================================*/
const campaignSelect = document.getElementById("campaignSelect");

function loadCampaignListForAnalytics(){
    if(!campaignSelect) return;
    
    campaignSelect.innerHTML = "";
    
    if(campaigns.length === 0){
        campaignSelect.innerHTML = "<option>No Campaigns Found</option>";
        return;
    }
    
    campaigns.forEach(c => {
        campaignSelect.innerHTML += `<option value="${c.campaignId}">${c.gift || c.giftName} (For ${c.receiver})</option>`;
    });
    
    loadAnalytics(campaigns[0].campaignId); // Load the first campaign's ID by default
}

if(campaignSelect){
    campaignSelect.onchange = () => {
        loadAnalytics(campaignSelect.value);
    };
}

function loadAnalytics(campaignId){
    const c = campaigns.find(c => c.campaignId === campaignId);
    if(!c) return;

    const raised = Number(c.raised) || 0;
    const target = Number(c.target) || 0;
    const donors = Number(c.donors) || 0;
    const views = Number(c.views) || 0;
    const shares = Number(c.shares) || 0;
    const likes = Number(c.likes) || 0;

    const progress = target > 0 ? Math.round((raised / target) * 100) : 0;

    // Update Top Overview
    if (document.getElementById("totalRaised")) document.getElementById("totalRaised").innerText = "₹" + raised;
    if (document.getElementById("totalDonors")) document.getElementById("totalDonors").innerText = donors;
    if (document.getElementById("totalViews")) document.getElementById("totalViews").innerText = views;
    if (document.getElementById("progressPercent")) document.getElementById("progressPercent").innerText = progress + "%";

    // Update Progress Bar
    if (document.getElementById("raisedText")) document.getElementById("raisedText").innerText = "Raised ₹" + raised;
    if (document.getElementById("targetText")) document.getElementById("targetText").innerText = "Target ₹" + target;
    const progressFill = document.getElementById("progressFill");
    if(progressFill) progressFill.style.width = progress + "%";

    // Update Summaries
    if (document.getElementById("todayDonation")) document.getElementById("todayDonation").innerText = "₹" + (c.todayDonation || 0);
    if (document.getElementById("weekDonation")) document.getElementById("weekDonation").innerText = "₹" + (c.weekDonation || 0);
    if (document.getElementById("monthDonation")) document.getElementById("monthDonation").innerText = "₹" + (c.monthDonation || raised);

    // Update Insights
    if (document.getElementById("viewCount")) document.getElementById("viewCount").innerText = views;
    if (document.getElementById("shareCount")) document.getElementById("shareCount").innerText = shares;
    if (document.getElementById("likeCount")) document.getElementById("likeCount").innerText = likes;

    let conversion = views > 0 ? ((donors / views) * 100).toFixed(1) : 0;
    if (document.getElementById("conversionRate")) document.getElementById("conversionRate").innerText = conversion + "%";
    if (document.getElementById("campaignStatus")) document.getElementById("campaignStatus").innerText = c.status || "Active";

    // Render Top Donors
    const donorBox = document.getElementById("topDonors");
    if(donorBox){
        donorBox.innerHTML = "";
        if(c.topDonors && c.topDonors.length){
            c.topDonors.forEach(d => {
                donorBox.innerHTML += `<div><span>${d.name}</span><strong>₹${d.amount}</strong></div>`;
            });
        } else {
            donorBox.innerHTML = "<p style='color:#888;'>No donors yet.</p>";
        }
    }

    // Render Expenses (Safely handles JSON strings and arrays)
    const expenseBox = document.getElementById("expenseList");
    if(expenseBox){
        expenseBox.innerHTML = "";
        let parsedExpenses = c.expenses;
        if (typeof parsedExpenses === "string" && parsedExpenses.trim() !== "") {
            try { parsedExpenses = JSON.parse(parsedExpenses); }
            catch (e) { parsedExpenses = []; }
        }
        if(Array.isArray(parsedExpenses) && parsedExpenses.length){
            parsedExpenses.forEach(e => {
                expenseBox.innerHTML += `<div><span>${e.title || e.item}</span><strong>₹${e.amount || e.cost}</strong></div>`;
            });
        } else {
            expenseBox.innerHTML = "<p style='color:#888;'>No expenses added.</p>";
        }
    }
}

/*=====================================
      APP INITIALIZE
=====================================*/

function initializeDashboard(){
    if (currentUser && currentUser.email) {
        loadUserGreeting(currentUser.email);
    }
    
    refreshDashboard();
    loadPendingPayments();
    loadNotificationsFromServer();   // NEW
    loadRecentActivity();            // NEW
    
    console.log("GiftBloom Dashboard Loaded ❤️");
}

initializeDashboard();

/*=====================================
    AUTO-OPEN SECTION FROM URL QUERY
=====================================*/
window.addEventListener("load", () => {
    // 1. Look for ?target= in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const targetPageId = urlParams.get('target'); 

    // 2. If 'target' exists and matches an ID on the page, open it
    if (targetPageId && document.getElementById(targetPageId)) {
        // 3. We use a slight delay so it waits for your loading screen to finish
        setTimeout(() => {
            openPage(targetPageId);
        }, 100);
    }
});

/*=====================================
      PRIVACY & DANGER ZONE ACTIONS
=====================================*/

// --- Privacy & Visibility ---

document.getElementById('hideAccountBtn')?.addEventListener('click', function() {
    const isConfirmed = confirm("Are you sure you want to hide your account? Your profile will no longer be visible to the public.");
    if (isConfirmed) {
        // Add your backend logic here
        alert("Your account is now hidden.");
        this.innerText = "Unhide My Account"; // Toggle text
    }
});

document.getElementById('hideCampaignsBtn')?.addEventListener('click', function() {
    const isConfirmed = confirm("Are you sure you want to hide all your active campaigns? They will be paused.");
    if (isConfirmed) {
        // Add your backend logic here
        alert("All campaigns are now hidden.");
        this.innerText = "Unhide All My Campaigns"; // Toggle text
    }
});

// --- Danger Zone (Destructive Actions) ---

document.getElementById('deleteAllCampaignsBtn')?.addEventListener('click', async function() {
    const userInput = prompt("WARNING: This will permanently delete ALL your campaigns, their Drive images, expenses, and donation records. Type 'DELETE' to confirm:");
    if (userInput === "DELETE") {
        const result = await sendToBackend('deleteAllUserCampaigns', {
            userId: currentUser.userId || currentUser.id,
            token: currentUser.token
        });
        if (result && result.status === "Success") {
            localStorage.removeItem("newCampaign");
            localStorage.removeItem("editingId");
            localStorage.removeItem("draftData_" + (currentUser.userId || currentUser.id));
            localStorage.removeItem("draftTime_" + (currentUser.userId || currentUser.id));
            alert("✅ " + (result.message || "All campaigns and related records have been permanently deleted."));
            refreshDashboard();
        } else {
            alert("❌ Failed to delete campaigns: " + (result?.message || "Server error"));
        }
    } else if (userInput !== null) {
        alert("Action cancelled. You didn't type 'DELETE'.");
    }
});

document.getElementById('deleteAccountBtn')?.addEventListener('click', async function() {
    const userInput = prompt("WARNING: This will permanently delete your account, campaigns, Drive images, expenses, donations, and messages. Type 'DELETE' to confirm:");
    if (userInput === "DELETE") {
        const result = await sendToBackend('deleteUser', {
            userId: currentUser.userId || currentUser.id,
            token: currentUser.token
        });
        if (result && result.status === "Success") {
            localStorage.clear();
            sessionStorage.clear();
            alert("✅ Your account and all associated data have been permanently deleted.");
            window.location.href = "index.html";
        } else {
            alert("❌ Failed to delete account: " + (result?.message || "Server error"));
        }
    } else if (userInput !== null) {
        alert("Action cancelled. Your account is safe.");
    }
});


/*=====================================================================
  PROFILE SECURITY, EMAIL VERIFICATION PILL & CHANGE PASSWORD MODAL
=====================================================================*/
(function () {
  "use strict";

  const $ = function (id) { return document.getElementById(id); };

  const FIELDS = { fullName: "name", email: "email", mobile: "mobile", dob: "dob", gender: "gender", bio: "bio" };
  const IDS = Object.keys(FIELDS).filter(function (id) { return $(id); });

  const editToggleBtn = $("editProfileToggleBtn");
  const saveBtn = $("saveProfile");
  const lockTag = $("userIdLockTag");
  const verifyEmailBadge = $("verifyEmailBadge");
  const actionsWrap = $("profileEditActions");

  if (!saveBtn || !editToggleBtn || !$("fullName")) return;

  /* ---------- helpers ---------- */
  function norm(key, v) {
    v = String(v == null ? "" : v);
    if (key === "mobile") return v.replace(/[\s\-()]/g, "");
    if (key === "email") return v.trim().toLowerCase();
    if (key === "name") return v.replace(/\s+/g, " ").trim();
    return v.trim();
  }

  function persistCurrentUser() {
    if (localStorage.getItem("currentUser")) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    }
    if (sessionStorage.getItem("currentUser")) {
      sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
    }
  }

  // Because signup.js verifies email via OTP at account creation and profile edits verify via OTP,
  // an account with a valid email is verified unless explicitly marked emailVerified === false.
  function isUserEmailVerified() {
    if (!currentUser || !currentUser.email) return false;
    if (currentUser.emailVerified === false || String(currentUser.emailVerified).toUpperCase() === "FALSE") {
      return false;
    }
    return true;
  }

  /* ---------- state ---------- */
  const original = {};
  let isEditing = false;
  let pending = null; // { mode: 'profile'|'verify-email', changes, hasEmail, stage, sentTo }
  let busy = false;
  let cooldown = null;
  let toastTimer = null;

  /* ---------- Hint under buttons ---------- */
  const hint = document.createElement("p");
  hint.className = "profile-hint";
  hint.textContent = "🔒 Click Edit Profile to unlock fields. Every change is confirmed with an email code.";
  actionsWrap.insertAdjacentElement("afterend", hint);

  /* ---------- Toast ---------- */
  const toastEl = document.createElement("div");
  toastEl.className = "pf-toast";
  toastEl.setAttribute("role", "status");
  document.body.appendChild(toastEl);

  function toast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = "pf-toast show" + (type ? " " + type : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 4000);
  }

  /* ---------- OTP Modal (for Profile Save & Verify Email) ---------- */
  const overlay = document.createElement("div");
  overlay.className = "otp-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "otpTitle");
  overlay.innerHTML = `
    <div class="otp-card">
      <ul class="otp-steps" id="otpSteps" hidden>
        <li id="otpStep1" class="active"><span class="dot">1</span>Current email</li>
        <li class="bar" aria-hidden="true"></li>
        <li id="otpStep2"><span class="dot">2</span>New email</li>
      </ul>
      <h2 id="otpTitle"></h2>
      <p class="otp-sub" id="otpSub"></p>
      <input class="otp-input" id="otpInput" type="text" inputmode="numeric" pattern="[0-9]*"
             autocomplete="one-time-code" placeholder="······" aria-label="6-digit code">
      <div class="otp-msg" id="otpMsg" role="alert"></div>
      <button type="button" class="primary" id="otpVerify"></button>
      <div class="otp-links">
        <button type="button" class="link-btn" id="otpResend">Resend code</button>
        <button type="button" class="link-btn" id="otpCancel">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const otpSteps = $("otpSteps"), otpTitle = $("otpTitle"), otpSub = $("otpSub"), otpInput = $("otpInput"),
        otpMsg = $("otpMsg"), verifyBtn = $("otpVerify"), resendBtn = $("otpResend"), cancelBtn = $("otpCancel");

  function setMsg(text, kind) {
    otpMsg.textContent = text || "";
    otpMsg.className = "otp-msg" + (kind ? " " + kind : "");
  }

  function startCooldown(sec) {
    clearInterval(cooldown);
    let left = Number(sec) || 60;
    function tick() {
      resendBtn.disabled = left > 0;
      resendBtn.textContent = left > 0 ? "Resend in " + left + "s" : "Resend code";
      if (left-- <= 0) clearInterval(cooldown);
    }
    tick();
    cooldown = setInterval(tick, 1000);
  }

  function openModal() {
    overlay.classList.add("show");
    document.body.style.overflow = "hidden";
    setTimeout(function () { otpInput.focus(); }, 60);
  }

  function closeModal() {
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    clearInterval(cooldown);
  }

  function renderStage() {
    const p = pending;
    let before, after = ".";

    otpSteps.hidden = !(p.mode === "profile" && p.hasEmail);
    $("otpStep1").className = p.stage === 1 ? "active" : "done";
    $("otpStep1").querySelector(".dot").textContent = p.stage === 1 ? "1" : "✓";
    $("otpStep2").className = p.stage === 2 ? "active" : "";

    if (p.mode === "verify-email") {
      otpTitle.textContent = "Verify your email";
      before = "Enter the 6-digit code we sent to ";
      after = " to mark your email as verified.";
      verifyBtn.textContent = "Verify Email";
    } else if (!p.hasEmail) {
      otpTitle.textContent = "Confirm your changes";
      before = "Enter the 6-digit code we sent to ";
      after = " to confirm your changes.";
      verifyBtn.textContent = "Confirm and save";
    } else if (p.stage === 1) {
      otpTitle.textContent = "Confirm it's you";
      before = "Step 1 of 2. Enter the code we sent to your current email, ";
      verifyBtn.textContent = "Continue";
    } else {
      otpTitle.textContent = "Verify your new email";
      before = "Step 2 of 2. Enter the code we sent to ";
      verifyBtn.textContent = "Verify and save";
    }

    const b = document.createElement("b");
    b.textContent = p.sentTo;
    otpSub.textContent = before;
    otpSub.append(b, after);
    otpInput.value = "";
    setMsg("");
  }

  /* ---------- Email Verified Pill Visibility ---------- */
  function syncVerifyEmailBadge() {
    if (!verifyEmailBadge) return;
    verifyEmailBadge.hidden = isUserEmailVerified();
  }

  /* ---------- Single Edit Profile & Dynamic Save Button Logic ---------- */
  function snapshot() {
    IDS.forEach(function (id) { original[id] = $(id).value; });
  }

  function collectChanges() {
    const out = {};
    if (!isEditing) return out;
    IDS.forEach(function (id) {
      const key = FIELDS[id];
      const now = norm(key, $(id).value);
      if (now !== norm(key, original[id])) out[key] = now;
    });
    return out;
  }

  function refreshSaveVisibility() {
    if (!isEditing) {
      saveBtn.hidden = true;
      return;
    }
    const hasChanges = Object.keys(collectChanges()).length > 0;
    // Save button ONLY appears beside Edit button when at least 1 character has changed
    saveBtn.hidden = !hasChanges;
  }

  function setEditMode(on) {
    isEditing = on;

    // Show/hide "🔒 Can't be changed" on User ID ONLY when edit mode is unlocked
    if (lockTag) lockTag.hidden = !on;

    IDS.forEach(function (id) {
      const el = $(id);
      if (!on) el.value = original[id]; // revert unsaved edits when cancelling
      el.disabled = !on;
      el.classList.toggle("field-unlocked", on);
    });

    editToggleBtn.classList.toggle("editing-active", on);
    editToggleBtn.innerHTML = on ? "✖ Cancel Edit" : "✏️ Edit Profile";

    if (on) {
      $("fullName").focus();
    }
    refreshSaveVisibility();
  }

  editToggleBtn.addEventListener("click", function () {
    setEditMode(!isEditing);
  });

  IDS.forEach(function (id) {
    const el = $(id);
    el.addEventListener("input", refreshSaveVisibility);
    el.addEventListener("change", refreshSaveVisibility);
  });

  /* ---------- Profile Save Flow ---------- */
  async function onSave() {
    if (busy || !isEditing) return;
    const changes = collectChanges();
    if (Object.keys(changes).length === 0) return;
    if (!currentUser.token) { toast("Your session has expired. Log in again.", "error"); return; }

    busy = true;
    const res = await sendToBackend("requestProfileChange", { token: currentUser.token, changes: changes });
    busy = false;
    if (!res) return;
    if (res.status !== "Success") { toast(res.message || "We couldn't send the code. Try again.", "error"); return; }

    const d = res.data || {};
    pending = { mode: "profile", changes: changes, hasEmail: !!changes.email, stage: 1, sentTo: d.sentTo || "your email" };
    renderStage();
    openModal();
    startCooldown(d.resendInSec);
  }

  /* ---------- Verify Unverified Email Flow ---------- */
  async function onVerifyEmailClick() {
    if (busy) return;
    if (!currentUser.token) { toast("Your session has expired. Log in again.", "error"); return; }

    busy = true;
    const res = await sendToBackend("requestEmailVerification", { token: currentUser.token });
    busy = false;
    if (!res) return;
    if (res.status !== "Success") {
      if (res.data && res.data.alreadyVerified) {
        currentUser.emailVerified = true;
        persistCurrentUser();
        syncVerifyEmailBadge();
        toast("Your email is already verified! ✅", "ok");
        return;
      }
      toast(res.message || "Could not send verification email.", "error");
      return;
    }

    const d = res.data || {};
    pending = { mode: "verify-email", changes: {}, hasEmail: false, stage: 1, sentTo: d.sentTo || currentUser.email || "your email" };
    renderStage();
    openModal();
    startCooldown(d.resendInSec || 60);
  }

  if (verifyEmailBadge) {
    verifyEmailBadge.addEventListener("click", onVerifyEmailClick);
  }

  /* ---------- OTP Verify / Resend / Cancel ---------- */
  async function onVerify() {
    if (!pending || busy) return;
    if (otpInput.value.length !== 6) { setMsg("Enter the 6-digit code.", "error"); return; }

    busy = true;
    verifyBtn.disabled = true;
    const actionName = pending.mode === "verify-email" ? "verifyEmailOtp" : "verifyProfileChange";
    const res = await sendToBackend(actionName, { token: currentUser.token, otp: otpInput.value });
    busy = false;
    verifyBtn.disabled = false;
    if (!res || !pending) return;

    const d = res.data || {};
    if (res.status === "Success") {
      if (pending.mode === "verify-email") {
        currentUser.emailVerified = true;
        persistCurrentUser();
        syncVerifyEmailBadge();
        pending = null;
        closeModal();
        toast(res.message || "Email verified successfully! ✅", "ok");
        if (typeof loadNotificationsFromServer === "function") loadNotificationsFromServer();
      } else if (d.done === false) {
        pending.stage = 2;
        pending.sentTo = d.sentTo || "your new email";
        renderStage();
        startCooldown(d.resendInSec);
        otpInput.focus();
      } else {
        finishProfileSave(d, res.message);
      }
    } else if (d.restart) {
      dropPending(res.message);
    } else {
      setMsg(res.message || "That code didn't work.", "error");
      otpInput.select();
    }
  }

  function finishProfileSave(d, message) {
    const saved = d.profile || {};
    IDS.forEach(function (id) {
      const key = FIELDS[id];
      if (pending.changes[key] === undefined) return;
      currentUser[key] = saved[key] !== undefined ? saved[key] : pending.changes[key];
      $(id).value = currentUser[key];
    });
    if (pending.changes.email) {
      currentUser.emailVerified = true;
      syncVerifyEmailBadge();
    }
    persistCurrentUser();

    if ($("dashboardUsername")) $("dashboardUsername").innerText = currentUser.name;
    if ($("profileUserName")) $("profileUserName").innerText = currentUser.name;
    if ($("userEmail")) $("userEmail").innerText = currentUser.email || "";

    pending = null;
    closeModal();
    snapshot();
    setEditMode(false);
    toast(message || "Changes saved.", "ok");
    if (typeof loadNotificationsFromServer === "function") loadNotificationsFromServer();
  }

  function dropPending(message) {
    pending = null;
    closeModal();
    toast(message || "That request expired. Try again.", "error");
  }

  async function onResend() {
    if (!pending || busy || resendBtn.disabled) return;

    busy = true;
    const actionName = pending.mode === "verify-email" ? "requestEmailVerification" : "resendProfileChangeOtp";
    const res = await sendToBackend(actionName, { token: currentUser.token });
    busy = false;
    if (!res || !pending) return;

    const d = res.data || {};
    if (res.status === "Success") {
      otpInput.value = "";
      setMsg("New code sent.", "ok");
      startCooldown(d.resendInSec || 60);
      otpInput.focus();
    } else if (d.restart) {
      dropPending(res.message);
    } else {
      const wait = /Wait (\d+) seconds/.exec(res.message || "");
      if (wait) startCooldown(Number(wait[1]));
      setMsg(res.message || "We couldn't send a new code. Try again in a moment.", "error");
    }
  }

  function onCancel() {
    if (busy || !pending) return;
    const mode = pending.mode;
    pending = null;
    closeModal();
    if (mode === "profile") {
      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "cancelProfileChange", data: { token: currentUser.token } })
      }).catch(function () {});
    }
    toast("Cancelled.");
  }

  saveBtn.addEventListener("click", onSave);
  verifyBtn.addEventListener("click", onVerify);
  resendBtn.addEventListener("click", onResend);
  cancelBtn.addEventListener("click", onCancel);

  otpInput.addEventListener("input", function () {
    otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);
    setMsg("");
  });
  otpInput.addEventListener("keydown", function (e) { if (e.key === "Enter") onVerify(); });

  /* ---------- Change Password Modal (Profile & Settings) ---------- */
  const pwdOverlay = document.createElement("div");
  pwdOverlay.className = "otp-overlay";
  pwdOverlay.setAttribute("role", "dialog");
  pwdOverlay.setAttribute("aria-modal", "true");
  pwdOverlay.innerHTML = `
    <div class="otp-card">
      <h2>🔑 Change Password</h2>
      <p class="otp-sub">Enter your current password and choose a new password.</p>
      <div class="pwd-field-group">
        <label for="curPwdInput">Current Password</label>
        <input type="password" id="curPwdInput" placeholder="Enter current password">
      </div>
      <div class="pwd-field-group">
        <label for="newPwdInput">New Password</label>
        <input type="password" id="newPwdInput" placeholder="At least 6 characters">
      </div>
      <div class="pwd-field-group">
        <label for="confirmPwdInput">Confirm New Password</label>
        <input type="password" id="confirmPwdInput" placeholder="Re-enter new password">
      </div>
      <div class="otp-msg" id="pwdMsg" role="alert"></div>
      <button type="button" class="primary" id="submitPwdChange">Update Password</button>
      <div class="otp-links">
        <button type="button" class="link-btn" id="forgotPwdResetBtn">Forgot password? Email reset link</button>
        <button type="button" class="link-btn" id="closePwdModalBtn">Cancel</button>
      </div>
    </div>`;
  document.body.appendChild(pwdOverlay);

  const curPwdInput = $("curPwdInput"), newPwdInput = $("newPwdInput"), confirmPwdInput = $("confirmPwdInput"),
        pwdMsg = $("pwdMsg"), submitPwdBtn = $("submitPwdChange"), forgotPwdBtn = $("forgotPwdResetBtn"),
        closePwdBtn = $("closePwdModalBtn");

  function setPwdMsg(text, kind) {
    pwdMsg.textContent = text || "";
    pwdMsg.className = "otp-msg" + (kind ? " " + kind : "");
  }

  function openPasswordModal() {
    curPwdInput.value = "";
    newPwdInput.value = "";
    confirmPwdInput.value = "";
    setPwdMsg("");
    pwdOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
    setTimeout(function () { curPwdInput.focus(); }, 60);
  }

  function closePasswordModal() {
    pwdOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  async function onSubmitPasswordChange() {
    if (busy) return;
    const curPwd = curPwdInput.value;
    const newPwd = newPwdInput.value;
    const confPwd = confirmPwdInput.value;

    if (!curPwd || !newPwd || !confPwd) {
      setPwdMsg("Please fill in all password fields.", "error");
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg("New password must be at least 6 characters.", "error");
      return;
    }
    if (newPwd !== confPwd) {
      setPwdMsg("New passwords do not match.", "error");
      return;
    }
    if (curPwd === newPwd) {
      setPwdMsg("New password must be different from your current password.", "error");
      return;
    }

    busy = true;
    submitPwdBtn.disabled = true;
    const res = await sendToBackend("changeUserPassword", {
      token: currentUser.token,
      currentPassword: curPwd,
      newPassword: newPwd
    });
    busy = false;
    submitPwdBtn.disabled = false;

    if (!res) return;
    if (res.status === "Success") {
      closePasswordModal();
      toast(res.message || "Password updated successfully! 🔐", "ok");
      if (typeof loadNotificationsFromServer === "function") loadNotificationsFromServer();
    } else {
      setPwdMsg(res.message || "Failed to update password.", "error");
    }
  }

  async function onForgotPasswordLink() {
    if (busy) return;
    if (!currentUser || !currentUser.email) {
      setPwdMsg("No email found on your account.", "error");
      return;
    }
    busy = true;
    forgotPwdBtn.disabled = true;
    const res = await sendToBackend("resetPassword", { email: currentUser.email });
    busy = false;
    forgotPwdBtn.disabled = false;

    if (!res) return;
    if (res.status === "Success") {
      closePasswordModal();
      toast("Reset link sent to " + currentUser.email + " 📧", "ok");
    } else {
      setPwdMsg(res.message || "Could not send reset link.", "error");
    }
  }

  submitPwdBtn.addEventListener("click", onSubmitPasswordChange);
  forgotPwdBtn.addEventListener("click", onForgotPasswordLink);
  closePwdBtn.addEventListener("click", closePasswordModal);

  if ($("profileChangePassword")) $("profileChangePassword").onclick = openPasswordModal;
  if ($("settingsChangePassword")) $("settingsChangePassword").onclick = openPasswordModal;

  // Connect Settings -> Change Email / Change Mobile shortcuts to Profile Edit mode
  if ($("changeEmail")) {
    $("changeEmail").onclick = function () {
      openPage("profile");
      setEditMode(true);
      setTimeout(function () { $("email").focus(); }, 100);
    };
  }
  if ($("changeMobile")) {
    $("changeMobile").onclick = function () {
      openPage("profile");
      setEditMode(true);
      setTimeout(function () { $("mobile").focus(); }, 100);
    };
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (overlay.classList.contains("show")) onCancel();
      if (pwdOverlay.classList.contains("show")) closePasswordModal();
    }
  });

  /* ---------- Initialize ---------- */
  snapshot();
  setEditMode(false);
  syncVerifyEmailBadge();
})();
/*===================== END PROFILE SECURITY =====================*/
