/*=====================================
      API ENDPOINT
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbz3j7pEIhMfam_dVATTNJe6rHAaMNUAz55ywLqEj4XDJ5qb6hygrvGQQfSj2x1KLtRM/exec";



/*=====================================
        LOGIN CHECK
=====================================*/
if(localStorage.getItem("isLoggedIn")!=="true"){

window.location.href="login.html";

}

/*=====================================
      CANVAS PARTICLE HEART LOADER
=====================================*/
const loaderCanvas = document.getElementById('loaderCanvas');
let loaderAnimId;

if (loaderCanvas) {
    const ctx = loaderCanvas.getContext('2d');
    const cw = loaderCanvas.width = 300;
    const ch = loaderCanvas.height = 300;
    const cx = cw / 2;
    const cy = ch / 2 - 20;

    // --- Dynamic Name Logic ---
    const loggedInUser = ""; // e.g., "Sarah"
    const nameEl = document.getElementById('loaderName');
    if (nameEl) {
        nameEl.textContent = loggedInUser ? loggedInUser : "Loading...";
    }

    const HEART_RES = 256;
    const hpx = new Float32Array(HEART_RES);
    const hpy = new Float32Array(HEART_RES);

    // Generate mathematical heart boundaries
    for (let i = 0; i < HEART_RES; i++) {
        const t = (i / HEART_RES) * Math.PI * 2;
        hpx[i] = 16 * Math.pow(Math.sin(t), 3);
        hpy[i] = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    }

    const N = 350; 
    const particles = [];
    const colors = ['#ff4d8d', '#4740ff', '#ff1493', '#ff84b7', '#ffb3d9', '#ff40a8']; 

    // Start particles from center
    for (let i = 0; i < N; i++) {
        particles.push({
            x: cx, 
            y: cy, 
            vx: (Math.random() - 0.5) * 15, 
            vy: (Math.random() - 0.5) * 15, 
            size: Math.random() * 1.2 + 0.8,
            targetIndex: (i * 7) % HEART_RES,
            color: colors[Math.floor(Math.random() * colors.length)],
            offsetT: Math.random() * Math.PI * 2
        });
    }

    function animateLoader(time) {
        // Transparent trail trick
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(0, 0, cw, ch);

        // Switch to glowing blend mode for particles
        ctx.globalCompositeOperation = 'lighter';

        const cycle = (time * 0.0013) % 1;
        let pulse = 0;
        if (cycle < 0.12) pulse = Math.sin((cycle / 0.12) * Math.PI);
        else if (cycle > 0.18 && cycle < 0.35) pulse = 0.5 * Math.sin(((cycle - 0.18) / 0.17) * Math.PI);
        const hs = 2.25 * (1 + pulse * 0.15); 

        // The active index travels from 0 to 256 around the heart path
        // Adjust the "0.15" multiplier to change the speed of the traveling light
        const activeIndex = (time * 0.10) % HEART_RES; 

        for (let i = 0; i < N; i++) {
            let p = particles[i];
            let tx = cx + hpx[p.targetIndex] * hs;
            let ty = cy + hpy[p.targetIndex] * hs;

            p.vx += (tx - p.x) * 0.08; 
            p.vy += (ty - p.y) * 0.08;
            
            p.vx += Math.sin(time * 0.002 + p.offsetT) * 0.03;
            p.vy += Math.cos(time * 0.002 + p.offsetT) * 0.03;

            p.vx *= 0.75; 
            p.vy *= 0.75;

            p.x += p.vx;
            p.y += p.vy;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

            // Calculate how close this particle is to the traveling light
            let diff = (activeIndex - p.targetIndex + HEART_RES) % HEART_RES;

            // If the particle is within 25 steps behind the active light index, illuminate it!
            if (diff < 25) {
                // Fades out from 1 at the head, to 0 at the tail
                const intensity = 1 - (diff / 25); 
                
                ctx.fillStyle = '#ff4d8d '; // White core for the light
                ctx.shadowBlur = 15 * intensity; 
                ctx.shadowColor = '#ff4d8d'; // Main pink glow
                ctx.fill();
                
                ctx.shadowBlur = 0; // Reset for other particles
            } else {
                // Draw normal unlit particle
                ctx.fillStyle = p.color;
                ctx.fill();
            }
        }

        loaderAnimId = requestAnimationFrame(animateLoader);
    }
    loaderAnimId = requestAnimationFrame(animateLoader);
}

/*=====================================
        HIDE LOADER ON LOAD
=====================================*/
window.addEventListener("load", () => {
    const loader = document.getElementById("pageLoader");
    if (loader) {
        setTimeout(() => {
            loader.classList.add("fade-out");
            setTimeout(() => {
                loader.remove();
                if (loaderAnimId) cancelAnimationFrame(loaderAnimId); 
            }, 600); 
        }, 2000); 
    }
    
});






/*=====================================
      LOAD USER
=====================================*/

let currentUser = JSON.parse(localStorage.getItem("currentUser"));

if(currentUser){

    // NEW: Check the login flag and change the greeting
    if(document.getElementById("welcomeGreeting")){
        if(localStorage.getItem("isNewLogin") === "true"){
            document.getElementById("welcomeGreeting").innerText = "Welcome,";
        } else {
            document.getElementById("welcomeGreeting").innerText = "Welcome Back,";
        }
    }

if(document.getElementById("userId")) {
    document.getElementById("userId").value = currentUser.id; 
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

    if(document.getElementById("dob"))
        document.getElementById("dob").value=currentUser.dob || "";

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

/*=====================================
      FLOATING HEARTS
=====================================*/

const hearts=document.querySelector(".hearts");

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


/*=====================================
      LOAD CAMPAIGNS
=====================================*/
const messagesList = document.getElementById("messagesList");

const campaignContainer =
document.getElementById("campaignContainer");

let campaigns = [];

const donations =
JSON.parse(localStorage.getItem("donations")) || [];

loadCampaigns();

async function loadCampaigns(){

if(!campaignContainer) return;

campaignContainer.innerHTML=`
<div class="glass" style="padding:30px;text-align:center;">
<p>Loading live campaigns... ⏳</p>
</div>`;

try {
    const response = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "getUserCampaigns",
            data: { userId: currentUser.id || currentUser.userId }
        })
    });
    const result = await response.json();

    if(result.status === "Success") {
        // Map DB fields back to your legacy format so Analytics/Stats don't break
        campaigns = result.data.map(c => ({
            ...c,
            target: c.targetAmount,
            raised: c.raisedAmount,
            donors: c.donorsCount,
            image: c.giftImageUrl
        }));
        
        campaignContainer.innerHTML="";

        if(campaigns.length===0){
            campaignContainer.innerHTML=`
            <div class="glass" style="padding:30px;text-align:center;">
            <h3>No Campaigns Yet ❤️</h3>
            <p>Create your first campaign.</p>
            </div>`;
            updateDashboardStats();
            return;
        }
        
        campaigns.forEach((campaign,index)=>{
            let percent = campaign.target > 0 ? Math.round((campaign.raised / campaign.target) * 100) : 0;
            if(percent > 100) percent = 100;
            
            campaignContainer.innerHTML+=`
            <div class="campaign-card">
            <img src="${campaign.image || 'images/default.jpg'}" alt="Campaign">
            <div class="campaign-info">
            <h3>${campaign.gift}</h3>
            <p>For ${campaign.receiver} ❤️</p>
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
        
        // Update surrounding UI elements now that data has arrived
        updateDashboardStats();
        if(typeof loadProfileStats === 'function') loadProfileStats();
        if(typeof loadCampaignListForAnalytics === 'function') loadCampaignListForAnalytics();

    } else {
        campaignContainer.innerHTML=`<div class="glass" style="padding:30px;text-align:center;"><p>❌ ${result.message}</p></div>`;
    }
} catch (error) {
    campaignContainer.innerHTML=`<div class="glass" style="padding:30px;text-align:center;"><p>❌ Network Error.</p></div>`;
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
        body: JSON.stringify({
            action: "deleteCampaign",
            data: { campaignId: campaignId, userId: currentUser.id || currentUser.userId }
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
    
    // Save the data and the exact ID
    localStorage.setItem("newCampaign", JSON.stringify(campaignToEdit));
    localStorage.setItem("editingId", campaignId); 
    
    // 🌟 THE FIX: Reset the 6-hour timer right now!
    localStorage.setItem("draftTime", Date.now());
    
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

// payment verification


function loadPendingPayments(){

if(!paymentList) return;

paymentList.innerHTML="";

const currentUser =
JSON.parse(localStorage.getItem("currentUser"));

const pendingDonations = donations.filter(d=>{

const campaign = campaigns.find(c=>

(c.campaignId||"")===

(d.campaignId||d.campaign)

);

return campaign &&
campaign.ownerId===currentUser.userId &&
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

const url=

window.location.origin+

"/campaign.html?id="+campaignId;

if(navigator.share){

navigator.share({

title:c.gift,

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
      SAVE PROFILE
=====================================*/

const saveProfileBtn=
document.getElementById("saveProfile");

if(saveProfileBtn){

saveProfileBtn.onclick=saveProfile;

}

function saveProfile(){

currentUser.name=
document.getElementById("fullName").value.trim();

currentUser.email=
document.getElementById("email").value.trim();

currentUser.mobile=
document.getElementById("mobile").value.trim();

currentUser.dob=
document.getElementById("dob").value;

currentUser.gender=
document.getElementById("gender").value;

currentUser.bio=
document.getElementById("bio").value.trim();

/* Validation */

if(currentUser.name===""){

alert("Please enter your name.");

return;

}

if(currentUser.email===""){

alert("Please enter your email.");

return;

}

/* Save */

localStorage.setItem(

"currentUser",

JSON.stringify(currentUser)

);

/* Refresh UI */

if(document.getElementById("dashboardUsername")){

document.getElementById(

"dashboardUsername"

).innerText=currentUser.name;

}

if(document.getElementById("profileUserName")){

document.getElementById(

"profileUserName"

).innerText=currentUser.name;

}

if(document.getElementById("userEmail")){

document.getElementById(

"userEmail"

).innerText=currentUser.email;

}

alert(

"Profile updated successfully ❤️"

);

}

/*=====================================
      EDIT PROFILE
=====================================*/

const editProfileBtn=
document.getElementById("editProfile");

if(editProfileBtn){

editProfileBtn.onclick=()=>{

openPage("profile");

};

}

/*=====================================
      CHANGE PASSWORD
=====================================*/

const profilePassword=

document.getElementById(

"profileChangePassword"

);

if(profilePassword){

profilePassword.onclick=()=>{

alert(

"This will be connected to Google Apps Script."

);

};

}

const settingsPassword=

document.getElementById(

"settingsChangePassword"

);

if(settingsPassword){

settingsPassword.onclick=()=>{

alert(

"This will be connected to Google Apps Script."

);

};

}

/*=====================================
      VERIFY EMAIL
=====================================*/

const verifyEmail=

document.getElementById(

"verifyEmail"

);

if(verifyEmail){

verifyEmail.onclick=()=>{

alert(

"Email verification module will be added after Apps Script integration."

);

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
      CHANGE EMAIL
=====================================*/

const changeEmail=

document.getElementById(

"changeEmail"

);

if(changeEmail){

changeEmail.onclick=()=>{

alert(

"Change Email will be handled by Google Apps Script."

);

};

}

/*=====================================
      CHANGE MOBILE
=====================================*/

const changeMobile=

document.getElementById(

"changeMobile"

);

if(changeMobile){

changeMobile.onclick=()=>{

alert(

"Change Mobile will be handled by Google Apps Script."

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

function deleteAccount(){

const confirmDelete=confirm(

"Delete your GiftBloom account permanently?"

);

if(!confirmDelete){

return;

}

alert(

"This feature will be enabled after Google Apps Script integration."

);

/*

Future:

Delete User

Delete Campaigns

Delete Donations

Delete Images

Destroy Session

*/

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
      PRIVACY
=====================================*/

document

.querySelectorAll(

'input[name="privacy"]'

)

.forEach(radio=>{

radio.onchange=()=>{

console.log(

"Privacy:",

radio.value

);

};

});

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

function logout(){

if(confirm("Logout from GiftBloom?")){

localStorage.removeItem("isLoggedIn");
localStorage.removeItem("currentUser");

window.location.href="login.html";

}

}

document.getElementById("logoutBtn").onclick=(e)=>{
e.preventDefault();
logout();
};

if(document.getElementById("profileLogout")){
document.getElementById("profileLogout").onclick=logout;
}

if(document.getElementById("settingsLogout")){
document.getElementById("settingsLogout").onclick=logout;
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

menu.classList.remove("show");

});

});

/*=====================================
      KEYBOARD SHORTCUTS
=====================================*/

document.addEventListener(

"keydown",

(e)=>{

if(e.key==="Escape"){

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
      NOTIFICATIONS
=====================================*/

let notifications=

JSON.parse(
localStorage.getItem("notifications")
)||[

{

type:"donation",

title:"New Donation ❤️",

message:"Rahul donated ₹500 to your campaign.",

time:"2 min ago",

read:false,

icon:"💰"

},

{

type:"campaign",

title:"Campaign Approved",

message:"Your campaign is now live.",

time:"1 hour ago",

read:false,

icon:"🎉"

},

{

type:"system",

title:"Welcome",

message:"Welcome to GiftBloom.",

time:"Yesterday",

read:true,

icon:"🌸"

}

];

const list=
document.getElementById("notificationList");

function loadNotifications(filter="all"){

list.innerHTML="";

let data=notifications;

if(filter==="unread"){

data=
notifications.filter(n=>!n.read);

}

if(filter==="donation"){

data=
notifications.filter(n=>n.type==="donation");

}

if(filter==="campaign"){

data=
notifications.filter(n=>n.type==="campaign");

}

if(filter==="system"){

data=
notifications.filter(n=>n.type==="system");

}

if(data.length===0){

list.innerHTML=`

<div class="empty">

No notifications found ❤️

</div>

`;

return;

}

data.forEach((item,index)=>{

list.innerHTML+=`

<div class="notification-item
${item.read?"":"unread"}">

<div class="icon">

${item.icon}

</div>

<div class="content">

<h3>

${item.title}

</h3>

<p>

${item.message}

</p>

<div class="time">

${item.time}

</div>

${item.read?"":`

<button
class="mark-read"
onclick="markRead(${notifications.indexOf(item)})">

Mark Read

</button>

`}

</div>

</div>

`;

});

}

loadNotifications();

/*=====================================
      FILTER
=====================================*/

document
.querySelectorAll(".filter")
.forEach(btn=>{

btn.onclick=()=>{

document
.querySelectorAll(".filter")
.forEach(b=>b.classList.remove("active"));

btn.classList.add("active");

loadNotifications(btn.dataset.filter);

};

});

/*=====================================
      MARK READ
=====================================*/

function markRead(index){

notifications[index].read=true;

localStorage.setItem(

"notifications",

JSON.stringify(notifications)

);

loadNotifications(

document.querySelector(".filter.active").dataset.filter

);

}

/*=====================================
      MARK ALL
=====================================*/

document
.getElementById("markAllRead")
.onclick=()=>{

notifications.forEach(n=>{

n.read=true;

});

localStorage.setItem(

"notifications",

JSON.stringify(notifications)

);

loadNotifications();

};

/*=====================================
      CLEAR ALL
=====================================*/

document
.getElementById("clearAll")
.onclick=()=>{

if(confirm("Clear all notifications?")){

notifications=[];

localStorage.setItem(

"notifications",

JSON.stringify(notifications)

);

loadNotifications();

}

};



const copyBtn = document.getElementById("copyUserId");

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(
        document.getElementById("userId").value
    );

    copyBtn.innerHTML = "✅";

    setTimeout(() => {
        copyBtn.innerHTML = "📋";
    }, 1500);
});


const paymentHistoryTable =
document.getElementById("paymentHistoryTable");

function loadPaymentHistory(){

if(!paymentHistoryTable) return;

paymentHistoryTable.innerHTML="";

const currentUser =
JSON.parse(localStorage.getItem("currentUser"));

const history = donations.filter(d=>{

const campaign = campaigns.find(c=>

(c.campaignId||"")===(d.campaignId||d.campaign)

);

return campaign &&
campaign.ownerId===currentUser.userId;

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

document.getElementById("paymentHistoryFilter")
.onchange=function(){

const filter=this.value.toLowerCase();

Array.from(paymentHistoryTable.rows)
.forEach(row=>{

if(filter==="all"){

row.style.display="";

return;

}

const status=row.cells[5].innerText.toLowerCase();

row.style.display=

status.includes(filter)

? ""

: "none";

});

};

/*=====================================
        LOAD DONOR MESSAGES
=====================================*/

function loadMessages() {
    if(!messagesList) return;
    messagesList.innerHTML = "";

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Filter donations: Must belong to current user AND have a message
    const userMessages = donations.filter(d => {
        const campaign = campaigns.find(c => (c.campaignId || "") === (d.campaignId || d.campaign));
        
        // Check if user owns campaign AND if a message exists (and isn't just empty spaces)
        return campaign && 
               campaign.ownerId === currentUser.userId && 
               d.message && 
               d.message.trim() !== "";
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
        const campaignName = msg.campaignName || msg.campaignId || "Your Campaign"; 
        
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
        campaignSelect.innerHTML += `<option value="${c.campaignId}">${c.gift} (For ${c.receiver})</option>`;
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
    document.getElementById("totalRaised").innerText = "₹" + raised;
    document.getElementById("totalDonors").innerText = donors;
    document.getElementById("totalViews").innerText = views;
    document.getElementById("progressPercent").innerText = progress + "%";

    // Update Progress Bar
    document.getElementById("raisedText").innerText = "Raised ₹" + raised;
    document.getElementById("targetText").innerText = "Target ₹" + target;
    const progressFill = document.getElementById("progressFill");
    if(progressFill) progressFill.style.width = progress + "%";

    // Update Summaries
    document.getElementById("todayDonation").innerText = "₹" + (c.todayDonation || 0);
    document.getElementById("weekDonation").innerText = "₹" + (c.weekDonation || 0);
    document.getElementById("monthDonation").innerText = "₹" + (c.monthDonation || raised);

    // Update Insights
    document.getElementById("viewCount").innerText = views;
    document.getElementById("shareCount").innerText = shares;
    document.getElementById("likeCount").innerText = likes;

    let conversion = views > 0 ? ((donors / views) * 100).toFixed(1) : 0;
    document.getElementById("conversionRate").innerText = conversion + "%";
    document.getElementById("campaignStatus").innerText = c.status || "Active";

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

    // Render Expenses (Handles both old and new data structures)
    const expenseBox = document.getElementById("expenseList");
    if(expenseBox){
        expenseBox.innerHTML = "";
        if(c.expenses && c.expenses.length){
            c.expenses.forEach(e => {
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

refreshDashboard();

loadPendingPayments();

console.log(
"GiftBloom Dashboard Loaded ❤️"
);

}

initializeDashboard();

