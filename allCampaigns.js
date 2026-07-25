/*=====================================
    LOGIN STATUS & USER DATA
=====================================*/
const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;

let currentTab = "Active"; // Tracks Live, Completed, or Blocked

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
    CHANGE TAB HELPER
=====================================*/
function changeTab(status) {
    currentTab = status;
    renderCampaigns(); 
}

/*=====================================
    AUTO-UPDATE STATUS LOGIC
=====================================*/
function autoUpdateStatuses() {
    let all = JSON.parse(localStorage.getItem("myCampaigns")) || [];
    let databaseChanged = false;

    all.forEach(c => {
        let raised = Number(c.raised || 0);
        let target = Number(c.target || c.goal || 0);
        let status = c.status || "Active";

        // Don't auto-update campaigns the Admin manually hid!
        if (status === "Active" && target > 0 && raised >= target) {
            c.status = "Completed";
            databaseChanged = true;
        }
    });

    if (databaseChanged) {
        localStorage.setItem("myCampaigns", JSON.stringify(all));
    }
}

/*=====================================
    RENDER CAMPAIGNS (CORE LOGIC)
=====================================*/
function renderCampaigns() {
    autoUpdateStatuses();

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    const activeTabBtn = document.getElementById(`tab-${currentTab}`);
    if (activeTabBtn) activeTabBtn.classList.add("active");

    const all = JSON.parse(localStorage.getItem("myCampaigns")) || [];
    const container = document.getElementById("campaignList");
    if (!container) return;
    container.innerHTML = "";

    // 🌟 ADMIN FIX 1: Filter by Tab AND completely remove "Hidden" campaigns from public view!
    let tabFiltered = all.filter(c => (c.status || "Active") === currentTab && c.status !== "Hidden");

    const trendingCampaignIds = [...tabFiltered]
        .sort((a, b) => Number(b.raised || 0) - Number(a.raised || 0))
        .slice(0, 3)
        .map(c => c.campaignId);

    let filtered = [...tabFiltered];
    const sortType = sortDropdown ? sortDropdown.value : "Trending";

    if (sortType === "MyCampaigns" && !isLoggedIn) {
        alert("Please login to view your campaigns.");
        if (sortDropdown) sortDropdown.value = "Trending"; 
        window.location.href = "login.html";
        return; 
    }

    if (sortType === "MyCampaigns" && isLoggedIn && currentUser) {
        // Includes the new `currentUser.id` we set up in signup!
        filtered = filtered.filter(c => c.ownerId === currentUser.userId || c.ownerId === currentUser.email || c.ownerId === currentUser.id);
    } 
    
    if (sortType === "Trending") {
        filtered.sort((a, b) => Number(b.raised || 0) - Number(a.raised || 0));
    } else if (sortType === "All") {
        filtered.reverse(); 
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p style="text-align:center; width:100%; color:#888; margin-top:20px;">No campaigns found in this view.</p>`;
        return;
    }

    filtered.forEach((c) => {
        const originalIndex = all.findIndex(item => item.campaignId === c.campaignId);

        let trendingBadge = "";
        if (trendingCampaignIds.includes(c.campaignId) && Number(c.raised || 0) > 0) {
            let badgeColors = "background:#fff0f3; color:#ff2b4a; border:1px solid #ff2b4a;";             
            trendingBadge = `<span class="badge" style="${badgeColors}">🔥 Trending</span>`;
        }

        // 🌟 ADMIN FIX 2: Create the Admin Approved Badge!
        let adminBadge = "";
        if (c.adminApproved === true) {
            adminBadge = `<span class="badge" style="background:#e3fcef; color:#0b8a38; border:1px solid #0b8a38; margin-left:8px;">✅ Verified</span>`;
        }

        container.innerHTML += `
        <div class="card">
            <img src="${c.giftImage || c.image || 'images/teddy.jpg'}">
            
            <div style="margin:10px 0; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <span class="badge">🆔 ${c.campaignId || "ID"}</span>
                    ${adminBadge} <!-- Injects badge if approved -->
                </div>
                ${trendingBadge}
            </div>
            
            <h3>${c.gift || c.giftName || "Gift Campaign"}</h3>
            <p>For: ${c.receiver || "Someone Special"}</p>
            <p style="font-size:13px; color:#666; margin-top:5px;">💰 Raised: ₹${c.raised || 0} / ₹${c.target || c.goal || 0}</p>
            
            <button onclick="window.location.href='campaigns.html?id=${originalIndex}'" style="width:100%; padding:10px; border:none; border-radius:10px; background:#ff4d8d; color:white; margin-top:10px; cursor:pointer; font-weight:bold;">
                View Campaign →
            </button>
        </div>`;
    });
}

// Initial Load
renderCampaigns();

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
            <li><a class="signup" href="profile.html">Profile</a></li>
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
