/*=====================================
      API ENDPOINT & AUTH
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbxyVajhdo-ZT_N5px_hqM2fFWNqpAu3yw6YRZDhK0_3jQ_eLdzKYhnvyfeQyxuGP_jS/exec";

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
const isLoggedIn = currentUser && (currentUser.userId || currentUser.id);

/*=====================================
      OPTIMIZED CANVAS LOADER
=====================================*/
const loaderCanvas = document.getElementById('loaderCanvas');
let loaderAnimId = null;

if (loaderCanvas) {
    const ctx = loaderCanvas.getContext('2d');
    const cw = loaderCanvas.width = 300;
    const ch = loaderCanvas.height = 300;
    const cx = cw / 2;
    const cy = ch / 2 - 20;

    const loggedInUser = currentUser?.name || "";
    const nameEl = document.getElementById('loaderName');
    if (nameEl) {
        nameEl.textContent = loggedInUser ? loggedInUser : "Loading...";
    }

    const HEART_RES = 256;
    const hpx = new Float32Array(HEART_RES);
    const hpy = new Float32Array(HEART_RES);

    for (let i = 0; i < HEART_RES; i++) {
        const t = (i / HEART_RES) * Math.PI * 2;
        hpx[i] = 16 * Math.pow(Math.sin(t), 3);
        hpy[i] = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    }

    const N = 200; // Optimized particle count for smooth 60fps
    const particles = [];
    const colors = ['#ff4d8d', '#ff2b74d', '#4740ff', '#ff1493', '#ff84b7', '#ffb3d9', '#ff40a8'];

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
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.globalCompositeOperation = 'lighter';

        const cycle = (time * 0.0013) % 1;
        let pulse = 0;
        if (cycle < 0.12) pulse = Math.sin((cycle / 0.12) * Math.PI);
        else if (cycle > 0.18 && cycle < 0.35) pulse = 0.5 * Math.sin(((cycle - 0.18) / 0.17) * Math.PI);
        const hs = 2.25 * (1 + pulse * 0.15);

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
            let diff = (activeIndex - p.targetIndex + HEART_RES) % HEART_RES;

            if (diff < 25) {
                const intensity = 1 - (diff / 25);
                ctx.arc(p.x, p.y, p.size * (1 + intensity * 0.6), 0, Math.PI * 2);
                ctx.fillStyle = '#ff2b74';
                ctx.fill();
            } else {
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            }
        }

        loaderAnimId = requestAnimationFrame(animateLoader);
    }

    window.startLoaderCanvas = function () {
        if (!loaderAnimId) {
            loaderAnimId = requestAnimationFrame(animateLoader);
        }
    };

    window.stopLoaderCanvas = function () {
        if (loaderAnimId) {
            cancelAnimationFrame(loaderAnimId);
            loaderAnimId = null;
        }
    };
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
    const loader = document.getElementById("pageLoader");

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
    } else {
        const hasVisitedBefore = sessionStorage.getItem("giftbloomVisited") === "true";

        if (hasVisitedBefore && loader) {
            loader.style.display = "flex";
            loader.classList.remove("fade-out");
            if (typeof window.startLoaderCanvas === "function") window.startLoaderCanvas();
        } else {
            sessionStorage.setItem("giftbloomVisited", "true");
        }

        if (campaignsContainer) {
            campaignsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading live campaigns... ⏳</div>`;
        }
    }

    // Yield control to let browser render loader UI immediately before fetching
    await new Promise(r => setTimeout(r, 20));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const minSpinTime = new Promise(res => setTimeout(res, 500));

    try {
        const [response] = await Promise.all([
            fetch(API_URL, {
                method: "POST",
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
        if (loader && loader.style.display !== "none") {
            loader.classList.add("fade-out");
            setTimeout(() => {
                loader.style.display = "none";
                if (typeof window.stopLoaderCanvas === "function") window.stopLoaderCanvas();
            }, 600);
        }
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
            if (displayImage.includes("drive.google.com/uc?id=")) {
                let fileId = displayImage.split("id=")[1].split("&")[0];
                displayImage = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
            }
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
                
                <h3 style="margin-top: 5px;">${campaign.gift || 'Surprise Gift'}</h3>
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

// Trigger initial homepage data fetch
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

function detectSuggestedActions(text) {
    if (!text) return [];
    const matches = [...text.matchAll(/\[ACTIONS:(.*?)\]/gi)];
    return matches.map(m => m[1].trim());
}

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
            appendMessage(cleanReply, "bot");
            appendActionButtons(detectSuggestedActions(result.data.reply));

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
    "10-2": "Happy Gandhi Jayanti! 🙏",
    "12-25": "Merry Christmas! 🎄",
};

const REGIONAL_FESTIVALS = {
    "Durga Puja": ["West Bengal", "Tripura", "Assam", "Odisha"],
    "Kali Puja": ["West Bengal"],
    "Poila Boishakh": ["West Bengal"],
    "Ganesh Chaturthi": ["Maharashtra", "Goa", "Karnataka", "Telangana"],
    "Gudi Padwa": ["Maharashtra"],
    "Teej": ["Rajasthan"],
    "Hartalika Teej": ["Rajasthan"],
    "Kajari Teej": ["Rajasthan"],
    "Gangaur": ["Rajasthan"],
    "Navratri": ["Gujarat"],
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
};

function findRegionalMatch(eventName) {
    const key = Object.keys(REGIONAL_FESTIVALS).find(name =>
        eventName.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(eventName.toLowerCase())
    );
    return key ? REGIONAL_FESTIVALS[key] : null;
}

async function getTodaysFestival(userState) {
    const now = new Date();
    const fixedKey = `${now.getMonth() + 1}-${now.getDate()}`;
    if (FIXED_NATIONAL_DAYS[fixedKey]) return FIXED_NATIONAL_DAYS[fixedKey];

    const year = now.getFullYear();
    const cacheKey = `festivalCache_${year}`;
    const cacheTimeKey = `festivalCacheTime_${year}`;
    const ONE_DAY = 24 * 60 * 60 * 1000;

    let calendarData = null;
    const cached = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(cacheTimeKey);

    if (cached && cachedTime && (Date.now() - Number(cachedTime)) < ONE_DAY) {
        calendarData = JSON.parse(cached);
    } else {
        try {
            const res = await fetch(`https://jayantur13.github.io/calendar-bharat/calendar/${year}.json`);
            calendarData = await res.json();
            localStorage.setItem(cacheKey, JSON.stringify(calendarData));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
        } catch (e) {
            return null;
        }
    }
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
    if (!entry || entry.type === "Good to know") return null;

    const restriction = findRegionalMatch(entry.event);
    if (restriction) {
        if (userState && restriction.some(s => userState.toLowerCase().includes(s.toLowerCase()))) {
            return `Happy ${entry.event}! 🎉`;
        }
        return null;
    }

    return `Happy ${entry.event}! 🎉`;
}

async function detectUserLocation() {
    const lastFetched = localStorage.getItem("userStateTimestamp");
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (lastFetched && (Date.now() - Number(lastFetched)) < ONE_DAY) return;

    // 1. Try GeoJS first (silent, no permission popup)
    try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!res.ok) throw new Error("GeoJS response not OK");
        const geo = await res.json();
        const state = geo.region || null; // e.g. "West Bengal"

        if (state) {
            console.log("✅ GeoJS working — state detected:", state);
            localStorage.setItem("userState", state);
            localStorage.setItem("userStateTimestamp", Date.now());
            return; // success, no need for fallback
        } else {
            throw new Error("GeoJS returned no region");
        }
    } catch (e) {
        console.log("❌ GeoJS failed:", e.message, "— falling back to navigator.geolocation");
    }

    // 2. Fallback: navigator.geolocation (will show browser permission popup)
    if (!navigator.geolocation) {
        console.log("❌ navigator.geolocation not supported on this browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const { latitude, longitude } = pos.coords;
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geo = await res.json();
            const state = geo.principalSubdivision || null;

            if (state) {
                console.log("✅ navigator.geolocation working — state detected:", state);
                localStorage.setItem("userState", state);
                localStorage.setItem("userStateTimestamp", Date.now());
            } else {
                console.log("⚠️ navigator.geolocation succeeded but reverse-geocode returned no state");
            }
        } catch (e) {
            console.log("❌ navigator.geolocation reverse-geocode failed:", e.message);
        }
    }, (err) => {
        console.log("❌ navigator.geolocation denied or unavailable:", err.message);
        // fail silently — chatbot just skips state-specific occasion lines
    }, { timeout: 8000, maximumAge: ONE_DAY });
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
        const userJson = localStorage.getItem("currentUser");
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
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    const userName = getStoredUserName();
    const userState = getStoredUserState();
    const occasionLine = await getTodaysFestival(userState);

    const greeting = isLoggedIn && userName
        ? `Hi ${userName}! 👋`
        : `Hi there! 👋 Welcome to GiftBloom.`;

    let lines = [greeting];
    if (occasionLine) lines.push(occasionLine);

    if (isLoggedIn) {
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
