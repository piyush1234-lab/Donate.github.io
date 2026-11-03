/*======== GLOBAL API CONFIG ========*/
const API_URL = "https://script.google.com/macros/s/AKfycbyspj1ezHNVn6e0AFTDqhPNHJAnclSB9sbVCLeVOfRIla_RpWuBVJr7jViB1zm-RyD-/exec"; 

function getAdminToken() {
    return localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken") || "";
}

function isAdminLoggedIn() {
    return (localStorage.getItem("adminLogin") === "true" || sessionStorage.getItem("adminLogin") === "true") && !!getAdminToken();
}

function getAdminRole() {
    return localStorage.getItem("adminRole") || sessionStorage.getItem("adminRole") || "Admin";
}

if (!isAdminLoggedIn()) {
    window.location.href = "login.html";
}

// Hide the "All Admins (PIN Change Notice)" option for anyone who isn't the Owner
const currentAdminRole = getAdminRole();
if (currentAdminRole !== "Owner") {
    document.querySelector('#emailReceiver option[value="admin"]')?.remove();
}

// Universal Helper Function for all database calls
async function fetchAPI(action, data = {}) {
    let result;
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: action, data: data })
        });
        result = await response.json();
    } catch (error) {
        console.error(`Error in ${action}:`, error);
        return { status: "Error", message: "Network connection failed." };
    }

    if (result && result.status === "Error" && /unauthorized/i.test(result.message || "")) {
        handleSessionExpired();
        return new Promise(() => {});
    }
    return result;
}

function handleSessionExpired() {
    if (window.__sessionExpiredHandled) return;
    window.__sessionExpiredHandled = true;
    localStorage.removeItem("adminLogin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminProfile");
    sessionStorage.removeItem("adminLogin");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminRole");
    alert("Your session has expired. Please log in again.");
    window.location.href = "login.html";
}

/*======== GLOBAL STATE VARIABLES ========*/
let currentAdmin = null;
let isMandatoryPasswordChange = false;
let users = [];
let campaigns = [];
let donations = [];
let reports = [];
let notifications = [];

const pageState = {
    users: 1, campaigns: 1, donations: 1,
    reports: 1, emails: 1, payments: 1, notifications: 1, admins: 1
};

/*======== FETCH ALL DASHBOARD DATA ========*/
async function loadAllAdminData() {
    const result = await fetchAPI("getAdminDashboardData", { token: getAdminToken() });
   
    if (result.status === "Success") {
        currentAdmin = result.data.currentAdmin || null;
        users = result.data.users || [];
        campaigns = result.data.campaigns || [];
        donations = result.data.donations || [];
        reports = result.data.reports || [];
        notifications = result.data.notifications || [];

        if (currentAdmin) {
            syncAdminProfileUI(currentAdmin);
            if (currentAdmin.mustChangePassword === true) {
                openAdminPasswordModal(true);
            }
        } else {
            // Fallback: match from users list using stored adminProfile
            const cached = JSON.parse(localStorage.getItem("adminProfile") || "{}");
            const found = users.find(u =>
                (cached.userId && u.userId === cached.userId) ||
                (cached.email && u.email.toLowerCase() === cached.email.toLowerCase() && (u.role === "Admin" || u.role === "Owner"))
            );
            if (found) syncAdminProfileUI(found);
        }

        refreshDashboard();
    } else {
        alert("Failed to load dashboard data: " + result.message);
    }
}

/*=====================================
    SYNC ADMIN PROFILE FROM DATABASE
=====================================*/
let originalProfile = { name: "", email: "", phone: "" };

function syncAdminProfileUI(adminData) {
    if (!adminData) return;

    const idEl = document.getElementById("adminId");
    const nameEl = document.getElementById("adminFullName");
    const emailEl = document.getElementById("adminEmail");
    const phoneEl = document.getElementById("adminPhone");

    const cleanId = adminData.userId || adminData.id || "";
    const cleanName = adminData.name || adminData.fullName || "";
    const cleanEmail = adminData.email || "";
    const cleanPhone = String(adminData.mobile || adminData.phone || "").replace(/\D/g, "").slice(-10);
    const cleanRole = adminData.role || getAdminRole();

    if (idEl) idEl.value = cleanId;
    if (nameEl) nameEl.value = cleanName;
    if (emailEl) emailEl.value = cleanEmail;
    if (phoneEl) phoneEl.value = cleanPhone;

    originalProfile = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone
    };

    localStorage.setItem("adminRole", cleanRole);
    localStorage.setItem("adminProfile", JSON.stringify({
        userId: cleanId,
        name: cleanName,
        email: cleanEmail,
        mobile: cleanPhone,
        phone: cleanPhone,
        role: cleanRole
    }));
}

/*=====================================
    STRICT 1ST-ENTRY & MANUAL PASSWORD MODAL
=====================================*/
function openAdminPasswordModal(mandatory = false) {
    isMandatoryPasswordChange = mandatory;
    const popup = document.getElementById("forcePasswordPopup");
    const closeBtn = document.getElementById("closeForcePwdBtn");
    const titleEl = document.getElementById("forcePwdTitle");
    const subEl = document.getElementById("forcePwdSubtitle");

    if (!popup) return;

    document.getElementById("currentAdminPwd").value = "";
    document.getElementById("newAdminPwd").value = "";
    document.getElementById("confirmAdminPwd").value = "";

    if (mandatory) {
        if (titleEl) titleEl.innerText = "🔐 First-Login Security Setup";
        if (subEl) subEl.innerText = "Welcome to the GiftBloom Admin Team! Before accessing the dashboard, you must change your temporary Admin password.";
        if (closeBtn) closeBtn.classList.add("hidden");
    } else {
        if (titleEl) titleEl.innerText = "🔐 Change Admin Password";
        if (subEl) subEl.innerText = "Enter your current password and choose a new password for your administrator account.";
        if (closeBtn) closeBtn.classList.remove("hidden");
    }

    popup.classList.remove("hidden");
}

document.getElementById("closeForcePwdBtn")?.addEventListener("click", () => {
    if (isMandatoryPasswordChange) return;
    document.getElementById("forcePasswordPopup")?.classList.add("hidden");
});

document.getElementById("changeAdminPassword")?.addEventListener("click", () => {
    openAdminPasswordModal(false);
});

document.getElementById("submitAdminPwdChange")?.addEventListener("click", async function() {
    const currentPassword = document.getElementById("currentAdminPwd").value;
    const newPassword = document.getElementById("newAdminPwd").value;
    const confirmPassword = document.getElementById("confirmAdminPwd").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all password fields.");
        return;
    }
    if (newPassword.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
    }
    if (newPassword !== confirmPassword) {
        alert("New password and confirm password do not match.");
        return;
    }
    if (currentPassword === newPassword) {
        alert("Your new password must be different from your current password.");
        return;
    }

    const btn = this;
    const originalText = btn.innerHTML;
    btn.innerHTML = "Updating... ⏳";
    btn.disabled = true;

    const response = await fetchAPI("changeAdminOwnPassword", {
        currentPassword: currentPassword,
        newPassword: newPassword,
        token: getAdminToken()
    });

    btn.innerHTML = originalText;
    btn.disabled = false;

    if (response && response.status === "Success") {
        isMandatoryPasswordChange = false;
        if (currentAdmin) currentAdmin.mustChangePassword = false;
        document.getElementById("forcePasswordPopup")?.classList.add("hidden");
        alert("✅ " + response.message);
    } else {
        alert("❌ " + (response?.message || "Failed to update password."));
    }
});

/*=====================================
        DASHBOARD STATS
=====================================*/
function loadDashboard() {
    const totalUsersEl = document.getElementById("totalUsers");
    if (totalUsersEl) {
        totalUsersEl.innerText = users.filter(u => (u.role || "User") === "User").length;
    }

    const totalCampaignsEl = document.getElementById("totalCampaigns");
    if (totalCampaignsEl) {
        totalCampaignsEl.innerText = campaigns.length;
    }

    const totalRaised = donations
        .filter(d => d.status === "Verified")
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

    const totalDonationsEl = document.getElementById("totalDonations");
    if (totalDonationsEl) {
        totalDonationsEl.innerText = "₹" + totalRaised;
    }

    const pending = donations.filter(d => d.status === "Pending").length;
    const pendingVerificationEl = document.getElementById("pendingVerification");
    if (pendingVerificationEl) {
        pendingVerificationEl.innerText = pending;
    }
}

/*=====================================
        RECENT ACTIVITY
=====================================*/
function loadActivity() {
    const list = document.getElementById("activityList");
    if (!list) return;
    list.innerHTML = "";

    const activity = [];

    campaigns.slice(-3).forEach(c => {
        activity.push("❤️ Campaign created : " + (c.gift || c.giftName || "Untitled"));
    });

    donations.slice(-3).forEach(d => {
        activity.push("💰 Donation ₹" + (d.amount || 0) + " by " + (d.name || "Anonymous"));
    });

    users.filter(u => (u.role || "User") === "User").slice(-3).forEach(u => {
        activity.push("👤 New User : " + (u.name || u.fullName || "Anonymous"));
    });

    activity.reverse();

    if (activity.length === 0) {
        list.innerHTML = `<div class="activity">No recent activity yet.</div>`;
        return;
    }

    activity.forEach(text => {
        const div = document.createElement("div");
        div.className = "activity";
        div.innerText = text;
        list.appendChild(div);
    });
}

/*=====================================
        QUICK ACTIONS
=====================================*/
document.getElementById("viewUsers")?.addEventListener("click", () => {
    document.getElementById("usersSection")?.scrollIntoView({ behavior: "smooth" });
});
document.getElementById("viewCampaigns")?.addEventListener("click", () => {
    document.getElementById("campaignSection")?.scrollIntoView({ behavior: "smooth" });
});
document.getElementById("viewPending")?.addEventListener("click", () => {
    document.getElementById("donationSection")?.scrollIntoView({ behavior: "smooth" });
});
document.getElementById("sendEmail")?.addEventListener("click", () => {
    document.getElementById("emailSection")?.scrollIntoView({ behavior: "smooth" });
});

/*=====================================
        CLOSE POPUPS
=====================================*/
document.querySelector(".closePopup")?.addEventListener("click", () => {
    document.getElementById("userPopup")?.classList.add("hidden");
});
document.querySelector(".closeCampaignPopup")?.addEventListener("click", () => {
    document.getElementById("campaignPopup")?.classList.add("hidden");
});
document.querySelector(".closeDonationPopup")?.addEventListener("click", () => {
    document.getElementById("donationPopup")?.classList.add("hidden");
});
document.querySelector(".closeReportPopup")?.addEventListener("click", () => {
    document.getElementById("reportPopup")?.classList.add("hidden");
});
document.querySelectorAll(".closeEmailPopup").forEach(btn => {
    btn.addEventListener("click", () => {
        document.getElementById("emailPopup")?.classList.add("hidden");
    });
});

window.onclick = function(e) {
    document.querySelectorAll(".popup").forEach(popup => {
        // Never allow clicking outside to close the mandatory 1st-login password popup
        if (popup.id === "forcePasswordPopup" && isMandatoryPasswordChange) return;
        if (e.target === popup) {
            popup.classList.add("hidden");
        }
    });
};

/*=====================================
        HIDE / DELETE CAMPAIGN
=====================================*/
async function hideCampaign(index) {
    if (!campaigns[index]) return;
    
    const campaign = campaigns[index];
    const newStatus = campaign.status === "Hidden" ? "Active" : "Hidden";
    
    const response = await fetchAPI("updateCampaignStatus", { 
        campaignId: campaign.campaignId,
        status: newStatus,
        token: getAdminToken()
    });

    if (response.status === "Success") {
        campaigns[index].status = newStatus;
        alert(newStatus === "Hidden" ? "🙈 Campaign Hidden!" : "👁 Campaign Unhidden!");
        loadCampaigns();
    } else {
        alert("Error: " + response.message);
    }
}

async function deleteCampaign(index) {
    if (!campaigns[index]) return;
    if (!confirm("Are you sure you want to delete this campaign and all its associated records?")) return;

    const campaignId = campaigns[index].campaignId;
    
    const response = await fetchAPI("deleteCampaign", {
        campaignId: campaignId,
        token: getAdminToken()
    });

    if (response.status === "Success") {
        campaigns.splice(index, 1);
        donations = donations.filter(d => (d.campaignId || d.campaign) !== campaignId);
        reports = reports.filter(r => r.campaignId !== campaignId);
        notifications = notifications.filter(n => n.campaignId !== campaignId);

        refreshDashboard();
        alert("Campaign and associated records deleted.");
    } else {
        alert("Error: " + response.message);
    }
}

/*=====================================
        USER ACTIONS (EMAIL / SUSPEND / DELETE)
=====================================*/
function emailUser(index) {
    const user = users[index];
    if (!user) return;
    document.getElementById("emailReceiver").value = "single";
    document.getElementById("receiverId").value = user.email;
    document.getElementById("emailSection")?.scrollIntoView({ behavior: "smooth" });
}

async function toggleUserSuspension(index) {
    if (!users[index]) return;
    const userId = users[index].userId || users[index].id;
    const newStatus = users[index].status === "Suspended" ? "Active" : "Suspended";
    const confirmMsg = newStatus === "Suspended"
        ? "Suspend this user? Their campaigns will be hidden from public view."
        : "Reactivate this user? Their campaigns stay hidden until manually restored.";
    if (!confirm(confirmMsg)) return;

    const response = await fetchAPI("updateUserStatus", {
        userId: userId,
        status: newStatus,
        token: getAdminToken()
    });
    if (response && response.status === "Success") {
        users[index].status = newStatus;
        if (newStatus === "Suspended") {
            campaigns.forEach(c => {
                if (c.ownerId === userId && c.status !== "Blocked" && c.status !== "Completed") {
                    c.status = "Hidden";
                }
            });
        }
        loadUsers();
        loadAdmins();
        loadCampaigns();
    } else {
        alert("❌ Failed: " + (response?.message || "Unknown error"));
    }
}

async function deleteUser(index) {
    if (!users[index]) return;
    if (!confirm("Delete this user permanently along with all their campaigns, images, expenses, and donations?")) return;

    const userToDelete = users[index];
    const targetUserId = userToDelete.userId || userToDelete.id;

    const response = await fetchAPI("deleteUser", {
        userId: targetUserId,
        token: getAdminToken()
    });

    if (response.status === "Success") {
        alert("User and all associated data deleted successfully.");
        await loadAllAdminData();
    } else {
        alert("Error: " + response.message);
    }
}

document.getElementById("userSearch")?.addEventListener("input", () => { pageState.users = 1; loadUsers(); });
document.getElementById("userFilter")?.addEventListener("change", () => { pageState.users = 1; loadUsers(); });
document.getElementById("userLimit")?.addEventListener("change", () => { pageState.users = 1; loadUsers(); });

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

    const reportedIds = new Set(reports.map(r => r.campaignId));

    let filtered = campaigns.map((c, i) => ({ data: c, originalIndex: i })).filter(obj => {
        const c = obj.data;
        const text = JSON.stringify(c).toLowerCase();
        const matchesSearch = text.includes(term);

        let matchesFilter = true;
        if (filterStatus === "pending") {
            matchesFilter = (c.adminStatus || "Pending").toLowerCase() === "pending" || (c.status || "").toLowerCase() === "pending";
        } else if (filterStatus === "reported") {
            matchesFilter = reportedIds.has(c.campaignId);
        } else if (filterStatus !== "all") {
            matchesFilter = (c.status || "active").toLowerCase().includes(filterStatus);
        }
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

        const campaignOwner = campaign.ownerId || campaign.creator || "-";
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
                    <button onclick="window.location.href='campaigns.html?id=${campaign.campaignId}'">📄 Details</button>
                    <button onclick="hideCampaign(${index})">${hideBtnText}</button>
                    ${(campaign.adminStatus === 'Approved' || campaign.verified === true || campaign.adminApproved === true)
                        ? `<button onclick="toggleApproveCampaign('${campaign.campaignId}', true)" style="background: #ff9800;">❌ Unapprove</button>`
                        : `<button onclick="toggleApproveCampaign('${campaign.campaignId}', false)" style="background: #28a745;">✅ Approve</button>`
                    }
                    ${campaign.status === 'Blocked' 
                        ? `<button onclick="unblockCampaign('${campaign.campaignId}')">🔓 Unblock</button>` 
                        : `<button onclick="blockCampaignPrompt('${campaign.campaignId}')">🚫 Block</button>`
                    }
                    <button onclick="deleteCampaign(${index})">🗑 Delete</button>
                </div>
            </td>
        `;
        campaignTable.appendChild(tr);
    });

    const pageInfo = document.getElementById("campaignPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.campaigns} of ${totalPages}`;
}

async function toggleApproveCampaign(campaignId, isApproved) {
    const actionText = isApproved ? "unapprove" : "approve";
    if (!confirm(`Are you sure you want to ${actionText} this campaign?`)) return;

    const newVerifiedState = !isApproved;
    const response = await fetchAPI("toggleCampaignVerification", { 
        campaignId: campaignId, 
        verified: newVerifiedState, 
        token: getAdminToken() 
    });

    if (response && response.status === "Success") {
        alert(newVerifiedState ? "✅ Campaign approved & verified!" : "⚠️ Campaign unapproved.");
        
        const camp = campaigns.find(c => c.campaignId === campaignId);
        if (camp) {
            camp.verified = newVerifiedState;
            camp.adminStatus = newVerifiedState ? "Approved" : "Pending";
            camp.adminApproved = newVerifiedState;
        }
        
        loadCampaigns();
    } else {
        alert("❌ " + (response?.message || "Failed to update approval status."));
    }
}

async function blockCampaignPrompt(campaignId) {
    const reason = prompt("Enter a reason for blocking this campaign:");
    if (reason === null) return;
    if (reason.trim() === "") { alert("A reason is required to block a campaign."); return; }
    const response = await fetchAPI("blockCampaign", {
        campaignId: campaignId,
        reason: reason.trim(),
        token: getAdminToken()
    });
    if (response && response.status === "Success") {
        const camp = campaigns.find(c => c.campaignId === campaignId);
        if (camp) camp.status = "Blocked";
        alert("🚫 Campaign blocked.");
        loadCampaigns();
    } else {
        alert("❌ " + (response?.message || "Failed to block."));
    }
}

async function unblockCampaign(campaignId) {
    if (!confirm("Unblock this campaign and make it public again?")) return;
    const response = await fetchAPI("updateCampaignStatus", {
        campaignId: campaignId,
        status: "Active",
        token: getAdminToken()
    });
    if (response && response.status === "Success") {
        const camp = campaigns.find(c => c.campaignId === campaignId);
        if (camp) camp.status = "Active";
        alert("🔓 Campaign unblocked.");
        loadCampaigns();
    } else {
        alert("❌ " + (response?.message || "Failed to unblock."));
    }
}

function viewCampaign(index) {
    const campaign = campaigns[index];
    if (!campaign) return;

    document.getElementById("campaignPopupId").innerText = campaign.campaignId || "-";
    document.getElementById("campaignPopupOwner").innerText = campaign.ownerId || "-";
    document.getElementById("campaignPopupGift").innerText = campaign.giftName || campaign.gift || "-";
    document.getElementById("campaignPopupReceiver").innerText = campaign.receiverName || campaign.receiver || "-";
    document.getElementById("campaignPopupRaised").innerText = "₹" + (campaign.raised || 0);
    document.getElementById("campaignPopupGoal").innerText = "₹" + (campaign.goal || campaign.target || 0);
    document.getElementById("campaignPopupDate").innerText = formatForDashboard(campaign.createdDate || campaign.date);
    document.getElementById("campaignPopupStatus").innerText = campaign.status || "Active";

    const approveBtn = document.getElementById("approveCampaign");
    if (approveBtn) {
        const isApproved = campaign.adminApproved || campaign.verified === true || campaign.adminStatus === "Approved";
        approveBtn.innerHTML = isApproved ? "❌ Unapprove" : "✅ Approve";
        approveBtn.style.background = isApproved ? "#ff9800" : "#28a745";
        approveBtn.disabled = false;
        approveBtn.onclick = function() {
            toggleApproveCampaign(campaign.campaignId, isApproved);
            document.getElementById("campaignPopup")?.classList.add("hidden");
        };
    }

    const hideBtn = document.getElementById("hideCampaignBtn");
    if (hideBtn) {
        hideBtn.innerHTML = campaign.status === "Hidden" ? "👁 Show" : "🙈 Hide";
        hideBtn.onclick = function() {
            hideCampaign(index);
            document.getElementById("campaignPopup")?.classList.add("hidden");
        };
    }

    const deleteCampBtn = document.getElementById("deleteCampaignBtn");
    if (deleteCampBtn) {
        deleteCampBtn.onclick = function() {
            deleteCampaign(index);
            document.getElementById("campaignPopup")?.classList.add("hidden");
        };
    }

    document.getElementById("campaignPopup")?.classList.remove("hidden");
}

document.getElementById("campaignSearch")?.addEventListener("input", () => { pageState.campaigns = 1; loadCampaigns(); });
document.getElementById("campaignFilter")?.addEventListener("change", () => { pageState.campaigns = 1; loadCampaigns(); });
document.getElementById("campaignLimit")?.addEventListener("change", () => { pageState.campaigns = 1; loadCampaigns(); });

/*=====================================
        VIEW / VERIFY / REJECT DONATION
=====================================*/
function viewDonation(index) {
    const d = donations[index];
    if (!d) return;
    const currentStatus = d.status || "Pending";
    const campaign = campaigns.find(c => c.campaignId === (d.campaignId || d.campaign));
    const resolvedOwnerId = d.ownerId && d.ownerId !== "-" ? d.ownerId : (campaign ? campaign.ownerId : "-");

    document.getElementById("popupDonationId").innerText = d.id || "-";
    document.getElementById("popupTransactionId").innerText = d.transactionId || "Pending";
    document.getElementById("popupCampaignId").innerText = d.campaignId || d.campaign || "-";
    document.getElementById("popupOwnerId").innerText = resolvedOwnerId;
    document.getElementById("popupDonorId").innerText = d.userId || "-";
    document.getElementById("popupDonorName").innerText = d.name || "-";
    document.getElementById("popupDonorEmail").innerText = d.email || "-";
    document.getElementById("popupAmount").innerText = d.amount || 0;
    document.getElementById("popupMessage").value = d.message || "No message";
    document.getElementById("popupStatusDonation").innerText = currentStatus;

    const buttonContainer = document.querySelector("#donationPopup .popup-buttons");

    if (buttonContainer) {
        if (currentStatus === "Pending") {
            buttonContainer.innerHTML = `
                <button id="approveDonation">✅ Verify Payment</button>
                <button id="rejectDonationBtn">❌ Reject</button>
                <button id="mailDonor">📧 Email Donor</button>
            `;

            document.getElementById("approveDonation").onclick = function() {
                verifyDonation(index);
                document.getElementById("donationPopup")?.classList.add("hidden");
            };
            document.getElementById("rejectDonationBtn").onclick = function() {
                rejectDonation(index);
                document.getElementById("donationPopup")?.classList.add("hidden");
            };
        } else {
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

        document.getElementById("mailDonor").onclick = function() {
            document.getElementById("donationPopup")?.classList.add("hidden");
            document.getElementById("emailReceiver").value = "donor";
            document.getElementById("receiverId").value = d.email || d.id || ""; 
            document.getElementById("emailSection")?.scrollIntoView({ behavior: "smooth" });
        };
    }

    document.getElementById("donationPopup")?.classList.remove("hidden");
}

async function verifyDonation(index) {
    const donation = donations[index];
    if (!donation) return;
    if (donation.status === "Verified") {
        alert("Already verified.");
        return;
    }

    const transactionId = "GBTX" + Date.now().toString().slice(-8);

    const response = await fetchAPI("verifyDonation", {
        donationId: donation.id,
        campaignId: donation.campaignId || donation.campaign,
        transactionId: transactionId,
        amount: donation.amount,
        token: getAdminToken()
    });
    
    if (response.status === "Success") {
        donation.status = "Verified";
        donation.transactionId = transactionId;
        donation.adminNotes = "TxnID: " + transactionId;
        
        const campaign = campaigns.find(c => (c.campaignId || "") === (donation.campaignId || donation.campaign));
        if (campaign) {
            campaign.raised = Number(campaign.raised || 0) + Number(donation.amount || 0);
        }

        loadDashboard();
        loadDonations();
        loadCampaigns();
        loadPaymentHistory();

        alert("✅ Donation Verified Successfully\n\nTransaction ID : " + transactionId);
    } else {
        alert("Error: " + response.message);
    }
}

async function rejectDonation(index) {
    if (!donations[index]) return;
    if (!confirm("Reject donation?")) return;

    const donation = donations[index];

    const response = await fetchAPI("rejectDonation", {
        donationId: donation.id,
        token: getAdminToken()
    });

    if (response.status === "Success") {
        donations[index].status = "Rejected";
        
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
    const filterVal = document.getElementById("reportFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("reportLimit")?.value || "5");

    let filtered = reports.map((r, i) => ({ data: r, originalIndex: i })).filter(obj => {
        const r = obj.data;
        const text = JSON.stringify(r).toLowerCase();
        const matchesSearch = text.includes(term);

        let matchesFilter = true;
        if (filterVal === "campaign" || filterVal === "user") {
            matchesFilter = (r.type || "campaign").toLowerCase().includes(filterVal);
        } else if (filterVal !== "all") {
            matchesFilter = (r.status || "pending").toLowerCase().includes(filterVal);
        }
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.reports > totalPages) pageState.reports = totalPages;
    if (pageState.reports < 1) pageState.reports = 1;

    const start = (pageState.reports - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    paginated.forEach(obj => {
        const report = obj.data;
        const index = obj.originalIndex; 
        const statusText = report.status || "Pending";
        
        const tr = document.createElement("tr");
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

document.getElementById("reportSearch")?.addEventListener("input", () => { pageState.reports = 1; loadReports(); });
document.getElementById("reportFilter")?.addEventListener("change", () => { pageState.reports = 1; loadReports(); });
document.getElementById("reportLimit")?.addEventListener("change", () => { pageState.reports = 1; loadReports(); });

function viewReport(index) {
    const report = reports[index];
    if (!report) return;

    document.getElementById("popupReportId").innerText = report.reportId || "-";
    document.getElementById("popupReportType").innerText = report.type || "Campaign";
    document.getElementById("popupReporterId").innerText = report.reportedBy || "-";
    document.getElementById("popupAgainst").innerText = report.campaignId || "-";
    document.getElementById("popupReason").value = report.reason || "-";
    document.getElementById("popupReportDate").innerText = formatForDashboard(report.date);
    document.getElementById("popupReportStatus").innerText = report.status || "Pending";
    document.getElementById("adminNotes").value = report.adminNotes || "";

    document.getElementById("resolveBtn").onclick = function() {
        report.adminNotes = document.getElementById("adminNotes").value;
        resolveReport(index);
        document.getElementById("reportPopup")?.classList.add("hidden");
    };

    document.getElementById("warnUser").onclick = async function() {
        const note = document.getElementById("adminNotes").value.trim();
        if (note === "") {
            alert("Please write a message in the Admin Notes box first!");
            return;
        }

        const targetEmail = resolveCampaignOwnerEmail(report.campaignId) || resolveUserEmail(report.campaignId);
        if (!targetEmail) {
            alert("Couldn't find an email address for the reported user/campaign.");
            return;
        }

        const response = await fetchAPI("sendAdminEmail", {
            to: targetEmail,
            subject: "⚠ Warning regarding your GiftBloom account",
            message: note,
            token: getAdminToken()
        });

        if (response && response.status === "Success") {
            report.adminNotes = note;
            alert("✅ Warning sent to " + targetEmail);
        } else {
            alert("❌ " + (response?.message || "Failed to send warning."));
        }
    };

    document.getElementById("removeCampaign").onclick = function() {
        const campId = report.campaignId;
        if (confirm("Are you sure you want to permanently delete Campaign " + campId + "?")) {
            const campIndex = campaigns.findIndex(c => c.campaignId === campId);
            if (campIndex !== -1) {
                deleteCampaign(campIndex);
            }
            report.adminNotes = "Campaign deleted by Admin. " + document.getElementById("adminNotes").value;
            resolveReport(index);
            document.getElementById("reportPopup")?.classList.add("hidden");
        }
    };

    document.getElementById("reportPopup")?.classList.remove("hidden");
}

async function resolveReport(index) {
    const report = reports[index];
    if (!report) return;
    if (report.status === "Resolved") {
        alert("This report is already resolved!");
        return;
    }

    const notesField = document.getElementById("adminNotes");
    const response = await fetchAPI("resolveReport", {
        reportId: report.reportId,
        adminNotes: (notesField ? notesField.value.trim() : "") || report.adminNotes || "",
        token: getAdminToken()
    });

    if (response && response.status === "Success") {
        report.status = "Resolved";
        loadReports();
        alert("✅ Report marked as resolved.");
    } else {
        alert("❌ " + (response?.message || "Failed to resolve report."));
    }
}

async function deleteReport(index) {
    if (!reports[index]) return;
    if (!confirm("Delete this report permanently?")) return;
    const report = reports[index];

    const response = await fetchAPI("deleteReport", {
        reportId: report.reportId,
        token: getAdminToken()
    });

    if (response && response.status === "Success") {
        reports.splice(index, 1);
        loadReports();
    } else {
        alert("❌ " + (response?.message || "Failed to delete report."));
    }
}

/*=====================================
        EMAIL CENTER
=====================================*/
const emailHistory = JSON.parse(localStorage.getItem("emailHistory")) || [];

const emailTemplates = {
    pinChanged: {
        subject: "🔐 GiftBloom Admin PIN Updated",
        body: "Hi team,\n\nThe GiftBloom admin secret PIN has just been changed. Please use the new PIN the next time you log in to the admin panel.\n\nIf you don't already have the new PIN, reach out to the Owner directly — for security it isn't included in this message."
    }
};

function resolveUserEmail(idOrEmail) {
    if (!idOrEmail) return null;
    if (idOrEmail.includes("@")) return idOrEmail;
    const user = users.find(u => (u.userId || u.id) === idOrEmail);
    return user ? user.email : null;
}

function resolveCampaignOwnerEmail(campaignId) {
    const campaign = campaigns.find(c => c.campaignId === campaignId);
    if (!campaign) return null;
    const owner = users.find(u => (u.userId || u.id) === campaign.ownerId);
    return owner ? owner.email : null;
}

function resolveDonorEmail(idOrText) {
    if (!idOrText) return null;
    const donation = donations.find(d => d.id === idOrText);
    if (donation && donation.email) return donation.email;
    return idOrText.includes("@") ? idOrText : null;
}

document.getElementById("emailTemplate")?.addEventListener("change", function() {
    const value = this.value;
    if (!value || !emailTemplates[value]) return;
    document.getElementById("emailSubject").value = emailTemplates[value].subject;
    document.getElementById("emailBody").value = emailTemplates[value].body;
});

document.getElementById("previewEmail")?.addEventListener("click", function() {
    document.getElementById("previewSubject").innerText = document.getElementById("emailSubject").value || "(No Subject)";
    document.getElementById("previewBody").value = document.getElementById("emailBody").value || "";
    document.getElementById("emailPopup")?.classList.remove("hidden");
});

document.getElementById("confirmSend")?.addEventListener("click", function() {
    document.getElementById("emailPopup")?.classList.add("hidden");
    document.getElementById("sendEmailBtn")?.click();
});

document.getElementById("clearEmail")?.addEventListener("click", function() {
    document.getElementById("receiverId").value = "";
    document.getElementById("emailTemplate").value = "";
    document.getElementById("emailSubject").value = "";
    document.getElementById("emailBody").value = "";
});

document.getElementById("sendEmailBtn")?.addEventListener("click", async function() {
    const receiverType = document.getElementById("emailReceiver").value;
    const receiverIdRaw = document.getElementById("receiverId").value.trim();
    const subject = document.getElementById("emailSubject").value.trim();
    const body = document.getElementById("emailBody").value.trim();

    if (receiverType === "all") {
        alert("Use the 'Send To All Users' button below to broadcast.");
        return;
    }
    if (subject === "") { alert("Enter subject."); return; }
    if (body === "") { alert("Write email message."); return; }

    if (receiverType === "admin") {
        if (!confirm("Email and in-app notify every Admin/Owner?")) return;
        const response = await fetchAPI("notifyAdminsPinChange", {
            message: body,
            token: getAdminToken()
        });
        if (response && response.status === "Success") {
            alert("✅ " + response.message);
            document.getElementById("emailSubject").value = "";
            document.getElementById("emailBody").value = "";
        } else {
            alert("❌ " + (response?.message || "Failed to notify admins."));
        }
        return;
    }

    if (receiverIdRaw === "") { alert("Select a receiver."); return; }

    let toEmail = null;
    if (receiverType === "single") toEmail = resolveUserEmail(receiverIdRaw);
    else if (receiverType === "campaign") toEmail = resolveCampaignOwnerEmail(receiverIdRaw);
    else if (receiverType === "donor") toEmail = resolveDonorEmail(receiverIdRaw);

    if (!toEmail) {
        alert("Couldn't find an email address for that receiver. Double-check the ID.");
        return;
    }

    const response = await fetchAPI("sendAdminEmail", {
        to: toEmail,
        subject: subject,
        message: body,
        token: getAdminToken()
    });

    emailHistory.push({
        receiver: toEmail,
        subject,
        body,
        date: new Date().toISOString(),
        status: response?.status === "Success" ? "Sent" : "Failed"
    });
    localStorage.setItem("emailHistory", JSON.stringify(emailHistory));
    loadEmailHistory();

    if (response && response.status === "Success") {
        alert("✅ Email sent to " + toEmail);
        document.getElementById("receiverId").value = "";
        document.getElementById("emailSubject").value = "";
        document.getElementById("emailBody").value = "";
    } else {
        alert("❌ " + (response?.message || "Failed to send email."));
    }
});

document.getElementById("sendAllUsers")?.addEventListener("click", async function() {
    const subject = document.getElementById("emailSubject").value.trim();
    const body = document.getElementById("emailBody").value.trim();

    if (subject === "") { alert("Enter subject."); return; }
    if (body === "") { alert("Write email message."); return; }
    if (!confirm("Send this email to every user?")) return;

    const response = await fetchAPI("sendBulkEmail", {
        subject: subject,
        message: body,
        token: getAdminToken()
    });

    if (response && response.status === "Success") {
        emailHistory.push({
            receiver: "All Users",
            subject,
            body,
            date: new Date().toISOString(),
            status: "Sent"
        });
        localStorage.setItem("emailHistory", JSON.stringify(emailHistory));
        loadEmailHistory();
        alert("✅ " + response.message);
    } else {
        alert("❌ " + (response?.message || "Failed to send broadcast."));
    }
});

function loadEmailHistory() {
    const table = document.getElementById("emailHistoryTable");
    if (!table) return;
    table.innerHTML = "";

    emailHistory.slice().reverse().forEach(email => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${formatForDashboard(email.date)}</td>
            <td>${email.receiver}</td>
            <td>${email.subject}</td>
            <td><span class="status active">${email.status}</span></td>
        `;
        table.appendChild(tr);
    });
}

/*=====================================
        ADMIN SETTINGS & DANGER ZONE
=====================================*/
const adminSettings = JSON.parse(localStorage.getItem("adminSettings")) || {
    allowSignup: true,
    allowDonation: true,
    allowCampaign: true,
    maintenance: false,
    autoVerify: false,
    minimumAge: 14,
    minimumDonation: 10
};

const maintenanceBtn = document.getElementById("maintenanceModeBtn");
if (maintenanceBtn) {
    if (adminSettings.maintenance) {
        maintenanceBtn.innerHTML = "🔴 Disable Maintenance Mode";
        maintenanceBtn.style.background = "#e53935";
    }

    maintenanceBtn.onclick = function() {
        adminSettings.maintenance = !adminSettings.maintenance;
        localStorage.setItem("adminSettings", JSON.stringify(adminSettings));
        
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

document.getElementById("logoutAll")?.addEventListener("click", async () => {
    if (!confirm("Log out from all devices?")) return;
    await fetchAPI("logoutAllAdminSessions", { token: getAdminToken() });
    await performAdminLogout();
});

document.getElementById("deleteAllNotifications")?.addEventListener("click", async () => {
    if (!confirm("Clear your notifications?")) return;
    const res = await fetchAPI("clearNotifications", { token: getAdminToken() });
    if (res && res.status === "Success") {
        await loadAllAdminData();
        alert("✅ Notifications cleared.");
    }
});

document.getElementById("saveSystemSettings")?.addEventListener("click", () => {
    adminSettings.currency = document.getElementById("defaultCurrency")?.value || "₹ INR";
    adminSettings.language = document.getElementById("defaultLanguage")?.value || "English";
    localStorage.setItem("adminSettings", JSON.stringify(adminSettings));
    alert("✅ System settings saved.");
});

document.getElementById("saveEmailSettings")?.addEventListener("click", () => {
    alert("✅ Email preferences saved.");
});

/*=====================================
        FLOATING HEARTS & ANIMATION
=====================================*/
const hearts = document.querySelector(".hearts");
if (hearts) {
    for (let i = 0; i < 18; i++) {
        const heart = document.createElement("div");
        heart.className = "heart";
        heart.innerHTML = "❤";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.fontSize = (12 + Math.random() * 18) + "px";
        heart.style.animationDuration = (8 + Math.random() * 8) + "s";
        heart.style.animationDelay = (Math.random() * 5) + "s";
        hearts.appendChild(heart);
    }
}

const cards = document.querySelectorAll(".glass,.section,.stat-card");
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
        }
    });
});
cards.forEach(card => {
    card.style.opacity = "0";
    card.style.transform = "translateY(40px)";
    card.style.transition = ".5s";
    observer.observe(card);
});

/*=====================================
        REFRESH & INITIALIZE
=====================================*/
function refreshDashboard() {
    loadDashboard();
    loadUsers();
    loadActivity();
    loadCampaigns();
    loadDonations();
    loadReports();
    loadAdmins();
    loadEmailHistory();
    loadPaymentHistory();
    loadNotifications();
}

document.addEventListener("DOMContentLoaded", () => {
    // Pre-fill from cached login profile immediately while live fetch runs
    const cachedProfile = JSON.parse(localStorage.getItem("adminProfile") || "null");
    if (cachedProfile) syncAdminProfileUI(cachedProfile);

    const statCards = document.querySelectorAll(".stat-card");
    if (statCards.length >= 4) {
        statCards[0].onclick = () => document.getElementById("usersSection")?.scrollIntoView({ behavior: "smooth" });
        statCards[1].onclick = () => document.getElementById("campaignSection")?.scrollIntoView({ behavior: "smooth" });
        statCards[2].onclick = () => document.getElementById("donationSection")?.scrollIntoView({ behavior: "smooth" });
        statCards[3].onclick = () => document.getElementById("donationSection")?.scrollIntoView({ behavior: "smooth" });
    }

    loadAllAdminData();
});

/*=====================================
        PAYMENT HISTORY
=====================================*/
function getPaymentHistoryData() {
    return donations
        .filter(d => d.status === "Verified" || d.status === "Rejected")
        .map(d => {
            const campaign = campaigns.find(c => c.campaignId === (d.campaignId || d.campaign));
            let txnId = d.transactionId || "-";
            if (!txnId || txnId === "-") {
                const match = /TxnID:\s*(\S+)/.exec(d.adminNotes || "");
                txnId = match ? match[1] : "-";
            }
            return {
                transactionId: txnId,
                donationId: d.id,
                campaignId: d.campaignId || d.campaign || "-",
                ownerId: d.ownerId && d.ownerId !== "-" ? d.ownerId : (campaign ? campaign.ownerId : "-"),
                donorId: d.userId || "-",
                donorName: d.name || "-",
                donorEmail: d.email || "-",
                amount: d.amount || 0,
                status: d.status,
                verifiedBy: d.status === "Verified" ? "Admin" : "-",
                date: d.date
            };
        });
}

function loadPaymentHistory() {
    const paymentHistoryTable = document.getElementById("paymentHistoryTable");
    if (!paymentHistoryTable) return;
    paymentHistoryTable.innerHTML = "";

    const term = document.getElementById("paymentHistorySearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("paymentHistoryFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("paymentLimit")?.value || "5");

    const allPayments = getPaymentHistoryData();

    let filtered = allPayments.map((p, i) => ({ data: p, originalIndex: i })).filter(obj => {
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
            <td>${payment.transactionId || "-"}</td>
            <td>${payment.donationId}</td>
            <td>${payment.campaignId}</td>
            <td>${payment.ownerId}</td>
            <td>${payment.donorId}</td>
            <td>₹${payment.amount}</td>
            <td><span class="status ${payment.status.toLowerCase()}">${payment.status}</span></td>
            <td class="date-cell">${formatForDashboard(payment.date)}</td>
            <td>${payment.verifiedBy || "-"}</td>
            <td>
                <div class="table-actions">
                    <button onclick="viewPayment(${index})">👁 View</button>
                </div>
            </td>
        </tr>`;
    });

    const info = document.getElementById("paymentPageInfo");
    if (info) info.innerText = `Page ${pageState.payments} of ${totalPages}`;
}

document.getElementById("paymentHistorySearch")?.addEventListener("input", () => { pageState.payments = 1; loadPaymentHistory(); });
document.getElementById("paymentHistoryFilter")?.addEventListener("change", () => { pageState.payments = 1; loadPaymentHistory(); });
document.getElementById("paymentLimit")?.addEventListener("change", () => { pageState.payments = 1; loadPaymentHistory(); });

function viewPayment(index) {
    const payment = getPaymentHistoryData()[index];
    if (!payment) return;

    alert(
        "Transaction ID : " + payment.transactionId +
        "\nDonation ID : " + payment.donationId +
        "\nCampaign : " + payment.campaignId +
        "\nOwner : " + payment.ownerId +
        "\nDonor : " + payment.donorId +
        "\nAmount : ₹" + payment.amount +
        "\nStatus : " + payment.status +
        "\nVerified By : " + payment.verifiedBy +
        "\nDate : " + formatForDashboard(payment.date)
    );
}

/*=====================================
    ADMIN PROFILE EDITING (SAVES TO DB)
=====================================*/
document.getElementById("adminPhone")?.addEventListener("input", function() {
    this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

document.getElementById("adminId")?.addEventListener("click", function() {
    alert("Admin ID cannot be edited.");
});

document.querySelectorAll(".editBtn").forEach(btn => {
    btn.onclick = function() {
        const input = document.getElementById(this.dataset.target);
        if (input) {
            input.removeAttribute("readonly");
            input.focus();
        }
    };
});

const saveAdminProfileBtn = document.getElementById("saveAdminProfile");
if (saveAdminProfileBtn) {
    saveAdminProfileBtn.onclick = async function() {
        const currentProfile = {
            name: document.getElementById("adminFullName").value.trim(),
            email: document.getElementById("adminEmail").value.trim(),
            phone: document.getElementById("adminPhone").value.trim()
        };

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^[0-9]{10}$/;

        if (currentProfile.name === "") {
            alert("Name cannot be empty.");
            return;
        }
        if (!emailPattern.test(currentProfile.email)) {
            alert("Please enter a valid email address.");
            return;
        }
        if (!phonePattern.test(currentProfile.phone)) {
            alert("Mobile number must contain exactly 10 digits.");
            return;
        }
        if (
            currentProfile.name === originalProfile.name &&
            currentProfile.email === originalProfile.email &&
            currentProfile.phone === originalProfile.phone
        ) {
            alert("No changes detected.");
            return;
        }

        const originalBtnText = saveAdminProfileBtn.innerHTML;
        saveAdminProfileBtn.innerHTML = "Saving... ⏳";
        saveAdminProfileBtn.disabled = true;

        const response = await fetchAPI("updateAdminProfile", {
            name: currentProfile.name,
            email: currentProfile.email,
            mobile: currentProfile.phone,
            token: getAdminToken()
        });

        saveAdminProfileBtn.innerHTML = originalBtnText;
        saveAdminProfileBtn.disabled = false;

        if (response && response.status === "Success") {
            syncAdminProfileUI(response.data);
            document.getElementById("adminFullName").setAttribute("readonly", true);
            document.getElementById("adminEmail").setAttribute("readonly", true);
            document.getElementById("adminPhone").setAttribute("readonly", true);
            await loadAllAdminData();
            alert("✅ Profile Saved Successfully to Database.");
        } else {
            alert("❌ " + (response?.message || "Failed to save profile."));
        }
    };
}

/*=====================================
    GLOBAL PAGINATION CONTROLLER
=====================================*/
function changePage(type, direction) {
    pageState[type] += direction;
    if (type === 'users') loadUsers();
    if (type === 'admins') loadAdmins();
    if (type === 'campaigns') loadCampaigns();
    if (type === 'donations') loadDonations();
    if (type === 'reports') loadReports();
    if (type === 'emails') loadEmailHistory();
    if (type === 'payments') loadPaymentHistory();
    if (type === 'notifications') loadNotifications();
}

/*=====================================
    NOTIFICATIONS
=====================================*/
function loadNotifications() {
    const table = document.getElementById("notificationTable");
    if (!table) return;
    table.innerHTML = "";

    const term = document.getElementById("notifSearch")?.value.toLowerCase() || "";
    const limit = parseInt(document.getElementById("notifLimit")?.value || "5");

    let filtered = notifications.map((n, i) => ({ data: n, originalIndex: i })).filter(obj => {
        const text = JSON.stringify(obj.data).toLowerCase();
        return text.includes(term);
    });

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.notifications > totalPages) pageState.notifications = totalPages;
    if (pageState.notifications < 1) pageState.notifications = 1;

    const start = (pageState.notifications - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

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

    const pageInfo = document.getElementById("notifPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.notifications} of ${totalPages}`;
}

document.getElementById("notifSearch")?.addEventListener("input", () => { pageState.notifications = 1; loadNotifications(); });
document.getElementById("notifLimit")?.addEventListener("change", () => { pageState.notifications = 1; loadNotifications(); });

/*=====================================
    USERS WITH PAGINATION (ROLE-AWARE)
=====================================*/
function loadUsers() {
    const userTable = document.getElementById("userTable");
    if (!userTable) return;
    userTable.innerHTML = "";

    const term = document.getElementById("userSearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("userFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("userLimit")?.value || "5");

    let filtered = users.map((u, i) => ({ data: u, originalIndex: i }))
        .filter(obj => (obj.data.role || "User") === "User")
        .filter(obj => {
            const text = JSON.stringify(obj.data).toLowerCase();
            const matchesSearch = text.includes(term);
            const matchesFilter = filterStatus === "all" || (obj.data.status || "active").toLowerCase().includes(filterStatus);
            return matchesSearch && matchesFilter;
        });
    
    if (filtered.length === 0) {
        userTable.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px;">No users found.</td></tr>`;
        const uInfo = document.getElementById("userPageInfo");
        if (uInfo) uInfo.innerText = `Page 1 of 1`;
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
        
        const uId = user.userId || user.id || "Unknown";
        const uName = user.name || user.fullName || "Unknown";

        const campaignCount = campaigns.filter(c => c.ownerId === uId || c.ownerId === user.email).length;
        const donationCount = donations.filter(d => d.userId === uId || (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase())).length;

        const alreadyPromoted = users.some(u => u.email.toLowerCase() === (user.email || "").toLowerCase() && (u.role === "Admin" || u.role === "Owner"));

        const makeAdminCell = alreadyPromoted
            ? `<button disabled title="Already has an admin account">✅ Is Admin</button>`
            : `<button onclick="makeAdminPrompt(${index})" style="background:#6a4dff;">🛡 Make Admin</button>`;

        const suspendCell = user.status === "Suspended"
            ? `<button onclick="toggleUserSuspension(${index})">✅ Activate</button>`
            : `<button onclick="toggleUserSuspension(${index})">🚫 Suspend</button>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${uId}</td>
            <td>${uName}</td>
            <td>${user.email || "-"}</td>
            <td>${campaignCount}</td>
            <td>${donationCount}</td>
            <td><span class="status ${user.status?.toLowerCase() || "active"}">${user.status || "Active"}</span></td>
            <td>
                <div class="table-actions">
                    <button onclick="viewUser(${index})">👁 View</button>
                    <button onclick="emailUser(${index})">📧 Email</button>
                    ${makeAdminCell}
                    ${suspendCell}
                    <button onclick="deleteUser(${index})">🗑 Delete</button>
                </div>
            </td>
        `;
        userTable.appendChild(tr);
    });

    const pageInfo = document.getElementById("userPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.users} of ${totalPages}`;
}

function loadAdmins() {
    const adminTable = document.getElementById("adminTable");
    if (!adminTable) return;
    adminTable.innerHTML = "";

    const term = document.getElementById("adminSearch")?.value.toLowerCase() || "";
    const filterStatus = document.getElementById("adminFilter")?.value.toLowerCase() || "all";
    const limit = parseInt(document.getElementById("adminLimit")?.value || "5");

    let filtered = users.map((u, i) => ({ data: u, originalIndex: i }))
        .filter(obj => obj.data.role === "Admin" || obj.data.role === "Owner")
        .filter(obj => {
            const text = JSON.stringify(obj.data).toLowerCase();
            const matchesSearch = text.includes(term);
            const matchesFilter = filterStatus === "all" || (obj.data.status || "active").toLowerCase().includes(filterStatus);
            return matchesSearch && matchesFilter;
        });

    filtered.sort((a, b) => (a.data.role === "Owner" ? -1 : b.data.role === "Owner" ? 1 : 0));

    if (filtered.length === 0) {
        adminTable.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No admins found.</td></tr>`;
        const aInfo = document.getElementById("adminPageInfo");
        if (aInfo) aInfo.innerText = `Page 1 of 1`;
        return;
    }

    const totalPages = Math.ceil(filtered.length / limit) || 1;
    if (pageState.admins > totalPages) pageState.admins = totalPages;
    if (pageState.admins < 1) pageState.admins = 1;

    const start = (pageState.admins - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    paginated.forEach(obj => {
        const user = obj.data;
        const index = obj.originalIndex;
        const uId = user.userId || user.id || "Unknown";
        const uName = user.name || user.fullName || "Unknown";
        const isOwnerRow = user.role === "Owner";

        const actionCell = isOwnerRow
            ? `<span class="status active">👑 Owner</span>`
            : `<button onclick="removeAdminPrompt(${index})" style="background:#e53935;">🔻 Remove Admin</button>`;

        const suspendCell = isOwnerRow ? `` : (
            user.status === "Suspended"
                ? `<button onclick="toggleUserSuspension(${index})">✅ Activate</button>`
                : `<button onclick="toggleUserSuspension(${index})">🚫 Suspend</button>`
        );

        const tr = document.createElement("tr");
        if (isOwnerRow) tr.classList.add("pinned-row");
        tr.innerHTML = `
            <td>${uId}</td>
            <td>${uName}</td>
            <td>${user.email || "-"}</td>
            <td>${isOwnerRow ? "👑 Owner" : "🛡 Admin"}</td>
            <td><span class="status ${user.status?.toLowerCase() || "active"}">${user.status || "Active"}</span></td>
            <td>
                <div class="table-actions">
                    <button onclick="viewUser(${index})">👁 View</button>
                    <button onclick="emailUser(${index})">📧 Email</button>
                    ${actionCell}
                    ${suspendCell}
                </div>
            </td>
        `;
        adminTable.appendChild(tr);
    });

    const pageInfo = document.getElementById("adminPageInfo");
    if (pageInfo) pageInfo.innerText = `Page ${pageState.admins} of ${totalPages}`;
}

/*=====================================
        VIEW USER POPUP (WITH WIRED BUTTONS)
=====================================*/
function viewUser(index) {
    const user = users[index];
    if (!user) return;

    const uId = user.userId || user.id || "-";
    const role = user.role || "User";
    const isStaffRow = role === "Admin" || role === "Owner";

    document.getElementById("popupUserId").innerText = uId;
    const roleEl = document.getElementById("popupRole");
    if (roleEl) roleEl.innerText = role;
    document.getElementById("popupName").innerText = user.name || user.fullName || "-";
    document.getElementById("popupEmail").innerText = user.email || "-";
    document.getElementById("popupPhone").innerText = user.mobile || user.phone || "-";
    document.getElementById("popupDob").innerText = user.dob || "-";
    document.getElementById("popupJoin").innerText = formatForDashboard(user.joinDate);
    document.getElementById("popupCampaigns").innerText = isStaffRow ? "—" : campaigns.filter(c => c.ownerId === uId || c.ownerId === user.email).length;
    document.getElementById("popupDonations").innerText = isStaffRow ? "—" : donations.filter(d => d.userId === uId || (d.email && user.email && d.email.toLowerCase() === user.email.toLowerCase())).length;
    document.getElementById("popupStatus").innerText = user.status || "Active";

    const emailBtn = document.getElementById("popupEmailBtn");
    if (emailBtn) {
        emailBtn.onclick = () => {
            document.getElementById("userPopup")?.classList.add("hidden");
            emailUser(index);
        };
    }

    const suspendBtn = document.getElementById("popupSuspendBtn");
    if (suspendBtn) {
        suspendBtn.style.display = role === "Owner" ? "none" : "inline-block";
        suspendBtn.innerText = user.status === "Suspended" ? "✅ Activate" : "🚫 Suspend";
        suspendBtn.onclick = () => {
            document.getElementById("userPopup")?.classList.add("hidden");
            toggleUserSuspension(index);
        };
    }

    const deleteBtn = document.getElementById("popupDeleteBtn");
    if (deleteBtn) {
        deleteBtn.style.display = isStaffRow ? "none" : "inline-block";
        deleteBtn.onclick = () => {
            document.getElementById("userPopup")?.classList.add("hidden");
            deleteUser(index);
        };
    }

    document.getElementById("userPopup")?.classList.remove("hidden");
}

/*=====================================
        MAKE / REMOVE ADMIN
=====================================*/
let pendingMakeAdminUserId = null;

function makeAdminPrompt(index) {
    const user = users[index];
    if (!user) return;

    if (user.role === "Admin" || user.role === "Owner") {
        alert("This user already has admin access.");
        return;
    }
    const alreadyPromoted = users.some(u => u.email.toLowerCase() === (user.email || "").toLowerCase() && (u.role === "Admin" || u.role === "Owner"));
    if (alreadyPromoted) {
        alert("This user already has an admin account linked to this email.");
        return;
    }

    pendingMakeAdminUserId = user.userId || user.id;

    const emailEl = document.getElementById("makeAdminEmail");
    const messageEl = document.getElementById("makeAdminMessage");
    if (emailEl) emailEl.innerText = user.email || "-";
    if (messageEl) {
        messageEl.value =
`Hello ${user.name || user.fullName || "there"},

You've been given admin access on GiftBloom.

• Login ID: ${user.email}
• Temporary Password: same as your existing GiftBloom account password (you will be asked to set a new Admin password on your first login)
• Secret PIN: included in the official email

With Love,
The GiftBloom Team ❤️`;
    }

    document.getElementById("makeAdminPopup")?.classList.remove("hidden");
}

document.querySelectorAll(".closeMakeAdminPopup").forEach(btn => {
    btn.onclick = () => {
        document.getElementById("makeAdminPopup")?.classList.add("hidden");
        pendingMakeAdminUserId = null;
    };
});

document.getElementById("confirmMakeAdmin")?.addEventListener("click", async function() {
    if (!pendingMakeAdminUserId) return;
    const response = await fetchAPI("makeUserAdmin", {
        userId: pendingMakeAdminUserId,
        token: getAdminToken()
    });
    document.getElementById("makeAdminPopup")?.classList.add("hidden");
    if (response && response.status === "Success") {
        alert((response.data && response.data.emailSent === false ? "⚠️ " : "✅ ") + response.message);
        loadAllAdminData();
    } else {
        alert("❌ " + (response?.message || "Failed to promote user."));
    }
    pendingMakeAdminUserId = null;
});

async function removeAdminPrompt(index) {
    const user = users[index];
    if (!user || user.role !== "Admin") return;

    const displayName = user.name || user.fullName || user.email || "this admin";
    if (!confirm(`Remove admin access from ${displayName}? Their regular account, campaigns, and donations are unaffected — this only removes their admin login.`)) return;

    const response = await fetchAPI("removeAdminAccess", {
        adminUserId: user.userId || user.id,
        token: getAdminToken()
    });

    if (response && response.status === "Success") {
        alert("✅ " + response.message);
        loadAllAdminData();
    } else {
        alert("❌ " + (response?.message || "Failed to remove admin access."));
    }
}

/*=====================================
        DATE FORMATTING
=====================================*/
function parseDateSafely(dateStr) {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
    let str = String(dateStr).trim();
    if (str.includes(',')) {
        let parts = str.split(',');
        let dateParts = parts[0].trim().split('/');
        if (dateParts.length === 3) {
            let day = parseInt(dateParts[0], 10);
            let month = parseInt(dateParts[1], 10) - 1;
            let year = parseInt(dateParts[2], 10);
            let timeParts = (parts[1] || "").trim().split(':');
            let hours = parseInt(timeParts[0], 10) || 0;
            let minutes = parseInt(timeParts[1], 10) || 0;
            let seconds = parseInt(timeParts[2], 10) || 0;
            let d = new Date(year, month, day, hours, minutes, seconds);
            return isNaN(d.getTime()) ? null : d;
        }
    }
    let parsed = new Date(str);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function formatForDashboard(dateString) {
    if (!dateString) return "N/A";
    const d = parseDateSafely(dateString);
    if (!d) return String(dateString);
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
        if (statusText === "Pending") {
            actionButtons += `
            <button onclick="verifyDonation(${index})">✅ Verify</button>
            <button onclick="rejectDonation(${index})">❌ Reject</button>`;
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${donation.id || "-"}</td>
            <td>${donation.campaignId || donation.campaign || "-"}</td>
            <td>${donation.name || donation.userId || "-"}</td>
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

document.getElementById("donationSearch")?.addEventListener("input", () => { pageState.donations = 1; loadDonations(); });
document.getElementById("donationFilter")?.addEventListener("change", () => { pageState.donations = 1; loadDonations(); });
document.getElementById("donationLimit")?.addEventListener("change", () => { pageState.donations = 1; loadDonations(); });

/*=====================================
      MOBILE MENU & SIDEBAR NAVIGATION
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.querySelector(".sidebar");

if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sidebar.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove("show");
        }
    });
}

document.querySelectorAll(".sidebar li").forEach(item => {
    item.onclick = function() {
        if (this.id === "sidebarLogoutBtn") return;

        document.querySelectorAll(".sidebar li").forEach(i => i.classList.remove("active"));
        this.classList.add("active");

        const target = this.dataset.target;
        const section = target === "dashboardSection" ? document.getElementById("top") : document.getElementById(target);
        if (section) {
            section.scrollIntoView({ behavior: "smooth" });
        }

        if (sidebar && sidebar.classList.contains("show")) {
            sidebar.classList.remove("show");
        }
    };
});

document.querySelectorAll(".user-admin-tabs .tab-btn").forEach(btn => {
    btn.onclick = function() {
        document.querySelectorAll(".user-admin-tabs .tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        this.classList.add("active");
        document.getElementById(this.dataset.tab)?.classList.add("active");
    };
});

document.getElementById("adminSearch")?.addEventListener("input", () => { pageState.admins = 1; loadAdmins(); });
document.getElementById("adminFilter")?.addEventListener("change", () => { pageState.admins = 1; loadAdmins(); });
document.getElementById("adminLimit")?.addEventListener("change", () => { pageState.admins = 1; loadAdmins(); });

/*=====================================
        ADMIN LOGOUT
=====================================*/
async function performAdminLogout() {
    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({ action: "logoutSession", data: { token: getAdminToken() } })
        });
    } catch (e) { console.log("Session cleanup failed: " + e); }
    localStorage.removeItem("adminLogin");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminProfile");
    sessionStorage.removeItem("adminLogin");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminRole");
    alert("Session ended. You'll be redirected to the home page.");
    window.location.href = "index.html";
}

document.getElementById("logoutBtn")?.addEventListener("click", performAdminLogout);

const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
if (sidebarLogoutBtn) {
    sidebarLogoutBtn.onclick = async function() {
        if (!confirm("Are you sure you want to logout?")) return;
        await performAdminLogout();
    };
}
