/*=====================================
      API ENDPOINT
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbwhYo3cFhQ-lIy_ogq7imn8knXp3knIDBa9MCH8WeOdD2EnXAouUdf8D5gIA9NIhL4l/exec";

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
        MOBILE MENU
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (menuBtn && menu) {
    menuBtn.addEventListener("click", () => {
        menu.classList.toggle("show");
    });
}

/*=====================================
      CLOSE MENU ON LINK CLICK
=====================================*/
document.querySelectorAll("#menu a").forEach(link => {
    link.addEventListener("click", () => {
        if (menu) menu.classList.remove("show");
    });
});

/*=====================================
    CLOSE MENU WHEN CLICK OUTSIDE
=====================================*/
document.addEventListener("click", (e) => {
    if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.classList.remove("show");
    }
});

/*=====================================
      PROGRESS BAR ANIMATION
=====================================*/
const progressBars = document.querySelectorAll(".fill");

const progressObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bar = entry.target;
            const width = bar.style.width;

            bar.style.width = "0%";

            setTimeout(() => {
                bar.style.width = width;
            }, 150);

            progressObserver.unobserve(bar);
        }
    });
}, { threshold: 0.5 });

progressBars.forEach(bar => progressObserver.observe(bar));

/*=====================================
      SCROLL REVEAL
=====================================*/
const reveals = document.querySelectorAll(".card, .step, .stat, .cta-box");

const revealObserver = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
        if(entry.isIntersecting){
            entry.target.style.opacity="1";
            entry.target.style.transform="translateY(0)";
        }
    });
}, { threshold: 0.15 });

reveals.forEach(item=>{
    item.style.opacity="0";
    item.style.transform="translateY(40px)";
    item.style.transition=".7s ease";
    revealObserver.observe(item);
});

/*=====================================
        BUTTON RIPPLE
=====================================*/
document.querySelectorAll("button").forEach(btn=>{
    btn.addEventListener("click",function(e){
        const ripple=document.createElement("span");
        ripple.className="ripple";

        const rect=this.getBoundingClientRect();
        ripple.style.left=e.clientX-rect.left+"px";
        ripple.style.top=e.clientY-rect.top+"px";

        this.appendChild(ripple);

        setTimeout(()=>{
            ripple.remove();
        },600);
    });
});

/*=====================================
      HERO FLOAT
=====================================*/
const gift=document.querySelector(".gift");
if (gift) {
    let angle=0;
    setInterval(()=>{
        angle+=0.02;
        gift.style.transform= `translateY(${Math.sin(angle)*8}px) rotate(${Math.sin(angle)*4}deg)`;
    }, 30);
}

/*=====================================
      SMOOTH SCROLL
=====================================*/
document.querySelectorAll('a[href^="#"]').forEach(anchor=>{
    anchor.addEventListener("click",function(e){
        const target=document.querySelector(this.getAttribute("href"));
        if(target){
            e.preventDefault();
            target.scrollIntoView({ behavior:"smooth" });
        }
    });
});

/*=====================================
        CARD TILT
=====================================*/
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
      NAVBAR SCROLL EFFECT
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

/*=====================================
      BACKGROUND HEARTS
=====================================*/
const heartsContainer = document.querySelector(".hearts");
if (heartsContainer) {
    for(let i=0; i<18; i++){
        let heart=document.createElement("div");
        heart.className="heart";
        heart.innerHTML="❤";
        heart.style.left=Math.random()*100+"vw";
        heart.style.animationDuration= 8+Math.random()*8+"s";
        heart.style.animationDelay= Math.random()*5+"s";
        heart.style.fontSize= 10+Math.random()*18+"px";
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
        }
        
        if(target > 0) {
            update();
        } else {
            counter.innerText = "0";
        }
    });
}


/*=====================================
      LOAD DATABASE CAMPAIGNS & STATS
=====================================*/
async function fetchHomepageData() {
    const campaignsContainer = document.getElementById("trendingCampaigns");
    const loader = document.getElementById("pageLoader"); 
    
    if (campaignsContainer) {
        campaignsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading live campaigns... ⏳</div>`;
    }

    // 1. Create a 10-second strict timer (Kill Switch)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); 

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getAllCampaigns" }),
            signal: controller.signal // Link timer to fetch
        });
        
        clearTimeout(timeoutId); // Turn off timer if successful

        const result = await response.json();

        if (result.status === "Success") {
            const allCampaigns = result.data;
            calculateAndRenderStats(allCampaigns);
            renderTrendingCampaigns(allCampaigns, campaignsContainer);
        } else {
            throw new Error("Failed to load");
        }
    } catch (error) {
        clearTimeout(timeoutId); 
        
        const errorMsg = error.name === 'AbortError' 
            ? "Server is taking too long. Please try again." 
            : "Network error. Please try again.";

        if (campaignsContainer) campaignsContainer.innerHTML = `
            <p style="text-align:center; color: #666;">
                ${errorMsg} 
                <span onclick="triggerReload()" style="cursor: pointer; font-size: 1.4em; display: inline-block; vertical-align: middle; margin-left: 8px; transition: transform 0.4s ease;" onmouseover="this.style.transform='rotate(180deg)'" onmouseout="this.style.transform='rotate(0deg)'" title="Try Again">🔄</span>
            </p>`;
    } finally {
        // 2. ALWAYS hide the loader the exact millisecond the fetch finishes!
        if (loader && loader.style.display !== "none") {
            loader.classList.add("fade-out");
            setTimeout(() => {
                loader.style.display = "none";
            }, 600);
        }
    }
}

/*=====================================
        TRIGGER RELOAD ANIMATION
=====================================*/
window.triggerReload = function() {
    const loader = document.getElementById("pageLoader");
    
    // Just show the loader and start the fetch immediately. 
    // fetchHomepageData() will handle turning it off!
    if (loader) {
        loader.style.display = "flex";
        loader.classList.remove("fade-out");
    }

    fetchHomepageData();
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

    // Trigger animation only after data is mapped
    animateCounters();
}

/*=====================================
      RENDER TRENDING CARDS (TOP 10)
=====================================*/
function renderTrendingCampaigns(allCampaigns, container) {
    if (!container) return;

    // 1. Filter only active campaigns
    let activeCampaigns = allCampaigns.filter(c => c.status === "Active");

    // 2. Sort by highest number of donors to make it truly "Trending"
    activeCampaigns.sort((a, b) => (Number(b.donorsCount) || 0) - (Number(a.donorsCount) || 0));

    // 3. Slice to only keep the top 10 campaigns
    activeCampaigns = activeCampaigns.slice(0, 10);

    container.innerHTML = "";

    if (activeCampaigns.length === 0) {
        container.innerHTML = `
            <div class="glass" style="padding: 40px; text-align: center; grid-column: 1 / -1;">
                <h3 style="color: #ff4d8d; font-size: 24px; margin-bottom: 10px;">No Campaigns Alive 😔</h3>
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
// Trigger the database fetch immediately when the page loads
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

// Toggle Window Visibility
if (chatbotToggle && chatbotWindow) {
    chatbotToggle.addEventListener("click", () => {
        chatbotWindow.style.display = chatbotWindow.style.display === "none" ? "flex" : "none";
    });
}

if (closeChat && chatbotWindow) {
    closeChat.addEventListener("click", () => {
        chatbotWindow.style.display = "none";
    });
}

// Helper Function: Append Messages
function appendMessage(text, sender) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
    msgDiv.innerText = text;
    chatBody.appendChild(msgDiv);
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
            body: JSON.stringify({ action: "askAI", data: { userText: userText } })
        });
        const result = await response.json();
        loadingDiv.remove();

        if (result.status === "Success") {
            appendMessage(result.data.reply, "bot");
        } else {
            appendMessage("I'm sorry, I couldn't process that right now.", "bot");
        }
    } catch (error) {
        loadingDiv.remove();
        console.error("Fetch/Network Error:", error);
        appendMessage("Oops! I'm having trouble connecting to the server.", "bot");
    }
}

// Handle Send Action
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
        if (e.key === "Enter") {
            handleChatSend();
        }
    });
}
