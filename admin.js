/*======== GLOBAL API CONFIG ========*/
const API_URL = "https://script.google.com/macros/s/AKfycbxyVajhdo-ZT_N5px_hqM2fFWNqpAu3yw6YRZDhK0_3jQ_eLdzKYhnvyfeQyxuGP_jS/exec"; 

if (localStorage.getItem("adminLogin") !== "true" || !localStorage.getItem("adminToken")) {
    window.location.href = "login.html";
}

// Universal Helper Function for all database calls
async function fetchAPI(action, data = {}) {
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: action, data: data })
        });
        return await response.json();
    } catch (error) {
        console.error(`Error in ${action}:`, error);
        return { status: "Error", message: "Network connection failed." };
    }
}

/*======== GLOBAL STATE VARIABLES ========*/
let users = [];
let campaigns = [];
let donations = [];
let reports = [];

// Less critical items can stay in localStorage for now, or be migrated later
let notifications = JSON.parse(localStorage.getItem("notifications")) || [];
let paymentHistory = JSON.parse(localStorage.getItem("paymentHistory")) || [];

const pageState = {
    users: 1, campaigns: 1, donations: 1,
    reports: 1, emails: 1, payments: 1, notifications: 1
};

/*======== FETCH ALL DASHBOARD DATA ========*/
async function loadAllAdminData() {
    console.log("Fetching live data from database...");
    
   const result = await fetchAPI("getAdminDashboardData", { token: localStorage.getItem("adminToken") });
   
    if (result.status === "Success") {
        users = result.data.users || [];
        campaigns = result.data.campaigns || [];
        donations = result.data.donations || [];
        reports = result.data.reports || [];

        // Now that we have the data, render the UI
        refreshDashboard();
    } else {
        alert("Failed to load dashboard data: " + result.message);
    }
}

// Trigger this when the page loads
document.addEventListener("DOMContentLoaded", () => {
    loadAllAdminData();
});


/*=====================================
        DASHBOARD
=====================================*/

function loadDashboard(){

document.getElementById("totalUsers").innerText =
users.length;

document.getElementById("totalCampaigns").innerText =
campaigns.length;

const totalRaised =
donations
.filter(d=>d.status==="Verified")
.reduce((sum,d)=>sum+Number(d.amount||0),0);

document.getElementById("totalDonations").innerText =
"₹"+totalRaised;

const pending =
donations.filter(
d=>d.status==="Pending"
).length;

document.getElementById("pendingVerification").innerText =
pending;

}

loadDashboard();

/*=====================================
        RECENT ACTIVITY (FIXED)
=====================================*/
function loadActivity(){
    const list = document.getElementById("activityList");
    if(!list) return;
    list.innerHTML="";

    const activity=[];

    // FIX: Look for c.gift instead of c.giftName
    campaigns.slice(-3).forEach(c=>{
        activity.push("❤️ Campaign created : " + (c.gift || c.giftName || "Untitled"));
    });

    donations.slice(-3).forEach(d=>{
        activity.push("💰 Donation ₹" + (d.amount || 0));
    });

    // FIX: Look for u.name instead of u.fullName
    users.slice(-3).forEach(u=>{
        activity.push("👤 New User : " + (u.name || u.fullName || "Anonymous"));
    });

    activity.reverse();

    activity.forEach(text=>{
        const div=document.createElement("div");
        div.className="activity";
        div.innerHTML=text;
        list.appendChild(div);
    });
}
loadActivity();

/*=====================================
        QUICK ACTIONS
=====================================*/

document.getElementById("viewUsers").onclick=()=>{

document
.getElementById("usersSection")
.scrollIntoView({

behavior:"smooth"

});

};

document.getElementById("viewCampaigns").onclick=()=>{

document
.getElementById("campaignSection")
.scrollIntoView({

behavior:"smooth"

});

};

document.getElementById("viewPending").onclick=()=>{

document
.getElementById("donationSection")
.scrollIntoView({

behavior:"smooth"

});

};

document.getElementById("sendEmail").onclick=()=>{

document
.getElementById("emailSection")
.scrollIntoView({

behavior:"smooth"

});

};

/*=====================================
    USERS WITH PAGINATION (FIXED)
=====================================*/
// Helper function to format the date and time perfectly
function formatJoinDate(dateString) {
    if (!dateString) return "-";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // Fallback if format is unrecognized

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');

    // Returns date on top, time underneath in a slightly faded color for a clean UI
    return `${dd}/${mm}/${yyyy}<br><span style="font-size: 0.85em; color: #666;">${hh}:${min}:${ss}</span>`;
}

/*=====================================
    USERS WITH PAGINATION & DATE FIX
=====================================*/

// Helper function to format the date and time perfectly
function formatJoinDate(dateString) {
    if (!dateString) return "-";
    
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString; // Fallback if unrecognized

    // Format Date: DD/MM/YYYY
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    
    // Format Time: HH:MM AM/PM
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strTime = hours + ':' + minutes + ' ' + ampm;

    // Returns date on top, time underneath in a slightly faded color
    return `<div style="text-align: center;">
                <span style="font-weight: 600; color: #333;">${dd}/${mm}/${yyyy}</span><br>
                <span style="font-size: 0.85em; color: #ff4d8d;">${strTime}</span>
            </div>`;
}


/*=====================================
        CLOSE POPUP
=====================================*/

document
.querySelector(".closePopup")
.onclick=()=>{

document
.getElementById("userPopup")
.classList.add("hidden");

};

/*=====================================
        CLOSE CAMPAIGN POPUP (FIXED)
=====================================*/
const closeCampPopupBtn = document.querySelector(".closeCampaignPopup");
if (closeCampPopupBtn) {
    closeCampPopupBtn.onclick = () => {
        document.getElementById("campaignPopup").classList.add("hidden");
    };
}

/*=====================================
        HIDE CAMPAIGN LOGIC
=====================================*/
async function hideCampaign(index) {
    if (!campaigns[index]) return;
    
    const campaign = campaigns[index];
    const newStatus = campaign.status === "Hidden" ? "Active" : "Hidden";
    
    // 1. Tell backend to update status
    const response = await fetchAPI("updateCampaignStatus", { 
    campaignId: campaign.campaignId, status: newStatus, token: localStorage.getItem("adminToken")
});

    // 2. Update UI if successful
    if (response.status === "Success") {
        campaigns[index].status = newStatus;
        alert(newStatus === "Hidden" ? "🙈 Campaign Hidden!" : "👁 Campaign Unhidden!");
        loadCampaigns();
    } else {
        alert("Error: " + response.message);
    }
}

/*=====================================
        DELETE CAMPAIGN
=====================================*/
async function deleteCampaign(index) {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    const campaignId = campaigns[index].campaignId;
    
const response = await fetchAPI("deleteCampaign", { campaignId: campaignId, token: localStorage.getItem("adminToken") });

    if (response.status === "Success") {
        campaigns[index].status = "Deleted";
        campaigns.splice(index, 1);
        loadCampaigns();
        loadDashboard();
        alert("Campaign deleted.");
    } else {
        alert("Error: " + response.message);
    }
}

/*=====================================
        EMAIL USER
=====================================*/
function emailUser(index){
    const user = users[index];

    document.getElementById("receiverId").value = user.email;
    document.getElementById("emailSection").scrollIntoView({
        behavior:"smooth"
    });
}

/*=====================================
        SUSPEND USER
=====================================*/
async function suspendUser(index) {
    if(!confirm("Suspend this user?")) return;
    
    const userId = users[index].userId || users[index].id;
    users[index].status = "Suspended"; 
    loadUsers(); // Optimistic UI update
    
    // Tell the backend to update the database
    await fetchAPI("updateUserStatus", { userId: userId, status: "Suspended", token: localStorage.getItem("adminToken") });
}

/*=====================================
        DELETE USER
=====================================*/
async function deleteUser(index) {
    if (!confirm("Delete this user permanently?")) return;

    const userToDelete = users[index];

    // 1. Tell backend to delete
const response = await fetchAPI("deleteUser", { userId: userToDelete.userId || userToDelete.id, token: localStorage.getItem("adminToken") });

    // 2. Update UI if successful
    if (response.status === "Success") {
        users.splice(index, 1); // Remove from local array
        loadUsers();
        loadDashboard();
        alert("User deleted successfully.");
    } else {
        alert("Error: " + response.message);
    }
}
/*=====================================
        SEARCH USER
=====================================*/

document
.getElementById("userSearch")
.addEventListener("input",function(){

const keyword=
this.value.toLowerCase();

Array.from(userTable.rows).forEach(row=>{

const text=
row.innerText.toLowerCase();

row.style.display=
text.includes(keyword)
? ""
: "none";

});

});

/*=====================================
        FILTER USER
=====================================*/

document
.getElementById("userFilter")
.onchange=function(){

const filter=
this.value.toLowerCase();

Array.from(userTable.rows).forEach(row=>{

if(filter==="all"){

row.style.display="";

return;

}

const status=
row.cells[5].innerText
.toLowerCase();

row.style.display=
status.includes(filter)
? ""
: "none";

});

};

/*=====================================
    CAMPAIGN MANAGEMENT (WITH PAGINATION)
=====================================*/
function loadCampaigns() {
    const campaignTable = document.getElementById("campaignTable");
    if (!campaignTable) return;
    campaignTable.innerHTML = "";

    const term = document.getElementById("campaignSearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("campaignFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("campaignLimit")?.value || "5");

    let filtered = campaigns.map((c, i) => ({ data: c, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        const matchesSearch = text.includes(term);
        const matchesFilter = filterStatus === "all" || (obj.data.status || "active").toLowerCase().includes(filterStatus);
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.campaigns > totalPages) pageState.campaigns = totalPages;
    if (pageState.campaigns < 1) pageState.campaigns = 1;

    const start = (pageState.campaigns - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

      paginated.forEach(obj => {
        const campaign = obj.data;
        const index = obj.originalIndex;
        
        const raised = Number(campaign.raised || 0);
        const goal = Number(campaign.goal || campaign.target || 0); 
        const status = campaign.status || "Active";

        const campaignOwner = campaign.ownerId || campaign.creator || campaign.email || "-";

        // 🌟 THE FIX: Dynamically check the status to set the button text and icon
        const hideBtnText = status === "Hidden" ? "👁 Show" : "🙈 Hide";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${campaign.campaignId || "-"}</td>
            <td>${campaign.giftName || campaign.gift || "-"}</td>
            <td>${campaignOwner}</td>
            <td>₹${raised}</td>
            <td>₹${goal}</td>
            <td><span class="status ${status.toLowerCase()}">${status}</span></td>
            <td>
                <div class="table-actions">
                    <button onclick="viewCampaign(${index})">👁 View</button>
                    <button onclick="window.location.href='campaigns.html?id=${index}'">Details</button>
                    
                    <!-- 🌟 Inject the dynamic button text here -->
                    <button onclick="hideCampaign(${index})">${hideBtnText}</button>
                    
                    <button onclick="deleteCampaign(${index})">🗑 Delete</button>
                </div>
            </td>
        `;
        campaignTable.appendChild(tr);
    });


    const pageInfo = document.getElementById("campaignPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.campaigns} of ${totalPages}`;
}

/*=====================================
        VIEW CAMPAIGN POPUP
=====================================*/
function viewCampaign(index){
    const campaign = campaigns[index];

    // Safely populate the popup
    document.getElementById("campaignPopupId").innerText = campaign.campaignId || "-";
    document.getElementById("campaignPopupOwner").innerText = campaign.ownerId || "-";
    document.getElementById("campaignPopupGift").innerText = campaign.giftName || campaign.gift || "-";
    document.getElementById("campaignPopupReceiver").innerText = campaign.receiverName || campaign.receiver || "-";
    document.getElementById("campaignPopupRaised").innerText = "₹" + (campaign.raised || 0);
    document.getElementById("campaignPopupGoal").innerText = "₹" + (campaign.goal || campaign.target || 0);
    
document.getElementById("campaignPopupDate").innerText = formatForDashboard(campaign.createdDate || campaign.date);

document.getElementById("campaignPopupStatus").innerText = campaign.status || "Active";

    // 🌟 LINK THE POPUP BUTTONS 🌟
    
    // 1. Approve Button
    const approveBtn = document.getElementById("approveCampaign");
    if(campaign.adminApproved) {
        approveBtn.innerHTML = "✅ Approved";
        approveBtn.disabled = true;
    } else {
        approveBtn.innerHTML = "✅ Approve";
        approveBtn.disabled = false;
        approveBtn.onclick = function() {
            campaigns[index].adminApproved = true;
            localStorage.setItem("myCampaigns", JSON.stringify(campaigns));
            alert("✅ Campaign Approved! A badge will now show on the public page.");
            document.getElementById("campaignPopup").classList.add("hidden");
            loadCampaigns(); // Refresh admin table
        };
    }

    // 2. Hide Button
    const hideBtn = document.getElementById("hideCampaignBtn");
    hideBtn.innerHTML = campaign.status === "Hidden" ? "👁 Show" : "🙈 Hide";
    hideBtn.onclick = function() {
        hideCampaign(index);
        document.getElementById("campaignPopup").classList.add("hidden");
    };

    // 3. Delete Button
    document.getElementById("deleteCampaignBtn").onclick = function() {
        deleteCampaign(index);
        document.getElementById("campaignPopup").classList.add("hidden");
    };

    document.getElementById("campaignPopup").classList.remove("hidden");
}

/*=====================================
        SEARCH
=====================================*/

document.getElementById("campaignSearch")
.addEventListener("input",function(){

const keyword=
this.value.toLowerCase();

Array.from(campaignTable.rows)
.forEach(row=>{

row.style.display=
row.innerText
.toLowerCase()
.includes(keyword)
?
""
:
"none";

});

});

/*=====================================
        FILTER
=====================================*/

document.getElementById("campaignFilter")
.onchange=function(){

const filter=
this.value.toLowerCase();

Array.from(campaignTable.rows)
.forEach(row=>{

if(filter==="all"){

row.style.display="";

return;

}

const status=
row.cells[5].innerText
.toLowerCase();

row.style.display=
status.includes(filter)
?
""
:
"none";

});

};


/*=====================================
        VIEW DONATION
=====================================*/
function viewDonation(index){
    const d = donations[index];
    const currentStatus = d.status || "Pending";

    document.getElementById("popupDonationId").innerText = d.id || "-";
    document.getElementById("popupTransactionId").innerText = d.transactionId || "Pending";
    document.getElementById("popupCampaignId").innerText = d.campaignId || d.campaign || "-";
    document.getElementById("popupOwnerId").innerText = d.ownerId || "-";
    document.getElementById("popupDonorId").innerText = d.userId || "-";
    document.getElementById("popupDonorName").innerText = d.name || "-";
    document.getElementById("popupDonorEmail").innerText = d.email || "-";
    document.getElementById("popupAmount").innerText = d.amount || 0;
    document.getElementById("popupMessage").value = d.message || "No message";
    document.getElementById("popupStatusDonation").innerText = currentStatus;

    // Target the buttons container inside the popup
    const buttonContainer = document.querySelector("#donationPopup .popup-buttons");

    if (currentStatus === "Pending") {
        // Render action buttons + email button for pending donations
        buttonContainer.innerHTML = `
            <button id="approveDonation">✅ Verify Payment</button>
            <button id="rejectDonationBtn">❌ Reject</button>
            <button id="mailDonor">📧 Email Donor</button>
        `;

        // Bind actions to the newly created buttons
        document.getElementById("approveDonation").onclick = function() {
            verifyDonation(index);
            document.getElementById("donationPopup").classList.add("hidden");
        };
        document.getElementById("rejectDonationBtn").onclick = function() {
            rejectDonation(index);
            document.getElementById("donationPopup").classList.add("hidden");
        };
    } else {
        // Render a status text highlight + email button for completed donations
        const statusColor = currentStatus === "Verified" ? "#0b8a38" : "#d60000";
        const statusBg = currentStatus === "Verified" ? "#d8ffe3" : "#ffe3e3";
        const icon = currentStatus === "Verified" ? "✅" : "❌";

        buttonContainer.innerHTML = `
            <div style="flex: 1; padding: 15px; border-radius: 16px; font-weight: 600; text-align: center; color: ${statusColor}; background: ${statusBg}; display: flex; align-items: center; justify-content: center;">
                ${icon} Payment ${currentStatus}
            </div>
            <button id="mailDonor">📧 Email Donor</button>
        `;
    }

    // The Email button is always present in both scenarios, so bind it here
    document.getElementById("mailDonor").onclick = function() {
        document.getElementById("donationPopup").classList.add("hidden");
        document.getElementById("receiverId").value = d.email || ""; 
        document.getElementById("emailSection").scrollIntoView({behavior: "smooth"});
    };

    document.getElementById("donationPopup").classList.remove("hidden");
}

/*=====================================
        CLOSE DONATION POPUP
=====================================*/

document.querySelector(".closeDonationPopup")
.onclick=()=>{

document.getElementById("donationPopup")
.classList.add("hidden");

};

/*=====================================
        VERIFY DONATION
=====================================*/
async function verifyDonation(index) {
    const donation = donations[index];
    if (donation.status === "Verified") {
        alert("Already verified.");
        return;
    }

    const transactionId = "GBTX" + Date.now().toString().slice(-8);

    // 1. Tell backend to verify this donation and add the funds to the campaign
    const response = await fetchAPI("verifyDonation", {
    donationId: donation.id,
    campaignId: donation.campaignId || donation.campaign,
    transactionId: transactionId,
    amount: donation.amount,
    token: localStorage.getItem("adminToken")
    });
    
    // 2. Update UI if successful
    if (response.status === "Success") {
        donation.status = "Verified";
        donation.transactionId = transactionId;
        
        // Update local campaign data to reflect the new total
        const campaign = campaigns.find(c => (c.campaignId || "") === (donation.campaignId || donation.campaign));
        if (campaign) {
            campaign.raised = Number(campaign.raised || 0) + Number(donation.amount || 0);
        }

        /* Save Payment History */
        paymentHistory.push({
            transactionId: transactionId,
            donationId: donation.id,
            campaignId: donation.campaignId || donation.campaign,
            ownerId: donation.ownerId || campaign?.ownerId || "-",
            donorId: donation.userId || "-",
            donorName: donation.name || "-",
            donorEmail: donation.email || "-",
            amount: donation.amount,
            message: donation.message || "",
            status: "Verified",
            verifiedBy: "Admin",
            date: new Date().toLocaleString()
        });

        /* Notification */
        notifications.push({
            title: "Donation Verified",
            message: "Donation " + transactionId + " verified successfully.",
            date: new Date().toLocaleString()
        });

        /* Save */
        localStorage.setItem("donations", JSON.stringify(donations));
        localStorage.setItem("myCampaigns", JSON.stringify(campaigns));
        localStorage.setItem("paymentHistory", JSON.stringify(paymentHistory));
        localStorage.setItem("notifications", JSON.stringify(notifications));

        /* Refresh */
        loadDashboard();
        loadDonations();
        loadCampaigns();
        loadPaymentHistory();

        /* Success */
        alert("✅ Donation Verified Successfully\n\nTransaction ID : " + transactionId);
    } else {
        alert("Error: " + response.message);
    }
}

/*=====================================
        REJECT DONATION
=====================================*/
async function rejectDonation(index) {
    if (!confirm("Reject donation?")) return;

    const donation = donations[index];

    const response = await fetchAPI("rejectDonation", { donationId: donation.id, token: localStorage.getItem("adminToken") });

    if (response.status === "Success") {
        donations[index].status = "Rejected";
        
        localStorage.setItem("donations", JSON.stringify(donations));
        
        loadDonations();
        loadDashboard();
        loadPaymentHistory();

        alert("❌ Donation Rejected Successfully.");
    } else {
        alert("Error: " + response.message);
    }
}

/*=====================================
    REPORT MANAGEMENT (WITH PAGINATION)
=====================================*/
function loadReports() {
    const reportTable = document.getElementById("reportTable");
    if (!reportTable) return;
    reportTable.innerHTML = "";

    const term = document.getElementById("reportSearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("reportFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("reportLimit")?.value || "5");

    // 1. Filter and keep the original index
    let filtered = reports.map((r, i) => ({ data: r, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        const matchesSearch = text.includes(term);
        const matchesFilter = filterStatus === "all" || (obj.data.status || "pending").toLowerCase().includes(filterStatus);
        return matchesSearch && matchesFilter;
    });

    // 2. Pagination Math
    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.reports > totalPages) pageState.reports = totalPages;
    if (pageState.reports < 1) pageState.reports = 1;

    const start = (pageState.reports - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    // 3. Render Table
        // Inside your loadReports() function...
    paginated.forEach(obj => {
        const report = obj.data;
        const index = obj.originalIndex; 
        
        const statusText = report.status || "Pending";
        
        const tr = document.createElement("tr");
        
        // 🌟 FIXED: Matched exactly to your HTML headers!
        // Headers: Report ID | Type | Reported By | Against | Reason | Status | Actions
        tr.innerHTML = `
            <td>${report.reportId || "-"}</td>
            <td>${report.type || "Campaign"}</td>
            <td>${report.reportedBy || "-"}</td>
            <td>${report.campaignId || "-"}</td>
            <td>${report.reason || "-"}</td>
            <td><span class="status ${statusText.toLowerCase()}">${statusText}</span></td>
            <td>
                <div class="table-actions">
                    <button onclick="viewReport(${index})">👁 View</button>
                    <button onclick="resolveReport(${index})">✅ Resolve</button>
                    <button onclick="deleteReport(${index})">🗑 Delete</button>
                </div>
            </td>
        `;
        reportTable.appendChild(tr);
    });

    const pageInfo = document.getElementById("reportPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.reports} of ${totalPages}`;
}

// 🌟 Connect the Search/Filter listeners to Pagination
document.getElementById("reportSearch")?.addEventListener("input", () => { pageState.reports = 1; loadReports(); });
document.getElementById("reportFilter")?.addEventListener("change", () => { pageState.reports = 1; loadReports(); });
document.getElementById("reportLimit")?.addEventListener("change", () => { pageState.reports = 1; loadReports(); });


/*=====================================
        VIEW REPORT POPUP
=====================================*/
function viewReport(index){
    const report = reports[index];

    // 1. Populate the popup text
    document.getElementById("popupReportId").innerText = report.reportId || "-";
    document.getElementById("popupReportType").innerText = report.type || "Campaign";
    document.getElementById("popupReporterId").innerText = report.reportedBy || "-";
    document.getElementById("popupAgainst").innerText = report.campaignId || "-";
    document.getElementById("popupReason").value = report.reason || "-";
    document.getElementById("popupReportDate").innerText = report.date || "-";
    document.getElementById("popupReportStatus").innerText = report.status || "Pending";
    
    // Load previously saved notes if they exist
    document.getElementById("adminNotes").value = report.adminNotes || "";

    // 2. CONNECT "RESOLVE" BUTTON
    document.getElementById("resolveBtn").onclick = function() {
        report.adminNotes = document.getElementById("adminNotes").value;
        resolveReport(index);
        document.getElementById("reportPopup").classList.add("hidden");
    };

    // 3. CONNECT "WARN USER" BUTTON
    document.getElementById("warnUser").onclick = function() {
        const note = document.getElementById("adminNotes").value.trim();
        if (note === "") {
            alert("Please write a message in the Admin Notes box first!");
            return;
        }

        // Send the note to the Email Queue
        emailHistory.push({
            receiver: report.reportedBy, 
            subject: "⚠ Warning regarding your GiftBloom account",
            body: "Admin Message: " + note,
            date: new Date().toLocaleString(),
            status: "Queued"
        });
        
        localStorage.setItem("emailHistory", JSON.stringify(emailHistory));
        loadEmailHistory(); // Refresh email table
        
        // Save the note to the report
        report.adminNotes = note;
        localStorage.setItem("reports", JSON.stringify(reports));
        
        alert("✅ Warning message sent to the Email Center!");
    };

    // 4. CONNECT "REMOVE CAMPAIGN" BUTTON
    document.getElementById("removeCampaign").onclick = function() {
        const campId = report.campaignId;
        
        if (confirm("Are you sure you want to permanently delete Campaign " + campId + "?")) {
            
            // Find the campaign in the master list and delete it
            const campIndex = campaigns.findIndex(c => c.campaignId === campId);
            if(campIndex !== -1) {
                campaigns.splice(campIndex, 1);
                localStorage.setItem("myCampaigns", JSON.stringify(campaigns));
                loadCampaigns();
                loadDashboard();
            }
            
            // Automatically resolve the report with a note
            report.adminNotes = "Campaign deleted by Admin. " + document.getElementById("adminNotes").value;
            resolveReport(index);
            
            document.getElementById("reportPopup").classList.add("hidden");
            alert("🗑️ Campaign successfully removed.");
        }
    };

    document.getElementById("reportPopup").classList.remove("hidden");
}

/*=====================================
        CLOSE REPORT POPUP
=====================================*/
document.querySelector(".closeReportPopup").onclick = () => {
    document.getElementById("reportPopup").classList.add("hidden");
};

/*=====================================
        RESOLVE REPORT
=====================================*/
function resolveReport(index){
    if(reports[index].status === "Resolved") {
        alert("This report is already resolved!");
        return;
    }
    
    reports[index].status = "Resolved";
    
    // Save to database and refresh UI
    localStorage.setItem("reports", JSON.stringify(reports));
    loadReports();
    alert("✅ Report marked as resolved.");
}
/*=====================================
        DELETE REPORT
=====================================*/
function deleteReport(index){
    if(!confirm("Delete this report permanently?")) return;
    reports.splice(index,1);
    localStorage.setItem("reports", JSON.stringify(reports));
    loadReports();
}


/*=====================================
        SEARCH REPORTS
=====================================*/

document.getElementById("reportSearch")
.addEventListener("input",function(){

const keyword=
this.value.toLowerCase();

Array.from(reportTable.rows)
.forEach(row=>{

row.style.display=
row.innerText
.toLowerCase()
.includes(keyword)
?
""
:
"none";

});

});

/*=====================================
        FILTER REPORTS
=====================================*/

document.getElementById("reportFilter")
.onchange=function(){

const filter=
this.value.toLowerCase();

Array.from(reportTable.rows)
.forEach(row=>{

if(filter==="all"){

row.style.display="";

return;

}

const status=
row.cells[4].innerText
.toLowerCase();

row.style.display=
status.includes(filter)
?
""
:
"none";

});

};

/*=====================================
        EMAIL CENTER
=====================================*/

const emailHistory =
JSON.parse(localStorage.getItem("emailHistory")) || [];

const emailTemplates={

welcome:{
subject:"Welcome to GiftBloom ❤️",
body:"Welcome to GiftBloom. We're happy to have you."
},

verification:{
subject:"Donation Verified ✅",
body:"Your donation has been verified successfully."
},

rejected:{
subject:"Donation Rejected ❌",
body:"Unfortunately your donation could not be verified."
},

campaign:{
subject:"Campaign Update 📢",
body:"There is an important update regarding your campaign."
}

};

/*=====================================
        LOAD TEMPLATE
=====================================*/

document.getElementById("emailTemplate")
.onchange=function(){

const value=this.value;

if(!value) return;

document.getElementById("emailSubject").value=
emailTemplates[value].subject;

document.getElementById("emailBody").value=
emailTemplates[value].body;

};

/*=====================================
        PREVIEW EMAIL
=====================================*/

document.getElementById("previewEmail")
.onclick=function(){

document.getElementById("previewSubject").innerText=
document.getElementById("emailSubject").value;

document.getElementById("previewBody").innerText=
document.getElementById("emailBody").value;

document.getElementById("emailPopup")
.classList.remove("hidden");

};

/*=====================================
        CLOSE EMAIL POPUP
=====================================*/

document.querySelector(".closeEmailPopup")
.onclick=function(){

document.getElementById("emailPopup")
.classList.add("hidden");

};

/*=====================================
        SEND EMAIL
=====================================*/

document.getElementById("sendEmailBtn")
.onclick=function(){

const receiver=
document.getElementById("receiverId").value.trim();

const subject=
document.getElementById("emailSubject").value.trim();

const body=
document.getElementById("emailBody").value.trim();

if(receiver===""){

alert("Select a receiver.");

return;

}

if(subject===""){

alert("Enter subject.");

return;

}

if(body===""){

alert("Write email message.");

return;

}

emailHistory.push({

receiver,

subject,

body,

date:new Date().toLocaleString(),

status:"Queued"

});

localStorage.setItem(

"emailHistory",

JSON.stringify(emailHistory)

);

alert("Email queued successfully.");

document.getElementById("receiverId").value="";
document.getElementById("emailSubject").value="";
document.getElementById("emailBody").value="";

};

/*=====================================
        SEND TO ALL USERS
=====================================*/

document.getElementById("sendAllUsers")
.onclick=function(){

if(!confirm("Send this email to every user?"))
return;

users.forEach(user=>{

emailHistory.push({

receiver:user.email,

subject:
document.getElementById("emailSubject").value,

body:
document.getElementById("emailBody").value,

date:new Date().toLocaleString(),

status:"Queued"

});

});

localStorage.setItem(

"emailHistory",

JSON.stringify(emailHistory)

);

alert("Broadcast email queued.");

};

/*=====================================
        EMAIL HISTORY
=====================================*/

function loadEmailHistory(){

const table=
document.getElementById("emailHistoryTable");

if(!table) return;

table.innerHTML="";

emailHistory.forEach(email=>{

const tr=document.createElement("tr");

tr.innerHTML=`

<td>${email.receiver}</td>

<td>${email.subject}</td>
<td>${formatForDashboard(email.date)}</td>
<td>${email.status}</td>

`;

table.appendChild(tr);

});

}

loadEmailHistory();

/*=====================================
        ADMIN SETTINGS
=====================================*/

const adminSettings =
JSON.parse(localStorage.getItem("adminSettings")) || {

allowSignup:true,

allowDonation:true,

allowCampaign:true,

maintenance:false,

autoVerify:false,

minimumAge:14,

minimumDonation:10

};

/*=====================================
        LOAD SETTINGS
=====================================*/

function loadSettings(){

const signup=
document.getElementById("allowSignup");

if(signup)
signup.checked=adminSettings.allowSignup;

const donation=
document.getElementById("allowDonation");

if(donation)
donation.checked=adminSettings.allowDonation;

const campaign=
document.getElementById("allowCampaign");

if(campaign)
campaign.checked=adminSettings.allowCampaign;

const maintenance=
document.getElementById("maintenanceMode");

if(maintenance)
maintenance.checked=adminSettings.maintenance;

const auto=
document.getElementById("autoVerify");

if(auto)
auto.checked=adminSettings.autoVerify;

const age=
document.getElementById("minimumAge");

if(age)
age.value=adminSettings.minimumAge;

const minimum=
document.getElementById("minimumDonation");

if(minimum)
minimum.value=adminSettings.minimumDonation;

}

loadSettings();

/*=====================================
        DANGER ZONE ACTIONS
=====================================*/

// 1. Maintenance Mode Toggle
const maintenanceBtn = document.getElementById("maintenanceModeBtn");

if (maintenanceBtn) {
    // Set initial button state on page load
    if (adminSettings.maintenance) {
        maintenanceBtn.innerHTML = "🔴 Disable Maintenance Mode";
        maintenanceBtn.style.background = "#e53935"; // Red color
    }

    maintenanceBtn.onclick = function() {
        // Toggle the boolean value
        adminSettings.maintenance = !adminSettings.maintenance;
        
        // Save to localStorage
        localStorage.setItem("adminSettings", JSON.stringify(adminSettings));
        
        // Update the UI button
        if (adminSettings.maintenance) {
            maintenanceBtn.innerHTML = "🔴 Disable Maintenance Mode";
            maintenanceBtn.style.background = "#e53935";
            alert("⚠ Maintenance Mode ENABLED. Users are now blocked from the frontend.");
        } else {
            maintenanceBtn.innerHTML = "🛠 Enable Maintenance Mode";
            maintenanceBtn.style.background = "#ff4d8d";
            alert("✅ Maintenance Mode DISABLED. Site is live again.");
        }
    };
}

/*=====================================
        SAVE SETTINGS
=====================================*/

const saveBtn=
document.getElementById("saveSettings");

if(saveBtn){

saveBtn.onclick=function(){

adminSettings.allowSignup=
document.getElementById("allowSignup").checked;

adminSettings.allowDonation=
document.getElementById("allowDonation").checked;

adminSettings.allowCampaign=
document.getElementById("allowCampaign").checked;

adminSettings.maintenance=
document.getElementById("maintenanceMode").checked;

adminSettings.autoVerify=
document.getElementById("autoVerify").checked;

adminSettings.minimumAge=
Number(
document.getElementById("minimumAge").value
);

adminSettings.minimumDonation=
Number(
document.getElementById("minimumDonation").value
);

localStorage.setItem(

"adminSettings",

JSON.stringify(adminSettings)

);

alert("Settings Saved Successfully.");

};

}

/*=====================================
        RESET SETTINGS
=====================================*/

const resetBtn=
document.getElementById("resetSettings");

if(resetBtn){

resetBtn.onclick=function(){

if(!confirm(
"Reset all settings?"
)) return;

localStorage.removeItem("adminSettings");

location.reload();

};

}

/*=====================================
        SYSTEM INFO
=====================================*/

const totalStorage=
JSON.stringify(localStorage).length;

const storageBox=
document.getElementById("storageUsed");

if(storageBox){

storageBox.innerText=
(totalStorage/1024).toFixed(2)
+" KB";

}

const version=
document.getElementById("systemVersion");

if(version){

version.innerText="GiftBloom v1.0";

}

const lastBackup=
document.getElementById("lastBackup");

if(lastBackup){

lastBackup.innerText=
new Date().toLocaleString();

}

/*=====================================
        SIDEBAR NAVIGATION
=====================================*/

document.querySelectorAll(".sidebar li").forEach(item=>{

item.onclick=function(){

document.querySelectorAll(".sidebar li")
.forEach(i=>i.classList.remove("active"));

this.classList.add("active");

const target=this.dataset.target;

document.getElementById(target)
.scrollIntoView({

behavior:"smooth"

});

};

});

/*=====================================
        CLOSE POPUPS
=====================================*/

window.onclick=function(e){

document.querySelectorAll(".popup")
.forEach(popup=>{

if(e.target===popup){

popup.classList.add("hidden");

}

});

};

/*=====================================
        FLOATING HEARTS
=====================================*/

const hearts=
document.querySelector(".hearts");

if(hearts){

for(let i=0;i<18;i++){

const heart=document.createElement("div");

heart.className="heart";

heart.innerHTML="❤";

heart.style.left=
Math.random()*100+"vw";

heart.style.fontSize=
(12+Math.random()*18)+"px";

heart.style.animationDuration=
(8+Math.random()*8)+"s";

heart.style.animationDelay=
(Math.random()*5)+"s";

hearts.appendChild(heart);

}

}


/*=====================================
        SCROLL ANIMATION
=====================================*/

const cards=
document.querySelectorAll(
".glass,.section,.stat-card"
);

const observer=
new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.style.opacity="1";

entry.target.style.transform="translateY(0)";

}

});

});

cards.forEach(card=>{

card.style.opacity="0";

card.style.transform="translateY(40px)";

card.style.transition=".5s";

observer.observe(card);

});

/*=====================================
        HELPER FUNCTIONS
=====================================*/

function formatMoney(amount){

return "₹"+Number(amount).toLocaleString("en-IN");

}

function formatDate(date){

return new Date(date)
.toLocaleString();

}

/*=====================================
        REFRESH
=====================================*/

function refreshDashboard(){
loadDashboard();
loadUsers();
loadCampaigns();
loadDonations();
loadReports();
loadEmailHistory();
loadPaymentHistory();
loadNotifications();
}

/*=====================================
        INITIALIZE
=====================================*/

document.addEventListener("DOMContentLoaded",()=>{

const statCards = document.querySelectorAll(".stat-card");

if(statCards.length >= 4){

    statCards[0].onclick = () =>
        document.getElementById("usersSection")
        .scrollIntoView({behavior:"smooth"});

    statCards[1].onclick = () =>
        document.getElementById("campaignSection")
        .scrollIntoView({behavior:"smooth"});

    statCards[2].onclick = () =>
        document.getElementById("donationSection")
        .scrollIntoView({behavior:"smooth"});

    statCards[3].onclick = () =>
        document.getElementById("donationSection")
        .scrollIntoView({behavior:"smooth"});
}

refreshDashboard();

console.log("GiftBloom Admin Ready");

});



/*=====================================
    PAYMENT HISTORY
=====================================*/
function loadPaymentHistory(){
    const paymentHistoryTable = document.getElementById("paymentHistoryTable");
    if(!paymentHistoryTable) return;
    paymentHistoryTable.innerHTML = "";

    const term = document.getElementById("paymentHistorySearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("paymentHistoryFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("paymentLimit")?.value || "5");

    let filtered = paymentHistory.map((p, i) => ({ data: p, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        const matchesSearch = text.includes(term);
        const matchesFilter = filterStatus === "all" || (obj.data.status || "").toLowerCase().includes(filterStatus);
        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        paymentHistoryTable.innerHTML = `<tr><td colspan="10" style="text-align:center;">No payment history found.</td></tr>`;
        const info = document.getElementById("paymentPageInfo");
        if (info) info.innerText = `Page 1 of 1`;
        return;
    }

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.payments > totalPages) pageState.payments = totalPages;
    if (pageState.payments < 1) pageState.payments = 1;

    const start = (pageState.payments - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    paginated.forEach(obj => {
        const payment = obj.data;
        const index = obj.originalIndex;
        paymentHistoryTable.innerHTML += `
        <tr>
            <td>${payment.transactionId||"-"}</td>
            <td>${payment.donationId}</td>
            <td>${payment.campaignId}</td>
            <td>${payment.ownerId}</td>
            <td>${payment.donorId}</td>
            <td>₹${payment.amount}</td>
            <td><span class="status ${payment.status.toLowerCase()}">${payment.status}</span></td>
            <td>${formatForDashboard(payment.date)}</td>
            <td>${payment.verifiedBy||"-"}</td>
            <td>
                <div class="table-actions">
                    <button onclick="viewPayment(${index})">👁 View</button>
                    <button onclick="deletePayment(${index})">🗑 Delete</button>
                </div>
            </td>
        </tr>`;
    });

    const info = document.getElementById("paymentPageInfo");
    if (info) info.innerText = `Page ${pageState.payments} of ${totalPages}`;
}

function deletePayment(index) {
    if(!confirm("Are you sure you want to delete this payment record?")) return;
    paymentHistory.splice(index, 1);
    localStorage.setItem("paymentHistory", JSON.stringify(paymentHistory));
    loadPaymentHistory();
}


document.getElementById("paymentHistorySearch")?.addEventListener("input", () => { pageState.payments = 1; loadPaymentHistory(); });
document.getElementById("paymentHistoryFilter")?.addEventListener("change", () => { pageState.payments = 1; loadPaymentHistory(); });
document.getElementById("paymentLimit")?.addEventListener("change", () => { pageState.payments = 1; loadPaymentHistory(); });


function viewPayment(index){

const payment=paymentHistory[index];

alert(

"Transaction ID : "+payment.transactionId+

"\nDonation ID : "+payment.donationId+

"\nCampaign : "+payment.campaignId+

"\nOwner : "+payment.ownerId+

"\nDonor : "+payment.donorId+

"\nAmount : ₹"+payment.amount+

"\nStatus : "+payment.status+

"\nVerified By : "+payment.verifiedBy+

"\nDate : "+payment.date

);

}

document.getElementById("adminPhone").addEventListener("input",function(){
this.value=this.value.replace(/\D/g,"").slice(0,10);

});

document.getElementById("adminId").addEventListener("click", function(){
alert("Admin ID cannot be edited.");
});


/*=====================================
        ADMIN PROFILE
=====================================*/

let profileEdited = false;
let originalProfile = {};

const adminProfile =
JSON.parse(localStorage.getItem("adminProfile")) || {};

document.getElementById("adminFullName").value =
adminProfile.name || "GiftBloom Administrator";

document.getElementById("adminEmail").value =
adminProfile.email || "admin@giftbloom.com";

document.getElementById("adminPhone").value =
adminProfile.phone || "";


originalProfile = {

name: document.getElementById("adminFullName").value.trim(),

email: document.getElementById("adminEmail").value.trim(),

phone: document.getElementById("adminPhone").value.trim()

};



/* Edit Buttons */

document.querySelectorAll(".editBtn").forEach(btn=>{

btn.onclick=function(){

const input=document.getElementById(this.dataset.target);

input.removeAttribute("readonly");

input.focus();

};

});

/* Save */

document.getElementById("saveAdminProfile").onclick=function(){

const currentProfile={

name:document.getElementById("adminFullName").value.trim(),

email:document.getElementById("adminEmail").value.trim(),

phone:document.getElementById("adminPhone").value.trim()

};

/* Validation */

const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const phonePattern=/^[0-9]{10}$/;

if(currentProfile.name===""){

alert("Name cannot be empty.");
return;

}

if(!emailPattern.test(currentProfile.email)){

alert("Please enter a valid email address.");
return;

}

if(!phonePattern.test(currentProfile.phone)){

alert("Mobile number must contain exactly 10 digits.");
return;

}

if(
currentProfile.name===originalProfile.name &&
currentProfile.email===originalProfile.email &&
currentProfile.phone===originalProfile.phone
){

alert("No changes detected.");
return;

}

localStorage.setItem(
"adminProfile",
JSON.stringify(currentProfile)
);

originalProfile={...currentProfile};

document.getElementById("adminFullName").setAttribute("readonly",true);

document.getElementById("adminEmail").setAttribute("readonly",true);

document.getElementById("adminPhone").setAttribute("readonly",true);

alert("Profile Saved Successfully.");

};






/*=====================================
    GLOBAL PAGINATION CONTROLLER
=====================================*/

function changePage(type, direction) {
    pageState[type] += direction;
    // Trigger the correct refresh
    if (type === 'users') loadUsers();
    if (type === 'campaigns') loadCampaigns();
    if (type === 'donations') loadDonations();
    if (type === 'reports') loadReports();
    if (type === 'emails') loadEmailHistory();
    if (type === 'payments') loadPaymentHistory();
    if (type === 'notifications') loadNotifications();
}

/*=====================================
    NOTIFICATIONS (NEW)
=====================================*/
function loadNotifications() {
    const table = document.getElementById("notificationTable");
    if (!table) return;
    table.innerHTML = "";

    const term = document.getElementById("notifSearch")?.value.toLowerCase() || "";
    const limit = parseInt(document.getElementById("notifLimit")?.value || "5");

    // Filter and map
    let filtered = notifications.map((n, i) => ({ data: n, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        return text.includes(term);
    });

    // Pagination math
    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.notifications > totalPages) pageState.notifications = totalPages;
    if (pageState.notifications < 1) pageState.notifications = 1;

    const start = (pageState.notifications - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    // Render
    paginated.forEach(obj => {
        const notif = obj.data;
     const tr = document.createElement("tr");
tr.innerHTML = `
    <td>${formatForDashboard(notif.date)}</td>
    <td><b>${notif.title || "-"}</b></td>
         <td>${notif.message || "-"}</td>
        `;
        table.appendChild(tr);
    });

    // Update UI Text
    const pageInfo = document.getElementById("notifPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.notifications} of ${totalPages}`;
}

// Notification Event Listeners
document.getElementById("notifSearch")?.addEventListener("input", () => { pageState.notifications = 1; loadNotifications(); });
document.getElementById("notifLimit")?.addEventListener("change", () => { pageState.notifications = 1; loadNotifications(); });

/*=====================================
    USERS WITH PAGINATION (FIXED)
=====================================*/
function loadUsers() {
    const userTable = document.getElementById("userTable");
    if (!userTable) return;
    userTable.innerHTML = "";

    const term = document.getElementById("userSearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("userFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("userLimit")?.value || "5");

    let filtered = users.map((u, i) => ({ data: u, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        const matchesSearch = text.includes(term);
        const matchesFilter = filterStatus === "all" || (obj.data.status || "active").toLowerCase().includes(filterStatus);
        return matchesSearch && matchesFilter;
    });

    if (filtered.length === 0) {
        userTable.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No users found in database. Create an account on the signup page first!</td></tr>`;
        document.getElementById("userPageInfo").innerText = `Page 1 of 1`;
        return;
    }

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.users > totalPages) pageState.users = totalPages;
    if (pageState.users < 1) pageState.users = 1;

    const start = (pageState.users - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    paginated.forEach(obj => {
        const user = obj.data;
        const index = obj.originalIndex; 
        
        // FIX: Match the exact keys saved by signup.js
        const uId = user.id || user.userId || "Unknown";
        const uName = user.name || user.fullName || "Unknown";
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${uId}</td>
            <td>${uName}</td>
            <td>${user.email || "-"}</td>
            <td>${campaigns.filter(c => c.ownerId === uId || c.ownerId === user.email).length}</td>
            <td>${donations.filter(d => d.userId === uId || d.email === user.email).length}</td>
            <td><span class="status ${user.status?.toLowerCase() || "active"}">${user.status || "Active"}</span></td>
            <td>
                <div class="table-actions">
                    <button onclick="viewUser(${index})">👁 View</button>
                    <button onclick="emailUser(${index})">📧 Email</button>
                    <button onclick="suspendUser(${index})">🚫 Suspend</button>
                    <button onclick="deleteUser(${index})">🗑 Delete</button>
                </div>
            </td>
        `;
        userTable.appendChild(tr);
    });

    const pageInfo = document.getElementById("userPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.users} of ${totalPages}`;
}

/*=====================================
        VIEW USER (FIXED)
=====================================*/
function viewUser(index){
    const user=users[index];

    // FIX: Safely pull the correct data keys
    const uId = user.id || user.userId || "-";

    document.getElementById("popupUserId").innerText = uId;
    document.getElementById("popupName").innerText = user.name || user.fullName || "-";
    document.getElementById("popupEmail").innerText = user.email || "-";
    document.getElementById("popupPhone").innerText = user.mobile || user.phone || "-";
    document.getElementById("popupDob").innerText = user.dob || "-";
    
document.getElementById("popupJoin").innerText = formatForDashboard(user.joinDate);

    
    document.getElementById("popupCampaigns").innerText = campaigns.filter(c=>c.ownerId === uId || c.ownerId === user.email).length;
    document.getElementById("popupDonations").innerText = donations.filter(d=>d.userId === uId || d.email === user.email).length;
    
    document.getElementById("popupStatus").innerText = user.status || "Active";

    document.getElementById("userPopup").classList.remove("hidden");
}

function formatForDashboard(dateString) {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return String(dateString); // don't crash — just show the raw value
    return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(d);
}

/*=====================================
    DONATIONS WITH PAGINATION
=====================================*/
function loadDonations() {
    const donationTable = document.getElementById("donationTable");
    if (!donationTable) return;
    donationTable.innerHTML = "";

    const term = document.getElementById("donationSearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("donationFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("donationLimit")?.value || "5");

    let filtered = donations.map((d, i) => ({ data: d, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        const matchesSearch = text.includes(term);
        const matchesFilter = filterStatus === "all" || (obj.data.status || "pending").toLowerCase().includes(filterStatus);
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.donations > totalPages) pageState.donations = totalPages;
    if (pageState.donations < 1) pageState.donations = 1;

    const start = (pageState.donations - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    paginated.forEach(obj => {
        const donation = obj.data;
        const index = obj.originalIndex;
        
        const statusText = donation.status || "Pending";
        const statusClass = statusText.toLowerCase();

        let actionButtons = `<button onclick="viewDonation(${index})">👁 View</button>`;
        if(statusText === "Pending") {
            actionButtons += `
            <button onclick="verifyDonation(${index})">✅ Verify</button>
            <button onclick="rejectDonation(${index})">❌ Reject</button>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${donation.id || "-"}</td>
           <td>${donation.campaignId || donation.campaign || "-"}</td>
<td>${donation.userId || donation.name || "-"}</td>
            <td>₹${donation.amount || 0}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
<td>${formatForDashboard(donation.date)}</td>
<td>
           <div class="table-actions">${actionButtons}</div>
            </td>
        `;
        donationTable.appendChild(tr);
    });

    const pageInfo = document.getElementById("donationPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.donations} of ${totalPages}`;
}

// Overwrite Old Donation Search Listeners
document.getElementById("donationSearch")?.addEventListener("input", () => { pageState.donations = 1; loadDonations(); });
document.getElementById("donationFilter")?.addEventListener("change", () => { pageState.donations = 1; loadDonations(); });
document.getElementById("donationLimit")?.addEventListener("change", () => { pageState.donations = 1; loadDonations(); });



/*=====================================
      MOBILE MENU TOGGLE
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");

if(menuBtn && sidebar) {
    // Open/Close menu when clicking the hamburger
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("show");
    });

    // Close menu when clicking outside of it
    document.addEventListener("click", (e) => {
        if(!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove("show");
        }
    });
}

/*=====================================
        SIDEBAR NAVIGATION
=====================================*/
document.querySelectorAll(".sidebar li").forEach(item => {
    item.onclick = function() {
        // IMPORTANT: If it's the logout button, stop here and let the logout script handle it!
        if(this.id === "sidebarLogoutBtn") return;

        // Highlight active link
        document.querySelectorAll(".sidebar li").forEach(i => i.classList.remove("active"));
        this.classList.add("active");

        // Scroll smoothly to the section
        const target = this.dataset.target;
        const section = document.getElementById(target);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }

        // Close the mobile menu automatically after clicking a link
        if(sidebar && sidebar.classList.contains("show")) {
            sidebar.classList.remove("show");
        }
    };
});

/*=====================================
        ADMIN LOGOUT
=====================================*/
const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");

if(sidebarLogoutBtn){
    sidebarLogoutBtn.onclick = function() {
        if(!confirm("Are you sure you want to logout?")) return;
        
        // Clear login data
        localStorage.removeItem("adminLogin");
        
        // Redirect to login page
        window.location.href = "login.html";
    };
}
