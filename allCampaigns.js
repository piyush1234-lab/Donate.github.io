/*=====================================
    GIFTBLOOM API CONNECTION
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbxyVajhdo-ZT_N5px_hqM2fFWNqpAu3yw6YRZDhK0_3jQ_eLdzKYhnvyfeQyxuGP_jS/exec";

/*=====================================
    LOGIN STATUS & USER DATA
=====================================*/
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

let currentTab = "Active"; // Tracks Live, Completed, or Blocked
let globalCampaignsData = []; // Will hold the data from the cloud

/*=====================================
    INITIALIZE DROPDOWN & URL CHECK
=====================================*/
const sortDropdown = document.getElementById("campaignSort");

if (sortDropdown) {
    sortDropdown.innerHTML = `
        <option value="Trending">🔥 Trending (Highest Raised)</option>
        <option value="All">📅 All Campaigns (Newest)</option>
        <option value="MyCampaigns">👤 My Campaigns</option>
    `;

    const urlParams = new URLSearchParams(window.location.search);
    const directSort = urlParams.get('sort');

    if (directSort === "MyCampaigns") {
        if (!isLoggedIn) {
            alert("Please login to view your campaigns.");
            window.location.href = "login.html";
        } else {
            sortDropdown.value = "MyCampaigns";
        }
    } else if (directSort === "Trending" || directSort === "All") {
        sortDropdown.value = directSort;
    } else {
        sortDropdown.value = "Trending"; 
    }
}

/*=====================================
    FETCH CAMPAIGNS FROM CLOUD
=====================================*/
async function loadAllCampaignsFromCloud() {
    const container = document.getElementById("campaignList");
    if (!container) return;

    // Show Loading UI
    container.innerHTML = `
        <div style="text-align:center; width:100%; padding:40px; color:#666;">
            <h2>Loading Campaigns... ⏳</h2>
            <p>Fetching the latest gifts from the cloud.</p>
        </div>
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "getAllCampaigns" // Make sure this action exists in your Google Apps Script!
            })
        });

        const result = await response.json();

        if (result.status === "Success") {
            // Standardize the data fields so they match your frontend design
            globalCampaignsData = result.data.map(c => ({
                ...c,
                target: c.targetAmount || c.target || c.goal,
                raised: c.raisedAmount || c.raised || 0,
                image: c.giftImageUrl || c.giftImage || c.image,
                gift: c.giftName || c.gift,
                status: c.status || "Active"
            }));
            
            // Auto-update Completed status based on targets
            globalCampaignsData.forEach(c => {
                if (c.status === "Active" && Number(c.target) > 0 && Number(c.raised) >= Number(c.target)) {
                    c.status = "Completed";
                }
            });

            renderCampaigns();
        } else {
            container.innerHTML = `<p style="text-align:center; width:100%; color:#d60000;">❌ ${result.message}</p>`;
        }
    } catch (error) {
        console.error("Fetch error:", error);
        container.innerHTML = `<p style="text-align:center; width:100%; color:#d60000;">❌ Network Error. Please check your connection.</p>`;
    }
}

/*=====================================
    CHANGE TAB HELPER
=====================================*/
function changeTab(status) {
    currentTab = status;
    renderCampaigns(); 
}

/*=====================================
    RENDER CAMPAIGNS (CORE LOGIC)
=====================================*/
function renderCampaigns() {
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    const activeTabBtn = document.getElementById(`tab-${currentTab}`);
    if (activeTabBtn) activeTabBtn.classList.add("active");

    const container = document.getElementById("campaignList");
    if (!container) return;
    container.innerHTML = "";

    // Filter by Tab AND remove "Hidden" campaigns from public view
    let tabFiltered = globalCampaignsData.filter(c => c.status === currentTab && c.status !== "Hidden");

    // Calculate Trending (Top 3 highest raised in the current tab)
    const trendingCampaignIds = [...tabFiltered]
        .sort((a, b) => Number(b.raised) - Number(a.raised))
        .slice(0, 3)
        .map(c => c.campaignId);

    let filtered = [...tabFiltered];
    const sortType = sortDropdown ? sortDropdown.value : "Trending";

    // Handle "My Campaigns" Auth Check
    if (sortType === "MyCampaigns" && !isLoggedIn) {
        alert("Please login to view your campaigns.");
        if (sortDropdown) sortDropdown.value = "Trending"; 
        window.location.href = "login.html";
        return; 
    }

    if (sortType === "MyCampaigns" && isLoggedIn && currentUser) {
        filtered = filtered.filter(c => c.ownerId === currentUser.userId || c.ownerId === currentUser.email || c.ownerId === currentUser.id);
    } 
    
    // Apply Sorting
    if (sortType === "Trending") {
        filtered.sort((a, b) => Number(b.raised) - Number(a.raised));
    } else if (sortType === "All") {
        // Reverse to show newest first (assuming array is chronologically appended)
        filtered.reverse(); 
    }

    // Empty State
    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#888; margin-top:40px; font-size:18px;">No campaigns found in this view ❤️</p>`;
        return;
    }

    // Render Cards
    filtered.forEach((c) => {
        let trendingBadge = "";
        if (trendingCampaignIds.includes(c.campaignId) && Number(c.raised) > 0) {
            let badgeColors = "background:#fff0f3; color:#ff2b4a; border:1px solid #ff2b4a;";             
            trendingBadge = `<span class="badge" style="${badgeColors}">🔥 Trending</span>`;
        }

             let adminBadge = "";
        // Match the backend property 'adminStatus'
        if (c.adminStatus === "Approved") {
            adminBadge = `<span class="badge" style="background:#e3fcef; color:#0b8a38; border:1px solid #0b8a38; margin-left:8px;">✅ Verified</span>`;
        }
        
 // 👉 GOOGLE DRIVE IMAGE FIX (Matching campaign.js exactly)
        let displayImage = 'images/teddy.jpg'; // Default fallback

        if (campaign.giftImageUrl && campaign.giftImageUrl.trim() !== "") {
            displayImage = campaign.giftImageUrl.trim();

            // Convert 'uc?id=' to a web-safe thumbnail URL
            if (displayImage.includes("drive.google.com/uc?id=")) {
                let fileId = displayImage.split("id=")[1].split("&")[0]; // Extract the ID safely
                displayImage = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
            }
        }
        container.innerHTML += `
        <div class="card">
             <img src="${displayImage}" alt="Gift" onerror="this.onerror=null; this.src='images/teddy.jpg';">
            
            <div style="margin:10px 0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span class="badge">🆔 ${c.campaignId || "ID"}</span>
                    ${adminBadge}
                </div>
                ${trendingBadge}
            </div>
            
            <h3>${c.gift || "Gift Campaign"}</h3>
            <p>For: ${c.receiver || "Someone Special"}</p>
            <p style="font-size:13px; color:#666; margin-top:5px;">💰 Raised: ₹${c.raised} / ₹${c.target}</p>
            
            <button onclick="window.location.href='campaigns.html?id=${c.campaignId}'" style="width:100%; padding:10px; border:none; border-radius:10px; background:#ff4d8d; color:white; margin-top:10px; cursor:pointer; font-weight:bold;">
                View Campaign →
            </button>
        </div>`;
    });
}

/*=====================================
        DYNAMIC AUTH MENU
=====================================*/
function updateNavbar() {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const menu = document.getElementById("menu");

    if (!menu) return;

    if (isLoggedIn) {
        menu.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="allCampaigns.html?sort=MyCampaigns">My Campaigns</a></li>
            <li><a href="dashboard(combined).html">Dashboard</a></li>
            <li><a class="signup" href="dashboard(combined).html?target=profile">Profile</a></li>
        `;
    } else {
        menu.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="allCampaigns.html">Campaigns</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a class="signup" href="signup.html">Sign Up</a></li>
        `;
    }
}
updateNavbar();

/*=====================================
        MOBILE MENU TOGGLE
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (menuBtn && menu) {
    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        menu.classList.toggle("show");
    });

    document.querySelectorAll("#menu a").forEach(link => {
        link.addEventListener("click", () => {
            menu.classList.remove("show");
        });
    });

    document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
            menu.classList.remove("show");
        }
    });
}

// 🔥 KICK OFF THE FETCH ON PAGE LOAD
loadAllCampaignsFromCloud();
