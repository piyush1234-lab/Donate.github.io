/*=====================================
      API ENDPOINT & AUTH
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbyspj1ezHNVn6e0AFTDqhPNHJAnclSB9sbVCLeVOfRIla_RpWuBVJr7jViB1zm-RyD-/exec";

// Check both localStorage (Remember Me) and sessionStorage (standard login)
const isPersistentLogin = localStorage.getItem("isLoggedIn") === "true";
const isSessionLogin = sessionStorage.getItem("isLoggedIn") === "true";
const currentUserStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

const isLoggedIn = (isPersistentLogin || isSessionLogin) && currentUser && (currentUser.userId || currentUser.id);

/*=====================================
        DYNAMIC AUTH MENU
=====================================*/
function updateNavbar() {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";
    const menu = document.getElementById("menu");

    if (!menu) return;

    if (loggedIn) {
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
        MOBILE MENU & INTERACTIONS
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => menu.classList.toggle("show"));
}

document.querySelectorAll("#menu a").forEach(link => {
    link.addEventListener("click", () => menu?.classList.remove("show"));
});

document.addEventListener("click", (e) => {
    if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.classList.remove("show");
    }
});

/*=====================================
      INTERSECTION OBSERVERS
=====================================*/
const progressBars = document.querySelectorAll(".fill");
const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;
            bar.style.width = "0%";
            setTimeout(() => { bar.style.width = width; }, 150);
            progressObserver.unobserve(bar);
        }
    });
}, { threshold: 0.5 });
progressBars.forEach(bar => progressObserver.observe(bar));

const reveals = document.querySelectorAll(".card, .step, .stat, .cta-box");
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
        }
    });
}, { threshold: 0.15 });

reveals.forEach(item => {
    item.style.opacity = "0";
    item.style.transform = "translateY(40px)";
    item.style.transition = ".7s ease";
    revealObserver.observe(item);
});

/*=====================================
        BUTTON RIPPLE & TILT
=====================================*/
document.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", function (e) {
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        const rect = this.getBoundingClientRect();
        ripple.style.left = e.clientX - rect.left + "px";
        ripple.style.top = e.clientY - rect.top + "px";
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

function initCardTilt() {
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateY = (x - rect.width / 2) / 20;
            const rotateX = (rect.height / 2 - y) / 20;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });
}

/*=====================================
      NAVBAR & HEARTS ANIMATION
=====================================*/
const navbar = document.querySelector(".navbar");
if (navbar) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.style.background = "rgba(255,255,255,.75)";
            navbar.style.backdropFilter = "blur(20px)";
            navbar.style.boxShadow = "0 12px 30px rgba(0,0,0,.12)";
        } else {
            navbar.style.background = "rgba(255,255,255,.35)";
            navbar.style.backdropFilter = "blur(15px)";
            navbar.style.boxShadow = "0 15px 40px rgba(0,0,0,.08)";
        }
    });
}

const heartsContainer = document.querySelector(".hearts");
if (heartsContainer) {
    for (let i = 0; i < 18; i++) {
        let heart = document.createElement("div");
        heart.className = "heart";
        heart.innerHTML = "❤";
        heart.style.left = Math.random() * 100 + "vw";
        heart.style.animationDuration = 8 + Math.random() * 8 + "s";
        heart.style.animationDelay = Math.random() * 5 + "s";
        heart.style.fontSize = 10 + Math.random() * 18 + "px";
        heartsContainer.appendChild(heart);
    }
}

/*=====================================
      ANIMATE STATS COUNTER
=====================================*/
function animateCounters() {
    const counters = document.querySelectorAll(".counter");
    counters.forEach(counter => {
        let target = +counter.dataset.target;
        let count = 0;
        let speed = target / 60;
        if (speed < 1 && target > 0) speed = 1;

        let update = () => {
            count += speed;
            if (count < target) {
                counter.innerText = Math.ceil(count);
                requestAnimationFrame(update);
            } else {
                counter.innerText = target;
            }
        };

        if (target > 0) update();
        else counter.innerText = "0";
    });
}

/*=====================================
      LOAD DATABASE CAMPAIGNS & STATS
=====================================*/
async function fetchHomepageData(isReload = false) {
    const campaignsContainer = document.getElementById("trendingCampaigns");

    const startSpin = () => {
        const icon = document.getElementById("reloadIcon");
        if (icon) icon.classList.add("spinning");
    };
    const stopSpin = () => {
        const icon = document.getElementById("reloadIcon");
        if (icon) icon.classList.remove("spinning");
    };

    if (isReload) {
        startSpin();
    } else if (campaignsContainer) {
        campaignsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading live campaigns... ⏳</div>`;
    }

    await new Promise(r => setTimeout(r, 20));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const minSpinTime = new Promise(res => setTimeout(res, 500));

    try {
        const [response] = await Promise.all([
            fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({ action: "getAllCampaigns" }),
                signal: controller.signal
            }),
            minSpinTime
        ]);

        clearTimeout(timeoutId);
        const result = await response.json();

        if (result.status === "Success") {
            calculateAndRenderStats(result.data);
            renderTrendingCampaigns(result.data, campaignsContainer);
        } else {
            throw new Error("Failed to load");
        }
    } catch (error) {
        clearTimeout(timeoutId);
        await minSpinTime;

        const errorMsg = error.name === 'AbortError'
            ? "Server is taking too long. Please try again."
            : "Network error. Please try again.";

        if (campaignsContainer) {
            campaignsContainer.innerHTML = `
                <p style="text-align:center; color: #666; grid-column: 1/-1;">
                    ${errorMsg}
                    <button onclick="triggerReload()" id="reloadIcon" class="reload-btn" title="Try Again">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4d8d" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                            <polyline points="21 3 21 9 15 9" />
                        </svg>
                    </button>
                </p>`;
        }
    } finally {
        stopSpin();
    }
}

window.triggerReload = function () {
    fetchHomepageData(true);
};

/*=====================================
      CALCULATE REAL STATS
=====================================*/
function calculateAndRenderStats(allCampaigns) {
    let totalCampaigns = allCampaigns.length;
    let totalDonors = 0;
    let totalRaised = 0;
    let totalCompleted = 0;

    allCampaigns.forEach(c => {
        const raised = Number(c.raisedAmount) || 0;
        const target = Number(c.targetAmount) || 0;
        const donors = Number(c.donorsCount) || 0;

        totalDonors += donors;
        totalRaised += raised;

        if (c.status === "Completed" || (target > 0 && raised >= target)) {
            totalCompleted++;
        }
    });

    const statCampaigns = document.getElementById("stat-campaigns");
    const statDonors = document.getElementById("stat-donors");
    const statRaised = document.getElementById("stat-raised");
    const statCompleted = document.getElementById("stat-completed");

    if (statCampaigns) statCampaigns.dataset.target = totalCampaigns;
    if (statDonors) statDonors.dataset.target = totalDonors;
    if (statRaised) statRaised.dataset.target = totalRaised;
    if (statCompleted) statCompleted.dataset.target = totalCompleted;

    animateCounters();
}

/*=====================================
      RENDER TRENDING CARDS (TOP 10)
=====================================*/
function renderTrendingCampaigns(campaigns, containerElement) {
    const container = containerElement || document.getElementById("trendingCampaigns");
    if (!container) return;

    let activeCampaigns = campaigns.filter(c => c.status === "Active");
    activeCampaigns.sort((a, b) => (Number(b.donorsCount) || 0) - (Number(a.donorsCount) || 0));
    activeCampaigns = activeCampaigns.slice(0, 10);

    container.innerHTML = "";

    if (activeCampaigns.length === 0) {
        container.innerHTML = `
            <div class="glass" style="padding: 40px; text-align: center; grid-column: 1 / -1;">
                <h3 style="color: #ff4d8d; font-size: 24px; margin-bottom: 10px;">No Active Campaigns 😔</h3>
                <p style="color: #666;">Be the first one to create a beautiful memory!</p>
                <button class="primary" style="max-width: 200px; margin-top: 20px;" onclick="window.location.href='create.html'">
                    ➕ Create Now
                </button>
            </div>
        `;
        return;
    }

    activeCampaigns.forEach((campaign) => {
        const raised = Number(campaign.raisedAmount) || 0;
        const target = Number(campaign.targetAmount) || 0;

        let percent = target > 0 ? Math.round((raised / target) * 100) : 0;
        if (percent > 100) percent = 100;

        let displayImage = 'images/teddy.jpg';
        if (campaign.giftImageUrl && campaign.giftImageUrl.trim() !== "") {
            displayImage = campaign.giftImageUrl.trim();
            if (displayImage.includes("drive.google.com")) {
                let fileId = "";
                if (displayImage.includes("/file/d/")) {
                    fileId = displayImage.split("/file/d/")[1].split("/")[0];
                } else if (displayImage.includes("id=")) {
                    fileId = displayImage.split("id=")[1].split("&")[0];
                }
                if (fileId) {
                    displayImage = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
                }
            }
        }

        let adminBadge = "";
        if (campaign.adminStatus === "Approved" || campaign.verified === true || campaign.verified === "true") {
            adminBadge = `<span style="background:#e3fcef; color:#0b8a38; border:1px solid #0b8a38; font-size:11px; padding:2px 8px; border-radius:12px; margin-left:6px; display:inline-block; vertical-align:middle;">✅ Verified</span>`;
        }

        container.innerHTML += `
        <div class="glass card">
            <div class="card-image">
                <img src="${displayImage}" alt="Gift" onerror="this.onerror=null; this.src='images/teddy.jpg';">
                <div class="badge">❤️ Trending</div>
            </div>
            <div class="content">
                <div style="margin-bottom: 8px;">
                    <span style="background: rgba(255, 77, 141, 0.1); border: 1px solid rgba(255, 77, 141, 0.3); color: #ff4d8d; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; display: inline-block; letter-spacing: 0.5px;">
                        🆔 ${campaign.campaignId}
                    </span>
                </div>
                
                <h3 style="margin-top: 5px;">${campaign.gift || 'Surprise Gift'} ${adminBadge}</h3>
                <p class="receiver">For ${campaign.receiver || 'Someone Special'} ❤️</p>
                
                <div class="progress-details">
                    <span>${percent}%</span>
                    <span>₹${raised} / ₹${target}</span>
                </div>
                <div class="progress">
                    <div class="fill" style="width:${percent}%;"></div>
                </div>
                <div class="card-footer">
                    <span>👥 ${campaign.donorsCount || 0} Donors</span>
                    <span>⏳ Active</span>
                </div>
                <button onclick="window.location.href='campaigns.html?id=${campaign.campaignId}'">
                    View Campaign →
                </button>
            </div>
        </div>
        `;
    });

    if (typeof initCardTilt === "function") initCardTilt();
}

fetchHomepageData();

/*=====================================
          GEMINI CHATBOT API
=====================================*/
const chatbotToggle = document.getElementById("chatbotToggle");
const chatbotWindow = document.getElementById("chatbotWindow");
const closeChat = document.getElementById("closeChat");
const chatBody = document.getElementById("chatBody");
const chatInput = document.getElementById("chatInput");
const sendChat = document.getElementById("sendChat");

let chatHistory = [];

if (closeChat && chatbotWindow) {
    closeChat.addEventListener("click", () => {
        chatbotWindow.style.display = "none";
    });
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
    msgDiv.innerText = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function showStarterSuggestions() {
    if (chatHistory.length > 0) return;
    const starters = [
        "Suggest a birthday gift! 🎂",
        "How do I create a campaign? 🤔",
        "What are the trending gifts? 🎁"
    ];
    appendActionButtons(starters);
}

function stripActionsTag(text) {
    if (!text) return "";
    return text.replace(/\[ACTIONS:.*?\]/gi, '').trim();
}

/*----- Page buttons the AI can suggest -----
  The backend asks Gemini to end a reply with a tag like  [ACTIONS: create, browse]
  Each key inside it becomes its own button that OPENS the matching page.
  (Allowed keys are the ones listed in askAI() in the backend.) */
const ACTION_PAGES = {
    create:    { label: "➕ Create Campaign",  url: "create.html" },
    browse:    { label: "👀 Browse Campaigns", url: "allCampaigns.html" },
    login:     { label: "🔑 Login",            url: "login.html" },
    signup:    { label: "📝 Sign Up",          url: "signup.html" },
    dashboard: { label: "📊 My Dashboard",     url: "dashboard(combined).html" }
};

// "[ACTIONS: create, browse]"  ->  ["create", "browse"]  (unknown keys are ignored)
function detectSuggestedActions(text) {
    if (!text) return [];
    const keys = [];
    for (const m of text.matchAll(/\[ACTIONS:(.*?)\]/gi)) {
        m[1].split(",").forEach(part => {
            const key = part.trim().toLowerCase();
            if (Object.prototype.hasOwnProperty.call(ACTION_PAGES, key) && !keys.includes(key)) keys.push(key);
        });
    }
    return keys;
}

// Buttons that open a page when tapped (used for the AI's [ACTIONS: ...] suggestions)
function appendPageButtons(keys) {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";

    // The AI can't see if the visitor is logged in, so tidy the list here
    keys = keys
        .map(k => (!loggedIn && k === "dashboard") ? "login" : k)         // dashboard needs a login
        .filter(k => !(loggedIn && (k === "login" || k === "signup")))    // already logged in
        .filter((k, i, all) => all.indexOf(k) === i);                     // no duplicates
    if (keys.length === 0) return;

    const container = document.createElement("div");
    container.className = "chat-buttons";

    keys.forEach(key => {
        const btn = document.createElement("button");
        btn.className = "chat-action-btn";
        btn.textContent = ACTION_PAGES[key].label;
        btn.onclick = () => { window.location.href = ACTION_PAGES[key].url; };
        container.appendChild(btn);
    });

    chatBody.appendChild(container);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// Quick-question chips (tapping one SENDS that question to the assistant)
function appendActionButtons(actions) {
    if (!actions || actions.length === 0) return;

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "8px";
    container.style.flexWrap = "wrap";
    container.style.marginTop = "8px";
    container.style.marginBottom = "8px";

    actions.forEach(action => {
        const btn = document.createElement("button");
        btn.innerText = action;
        btn.style.padding = "6px 12px";
        btn.style.borderRadius = "15px";
        btn.style.border = "1px solid #ff4d8d";
        btn.style.background = "#fff0f5";
        btn.style.color = "#ff4d8d";
        btn.style.cursor = "pointer";
        btn.style.fontSize = "13px";
        btn.style.transition = "0.2s";

        btn.onmouseover = () => btn.style.background = "#ffe6ef";
        btn.onmouseout = () => btn.style.background = "#fff0f5";

        btn.onclick = () => {
            chatInput.value = action.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
            handleChatSend();
            container.remove();
        };
        container.appendChild(btn);
    });

    chatBody.appendChild(container);
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function fetchGeminiResponse(userText) {
    const loadingDiv = document.createElement("div");
    loadingDiv.classList.add("message", "bot-message", "loading-dots");
    loadingDiv.innerText = "Typing...";
    chatBody.appendChild(loadingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            redirect: "follow",
            body: JSON.stringify({
                action: "askAI",
                data: { userText: userText, history: chatHistory }
            })
        });
        const result = await response.json();
        loadingDiv.remove();

        if (result.status === "Success") {
            const cleanReply = stripActionsTag(result.data.reply);
            if (cleanReply) appendMessage(cleanReply, "bot");
            appendPageButtons(detectSuggestedActions(result.data.reply));

            chatHistory.push({ role: "user", text: userText });
            chatHistory.push({ role: "model", text: result.data.reply });

            if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
        } else {
            appendMessage(result.message || "I'm sorry, I couldn't process that right now.", "bot");
        }
    } catch (error) {
        loadingDiv.remove();
        console.error("Fetch/Network Error:", error);
        appendMessage("Oops! I'm having trouble connecting to the server.", "bot");
    }
}

function handleChatSend() {
    const text = chatInput.value.trim();
    if (text === "") return;

    appendMessage(text, "user");
    chatInput.value = "";
    fetchGeminiResponse(text);
}

if (sendChat && chatInput) {
    sendChat.addEventListener("click", handleChatSend);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleChatSend();
    });
}

/*=====================================
      FESTIVAL DATA & LOCATION
=====================================*/
const FIXED_NATIONAL_DAYS = {
    "01-26": "Happy Republic Day! 🇮🇳",
    "08-15": "Happy Independence Day! 🇮🇳",
    "10-02": "Happy Gandhi Jayanti! 🙏",
    "12-25": "Merry Christmas! 🎄",
};

const REGIONAL_FESTIVALS = {
    "Kali Puja": ["West Bengal"],
    "Poila Boishakh": ["West Bengal"],
    "Ganesh Chaturthi": ["Maharashtra", "Goa", "Karnataka", "Telangana"],
    "Gudi Padwa": ["Maharashtra"],
    "Teej": ["Rajasthan"],
    "Hartalika Teej": ["Rajasthan"],
    "Kajari Teej": ["Rajasthan"],
    "Gangaur": ["Rajasthan"],
    "Garba": ["Gujarat"],
    "Onam": ["Kerala"],
    "Vishu": ["Kerala"],
    "Pongal": ["Tamil Nadu"],
    "Bihu": ["Assam"],
    "Baisakhi": ["Punjab"],
    "Lohri": ["Punjab", "Haryana", "Himachal Pradesh"],
    "Bathukamma": ["Telangana"],
    "Bonalu": ["Telangana"],
    "Chhath Puja": ["Bihar", "Jharkhand", "Uttar Pradesh"],
    "Rath Yatra": ["Odisha"],
    "Nuakhai": ["Odisha"],
    "Hornbill Festival": ["Nagaland"],
    "Losar": ["Sikkim"],
    "Janmasthmi" : ["Uttar Pradesh", "West Bengal"]
};

const GIFT_DAYS = /valentine|mother|father|friendship|teacher|women|children/i;
const SKIP_EVENTS = /punyatithi|shaheed|muharram|good friday|jamat ul-vida|equinox|shortest day|bank'?s holiday/i;

const DUSSEHRA_GREETING = "Happy Dussehra! 🏹 Shubho Bijoya — may good always win 🌟";

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function findRegionalMatch(eventName) {
    const key = Object.keys(REGIONAL_FESTIVALS).find(name =>
        eventName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(eventName.toLowerCase())
    );
    return key ? REGIONAL_FESTIVALS[key] : null;
}

function fileEntryDate(key) {
    return new Date(key.split(", ").slice(0, 2).join(", "));
}

const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function findFileDates(data, year, test) {
    const dates = [];
    for (const month of Object.values(data[year] || {})) {
        for (const [key, e] of Object.entries(month)) {
            if (e && test(e)) dates.push(fileEntryDate(key));
        }
    }
    return dates.sort((a, b) => a - b);
}

function getNavratriWindow(data, year) {
    const withTag = re => findFileDates(data, year, e => re.test(e.extras || ""));
    const pratipada = withTag(/Ashwina, Shukla Pratipada/);
    const ashtami = withTag(/Ashwina, Shukla Ashtami/);
    const navami = withTag(/Ashwina, Shukla Navami/);
    const named = findFileDates(data, year, e => /dussehra|vijayadashami|dasara/i.test(e.event || ""));
    const last = list => list[list.length - 1];

    const dussehra = named[0]
        || (navami.length && addDays(last(navami), 1))
        || (ashtami.length && addDays(last(ashtami), 2))
        || (pratipada.length && addDays(pratipada[0], 9));
    if (!dussehra) return null;

    let start = addDays(dussehra, -9);
    if (pratipada.length) {
        const gap = Math.round((dussehra - pratipada[0]) / 864e5);
        if (gap >= 7 && gap <= 11) start = pratipada[0];
    }
    return { start, dussehra };
}

function getNavratriGreeting(data, now) {
    const w = getNavratriWindow(data, now.getFullYear());
    if (!w) return null;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sinceStart = Math.round((today - w.start) / 864e5);
    const toDussehra = Math.round((w.dussehra - today) / 864e5);
    if (sinceStart === -1) return "Shubho Mahalaya! 🙏 Maa Durga is on her way 🪔";
    if (sinceStart >= 0 && toDussehra >= 1) return "Happy Navratri! 🪔";
    if (toDussehra === 0) return DUSSEHRA_GREETING;
    return null;
}

async function loadCalendar(year) {
    const cacheKey = `festivalCache_${year}`;
    const cacheTimeKey = `festivalCacheTime_${year}`;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let cachedData = null, fresh = false;
    try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
            cachedData = JSON.parse(raw);
            fresh = (Date.now() - Number(localStorage.getItem(cacheTimeKey))) < ONE_DAY;
        }
    } catch (e) { cachedData = null; }
    if (cachedData && fresh) return cachedData;

    try {
        const res = await fetch(`https://jayantur13.github.io/calendar-bharat/calendar/${year}.json`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (e) {}
        return data;
    } catch (e) {
        console.log("[festival] calendar load failed:", e.message);
        return cachedData;
    }
}

async function getTodaysFestival(userState) {
    const q = new URLSearchParams(location.search);
    let now = new Date();
    const testDate = q.get("testDate");
    if (testDate) {
        const t = new Date(testDate + "T12:00:00");
        if (!isNaN(t)) now = t;
    }
    userState = q.get("testState") || userState;

    const pad = n => String(n).padStart(2, "0");
    const fixedLine = FIXED_NATIONAL_DAYS[`${pad(now.getMonth() + 1)}-${pad(now.getDate())}`] || null;

    const year = now.getFullYear();
    const calendarData = await loadCalendar(year);

    const navLine = calendarData ? getNavratriGreeting(calendarData, now) : null;

    if (navLine || fixedLine) return [navLine, fixedLine].filter(Boolean).join("<br>");

    if (!calendarData) return null;

    const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const yearData = calendarData[year] || calendarData[String(year)];
    const monthData = yearData ? yearData[monthYear] : null;
    if (!monthData) return null;

    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString("en-US", { month: "long" });
    const matchKey = Object.keys(monthData).find(k => k.startsWith(`${monthName} ${dayNum},`));
    if (!matchKey) return null;

    const entry = monthData[matchKey];
    if (!entry || !entry.event) return null;

    if (/Ashwina, Shukla Dashami/.test(entry.extras || "")) return DUSSEHRA_GREETING;

    if (SKIP_EVENTS.test(entry.event)) return null;
    if (entry.type === "Good to know" && !GIFT_DAYS.test(entry.event)) return null;

    const restriction = findRegionalMatch(entry.event);
    if (restriction) {
        if (userState && restriction.some(s => userState.toLowerCase().includes(s.toLowerCase()))) {
            return `Happy ${escapeHtml(entry.event)}! 🎉`;
        }
        return null;
    }

    return `Happy ${escapeHtml(entry.event)}! 🎉`;
}

async function detectUserLocation() {
    const lastFetched = localStorage.getItem("userStateTimestamp");
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (lastFetched && (Date.now() - Number(lastFetched)) < ONE_DAY) return;

    try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!res.ok) throw new Error("GeoJS response not OK");
        const geo = await res.json();
        const state = geo.region || null;

        if (state) {
            localStorage.setItem("userState", state);
            localStorage.setItem("userStateTimestamp", Date.now());
            return;
        } else {
            throw new Error("GeoJS returned no region");
        }
    } catch (e) {}

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geo = await res.json();
            const state = geo.principalSubdivision || null;

            if (state) {
                localStorage.setItem("userState", state);
                localStorage.setItem("userStateTimestamp", Date.now());
            }
        } catch (e) {}
    }, (err) => {}, { timeout: 8000, maximumAge: ONE_DAY });
}

function getStoredUserState() {
    return localStorage.getItem("userState") || null;
}

detectUserLocation();

/*=====================================
      DYNAMIC WELCOME MESSAGE
=====================================*/
function getStoredUserName() {
    try {
        const userJson = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
        if (!userJson) return null;
        const user = JSON.parse(userJson);
        return user.name || null;
    } catch (e) {
        return null;
    }
}

function appendHtmlMessage(html) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", "bot-message");
    msgDiv.innerHTML = html;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

async function buildWelcomeMessage() {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true" || sessionStorage.getItem("isLoggedIn") === "true";
    const userName = getStoredUserName();
    const userState = getStoredUserState();

    let occasionLine = null;
    try {
        occasionLine = await getTodaysFestival(userState);
    } catch (e) {}

    const greeting = loggedIn && userName
        ? `Hi ${escapeHtml(userName)}! 👋`
        : `Hi there! 👋 Welcome to GiftBloom.`;

    let lines = [greeting];
    if (occasionLine) lines.push(occasionLine);

    if (loggedIn) {
        lines.push("I am here to help you choose the suitable gift for your friend and can help you explore the GiftBloom page.");
        appendHtmlMessage(lines.join("<br>"));
    } else {
        appendHtmlMessage(lines.join("<br>"));
        appendHtmlMessage(`Want to be a part of the <strong>GiftBloom family</strong>? <a href="signup.html" style="color:#ff4d8d; font-weight:600; text-decoration:underline;">Join us here →</a>`);
        appendHtmlMessage(`Already a member? <a href="login.html" style="color:#ff4d8d; font-weight:600; text-decoration:underline;">Login here →</a>`);
    }
}

/*=====================================
      CHATBOT TOGGLE
=====================================*/
let chatOpened = false;
if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener("click", () => {
        const isClosed = chatbotWindow.style.display === "none" || chatbotWindow.style.display === "";
        chatbotWindow.style.display = isClosed ? "flex" : "none";

        if (chatbotWindow.style.display === "flex" && !chatOpened) {
            chatOpened = true;
            buildWelcomeMessage().then(showStarterSuggestions);
        }
    });
}
