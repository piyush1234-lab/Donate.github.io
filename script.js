/*=====================================
      API ENDPOINT
=====================================*/
const API_URL = "https://script.google.com/macros/s/AKfycbz3j7pEIhMfam_dVATTNJe6rHAaMNUAz55ywLqEj4XDJ5qb6hygrvGQQfSj2x1KLtRM/exec";

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
    
    if (campaignsContainer) {
        campaignsContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading live campaigns... ⏳</div>`;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ action: "getAllCampaigns" })
        });
        const result = await response.json();

        if (result.status === "Success") {
            const allCampaigns = result.data;
            
            // 1. Calculate and Render Stats
            calculateAndRenderStats(allCampaigns);
            
            // 2. Render Active Trending Campaigns
            renderTrendingCampaigns(allCampaigns, campaignsContainer);
        } else {
            if (campaignsContainer) campaignsContainer.innerHTML = `<p style="text-align:center;">Failed to load campaigns.</p>`;
        }
    } catch (error) {
        if (campaignsContainer) campaignsContainer.innerHTML = `<p style="text-align:center;">Network error. Please try again.</p>`;
    }
}

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
      RENDER TRENDING CARDS
=====================================*/
function renderTrendingCampaigns(allCampaigns, container) {
    if (!container) return;

    const activeCampaigns = allCampaigns.filter(c => c.status === "Active");
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

        const displayImage = (campaign.giftImageUrl && campaign.giftImageUrl.length > 10) 
            ? campaign.giftImageUrl 
            : 'images/teddy.jpg';

        container.innerHTML += `
        <div class="glass card">
            <div class="card-image">
                <img src="${displayImage}" alt="Gift">
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
