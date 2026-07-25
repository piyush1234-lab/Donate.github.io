/* =================================================================
   SECTION 1: UPDATE THE NAVIGATION MENU (LOGIN VS DASHBOARD)
================================================================= */
function updateNavbar() {
    let loggedInStatus = localStorage.getItem("isLoggedIn");
    let menuElement = document.getElementById("menu");

    if (menuElement === null) return; 

    if (loggedInStatus === "true") {
        menuElement.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="allCampaigns.html">Campaigns</a></li>
            <li><a href="dashboard(combined).html">Dashboard</a></li>
            <li><a class="signup" href="profile.html">Profile</a></li>
        `;
    } else {
        menuElement.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="allCampaigns.html">Campaigns</a></li>
            <li><a href="login.html">Login</a></li>
            <li><a class="signup" href="signup.html">Sign Up</a></li>
        `;
    }
}
updateNavbar();

/* =================================================================
   SECTION 2: MOBILE MENU TOGGLE LOGIC
================================================================= */
let menuBtn = document.getElementById("menuBtn");
let menuNav = document.getElementById("menu");

if (menuBtn !== null && menuNav !== null) {
    menuBtn.addEventListener("click", function(event) {
        event.stopPropagation(); 
        menuNav.classList.toggle("show"); 
    });
    document.addEventListener("click", function(event) {
        let clickedInsideMenu = menuNav.contains(event.target);
        let clickedOnButton = menuBtn.contains(event.target);
        if (clickedInsideMenu === false && clickedOnButton === false) {
            menuNav.classList.remove("show");
        }
    });
}

/* =================================================================
   SECTION 3: GET THE CAMPAIGN DATA USING THE URL
================================================================= */
let urlParams = new URLSearchParams(window.location.search);
let campaignIndex = urlParams.get('id'); 
let allStoredCampaigns = JSON.parse(localStorage.getItem("myCampaigns")) || [];
let currentCampaign = allStoredCampaigns[campaignIndex]; 
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let isUserLoggedIn = localStorage.getItem("isLoggedIn");


/* =================================================================
   SECTION 4: RENDER PAGE LOGIC (WRAPPED TO FIX 'RETURN' ERROR)
================================================================= */
function renderCampaignPage() {
    if (campaignIndex === null || currentCampaign === undefined) {
        alert("Campaign not found!");
        window.location.href = "dashboard(combined).html"; 
        return; // This works now because it's inside a function!
    } 

    // 🌟 ADMIN FIX 1: HIDDEN CAMPAIGN SECURITY CHECK
    let isOwnerCheck = false;
    if (isUserLoggedIn === "true" && currentUser !== null) {
        if (currentCampaign.ownerId === currentUser.email || currentCampaign.ownerId === currentUser.userId || currentCampaign.ownerId === currentUser.id) {
            isOwnerCheck = true;
        }
    }
    
    if (currentCampaign.status === "Hidden" && !isOwnerCheck) {
        alert("This campaign is currently hidden by the Administrator.");
        window.location.href = "allCampaigns.html";
        return; // Stops the page from loading the hidden data safely!
    }
    // -----------------------------------------------------------

    document.getElementById("mainContent").style.display = "block";
    
    // 🌟 ADMIN FIX 2: ADD "VERIFIED" BADGE NEXT TO TITLE
    let titleText = currentCampaign.gift || currentCampaign.giftName || "Gift Campaign";
    if (currentCampaign.adminApproved === true) {
        document.getElementById("giftName").innerHTML = `
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px;">
                <span>${titleText}</span>
                <span style="font-size: 14px; font-weight: 600; background:#e3fcef; color:#0b8a38; padding: 4px 12px; border-radius: 20px; border: 1px solid #0b8a38; white-space: nowrap;">✅ Verified</span>
            </div>
        `;
    } else {
        document.getElementById("giftName").innerHTML = titleText;
    }
    // -----------------------------------------------------------

    document.getElementById("campaignStory").innerText = currentCampaign.story;
    document.querySelector(".receiver").innerText = "For " + currentCampaign.receiver + " ❤️";
    document.querySelector(".creator").innerText = "👤 By " + (currentCampaign.creator || "Anonymous");
    
    if (currentCampaign.image) {
        document.getElementById("giftImage").src = currentCampaign.image;
    }

    let infoBoxes = document.querySelectorAll(".detail-box p");
    if (infoBoxes.length >= 4) {
        infoBoxes[0].innerText = currentCampaign.gift;
        infoBoxes[1].innerText = currentCampaign.occasion;
        infoBoxes[2].innerText = currentCampaign.category;
        infoBoxes[3].innerText = currentCampaign.date;
    }

    /* --- MATH FOR PROGRESS BAR & STATS --- */
    let raisedAmount = Number(currentCampaign.raised) || 0;
    let targetAmount = Number(currentCampaign.target) || 0;
    let percentage = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
    if (percentage > 100) percentage = 100; 

    let fillBar = document.querySelector(".fill");
    if (fillBar !== null) {
        fillBar.style.width = "0%"; 
        setTimeout(function() { fillBar.style.width = percentage + "%"; }, 300);
    }
    
    document.querySelector(".progress-info").innerHTML = `
        <span>${Math.round(percentage)}% Funded</span>
        <span>₹${raisedAmount} / ₹${targetAmount}</span>
    `;

    let remainingAmount = targetAmount - raisedAmount;
    if (remainingAmount < 0) remainingAmount = 0; 
    let donorsCount = currentCampaign.donors || 0;

    let daysLeft = "--";
    if (currentCampaign.date) {
        let targetDate = new Date(currentCampaign.date);
        let today = new Date();
        let timeDiff = targetDate.getTime() - today.getTime();
        daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysLeft < 0) daysLeft = "Ended";
    }

    document.querySelector(".hero-stats").innerHTML = `
        <div><h3>${donorsCount}</h3><p>Donors</p></div>
        <div><h3>${daysLeft}</h3><p>Days Left</p></div>
        <div><h3>₹${remainingAmount}</h3><p>Remaining</p></div>
    `;

    /* --- DYNAMIC DONATIONS --- */
    let donationsList = currentCampaign.donations || [];
    let donationSection = document.querySelector(".donations .glass");
    
    if (donationSection) {
        let donationsHTML = "<h2>❤️ Recent Donations</h2>";
        if (donationsList.length === 0) {
            donationsHTML += "<p style='color:#666;'>No donations yet. Be the first!</p>";
        } else {
            donationsList.forEach(d => {
                donationsHTML += `
                <div class="donation-item">
                    <span>${d.name || "Supporter"}</span>
                    <strong>₹${d.amount || 0}</strong>
                </div>`;
            });
        }
        donationSection.innerHTML = donationsHTML;
    }

    /* --- DYNAMIC EXPENSES --- */
    let expensesList = currentCampaign.expenses || [];
    let expenseSection = document.querySelector(".expenses .glass");
    
    if (expenseSection) {
        let expensesHTML = "<h2>💸 Expense Tracker</h2>";
        let totalExp = 0;
        
        if (expensesList.length === 0) {
            expensesHTML += "<p style='color:#666;'>No expenses recorded yet.</p>";
        } else {
            expensesList.forEach(e => {
                const cost = Number(e.amount) || 0; 
                expensesHTML += `
                <div class="expense-item">
                    <span>${e.item}</span>
                    <strong>₹${cost}</strong>
                </div>`;
                totalExp += cost;
            });
            expensesHTML += `
            <hr>
            <div class="expense-item total">
                <span>Total Expense</span>
                <strong>₹${totalExp}</strong>
            </div>`;
        }
        expenseSection.innerHTML = expensesHTML;
    }

    /* --- DYNAMIC WISHES --- */
    let wishesList = currentCampaign.wishes || [];
    let wishesSection = document.querySelector(".wishes .glass");
    
    if (wishesSection) {
        let wishesHTML = "<h2>💬 Wishes & Messages</h2>";
        if (wishesList.length === 0) {
            wishesHTML += "<p style='color:#666;'>No messages yet.</p>";
        } else {
            for (let i = 0; i < wishesList.length; i++) {
                wishesHTML += `
                <div class="wish-item">
                    <h4>${wishesList[i].name} ❤️</h4>
                    <p>${wishesList[i].message}</p>
                </div>`;
            }
        }
        wishesSection.innerHTML = wishesHTML;
    }

    /* =================================================================
       SECTION 5: SHOW THE RIGHT BUTTONS (GUEST VS SUPPORTER VS OWNER)
    ================================================================= */
    let heroButtonsArea = document.getElementById("heroActions");
    let isOwner = false;

    if (isUserLoggedIn === "true" && currentUser !== null) {
        if (currentCampaign.ownerId === currentUser.email || currentCampaign.ownerId === currentUser.userId || currentCampaign.ownerId === currentUser.id) {
            isOwner = true;
        }
    }

    if (isUserLoggedIn !== "true") {
        if (heroButtonsArea) {
            heroButtonsArea.innerHTML = `<button class="donate-btn" id="donateBtn">🔐 Login to Donate</button>`;
            document.getElementById("donateBtn").onclick = function() { window.location.href = "login.html"; };
        }
    } else if (isOwner === true) {
        if (heroButtonsArea) {
            heroButtonsArea.className = "owner-action-grid"; 
            heroButtonsArea.innerHTML = `
                <button class="owner-action-btn" id="editBtn">✏ Edit</button>
                <button class="owner-action-btn" id="analyticsBtn">📊 Analytics</button>
                <button class="owner-action-btn" id="extendBtn">📅 Extend</button>
                <button class="owner-action-btn" id="deleteBtn">🗑 Delete</button>
            `;
            
            document.getElementById("editBtn").onclick = function() {
                localStorage.setItem("newCampaign", JSON.stringify(currentCampaign));
                localStorage.setItem("editingIndex", campaignIndex); 
                window.location.href = "create.html";
            };

            document.getElementById("analyticsBtn").onclick = function() {
                window.location.href = "dashboard(combined).html"; 
            };

            document.getElementById("extendBtn").onclick = function() {
                let newDate = prompt("Enter a new Target Date (e.g., 2026-12-31):", currentCampaign.date);
                if (newDate !== null && newDate.trim() !== "") {
                    if (confirm("Extend target date to " + newDate + "?")) {
                        currentCampaign.date = newDate; 
                        allStoredCampaigns[campaignIndex] = currentCampaign; 
                        localStorage.setItem("myCampaigns", JSON.stringify(allStoredCampaigns)); 
                        alert("✅ Date extended!");
                        window.location.reload(); 
                    }
                }
            };

            document.getElementById("deleteBtn").onclick = function() {
                if (confirm("⚠️ Delete this campaign permanently?")) {
                    allStoredCampaigns.splice(campaignIndex, 1);
                    localStorage.setItem("myCampaigns", JSON.stringify(allStoredCampaigns));
                    alert("🗑 Campaign Deleted.");
                    window.location.href = "dashboard(combined).html"; 
                }
            };
        }
        
        let reportSection = document.getElementById("reportSection");
        if(reportSection) reportSection.style.display = "none";

    } else {
        let donateBtn = document.getElementById("donateBtn");
        if (donateBtn) {
            donateBtn.onclick = function() { 
            window.location.href = "donate.html?id=" + campaignIndex; };
        }
    }

    /* =================================================================
       SECTION 6: REPORT CAMPAIGN LOGIC
    ================================================================= */
    let reportBtn = document.querySelector(".report-btn");
    if (reportBtn !== null) {
        reportBtn.onclick = function() {
            if (isUserLoggedIn !== "true") {
                alert("Please login to report a campaign.");
                window.location.href = "login.html";
                return;
            }
            
            let reason = prompt("Why are you reporting this campaign? (e.g., Fake, Inappropriate)");
            
            if (reason !== null && reason.trim() !== "") {
                let reportedList = JSON.parse(localStorage.getItem("reports")) || [];
                
                reportedList.push({
                    reportId: "REP-" + Date.now().toString().slice(-4), 
                    campaignId: currentCampaign.campaignId || campaignIndex,
                    reportedBy: currentUser.userId,
                    reason: reason,
                    status: "Pending",
                    date: new Date().toLocaleDateString()
                });
                
                localStorage.setItem("reports", JSON.stringify(reportedList));
                alert("🚨 Campaign reported successfully. The Admin will review it.");
            }
        };
    }

    /* =================================================================
       SECTION 7: SHARE BUTTONS AND QR LOGIC
    ================================================================= */
    let qrButton = document.querySelector(".share-btn.qr"); 
    if (qrButton) {
        if (isUserLoggedIn === "true") {
            qrButton.style.display = "inline-block"; 
            qrButton.onclick = function() {
                alert("UPI ID: " + (currentCampaign.upiId || "Not provided"));
            };
        } else {
            qrButton.style.display = "none";
        }
    }

    let copyButton = document.querySelector(".copy");
    if (copyButton) {
        copyButton.onclick = function() {
            navigator.clipboard.writeText(window.location.href);
            copyButton.innerHTML = "✅ Copied!";
            setTimeout(function() { copyButton.innerHTML = "🔗 Copy Link"; }, 2000);
        };
    }

    let whatsappButton = document.querySelector(".whatsapp");
    if (whatsappButton) {
        whatsappButton.onclick = function() {
            window.open("https://wa.me/?text=" + encodeURIComponent(window.location.href));
        };
    }

    /* =================================================================
       SECTION 8: SIMILAR CAMPAIGNS GENERATOR
    ================================================================= */
    let similarContainer = document.querySelector(".similar .campaigns");

    if (similarContainer !== null && allStoredCampaigns.length > 0) {
        let activeCampaignsToDisplay = [];

        for (let i = 0; i < allStoredCampaigns.length; i++) {
            let c = allStoredCampaigns[i];
            let isStatusActive = (c.status === "Active" || c.status === undefined);
            let isNotCurrentCampaign = (c.campaignId !== currentCampaign.campaignId);

            if (isStatusActive && isNotCurrentCampaign) {
                c.originalIndex = i; 
                activeCampaignsToDisplay.push(c);
            }
            if (activeCampaignsToDisplay.length === 2) break;
        }

        similarContainer.innerHTML = ""; 

        if (activeCampaignsToDisplay.length === 0) {
            similarContainer.innerHTML = "<p style='text-align:center; width:100%; color:#666;'>No similar campaigns right now.</p>";
        } else {
            for (let j = 0; j < activeCampaignsToDisplay.length; j++) {
                let simCampaign = activeCampaignsToDisplay[j];
                let simImage = simCampaign.image || "images/teddy.jpg";

                similarContainer.innerHTML += `
                <div class="glass card">
                    <div class="card-image"><img src="${simImage}" alt="Gift"></div>
                    <div class="content">
                        <h3>${simCampaign.gift}</h3>
                        <p style="color:#ff4d8d; font-weight:500; margin-bottom:15px;">For ${simCampaign.receiver} ❤️</p>
                        <button style="width:100%; padding:12px; border:none; border-radius:12px; background:#ff4d8d; color:white; font-weight:600; cursor:pointer;" onclick="window.location.href='campaigns.html?id=${simCampaign.originalIndex}'">
                            View Campaign
                        </button>
                    </div>
                </div>`;
            }
        }
    }

    /* =================================================================
       SECTION 10: INSTA-STYLE 1-ON-1 DM LOGIC
    ================================================================= */
    let chatSection = document.getElementById("chatSection");
    let allowMessages = currentCampaign.receiveMessages !== "no";

    if (isUserLoggedIn === "true" && currentUser !== null && chatSection !== null && allowMessages) {
        let isDonor = false;
        if (currentCampaign.donations) {
            isDonor = currentCampaign.donations.some(function(donation) {
                return donation.name === currentUser.name || donation.donorId === currentUser.email;
            });
        }

        if (isOwner || isDonor) {
            chatSection.style.display = "block";

            let chatSidebar = document.getElementById("chatSidebar");
            let contactList = document.getElementById("contactList");
            let chatMain = document.getElementById("chatMain");
            let chatTitle = document.getElementById("chatTitle");
            let chatSubtitle = document.getElementById("chatSubtitle");
            let chatMessagesList = document.getElementById("chatMessagesList");
            let chatInput = document.getElementById("chatInput");
            let sendChatBtn = document.getElementById("sendChatBtn");
            let backToContactsBtn = document.getElementById("backToContacts");

            chatSubtitle.innerText = currentCampaign.gift + " Campaign";

            if (!currentCampaign.directMessages) {
                currentCampaign.directMessages = {};
            }

            let activeChatUserId = null; 

            function renderContacts() {
                contactList.innerHTML = "";
                let users = Object.keys(currentCampaign.directMessages);

                if (users.length === 0) {
                    contactList.innerHTML = "<p style='padding:20px; color:#888; font-size:13px;'>No messages yet.</p>";
                    return;
                }

                users.forEach(function(email) {
                    let msgs = currentCampaign.directMessages[email];
                    let lastMsg = msgs[msgs.length - 1];
                    let contactDiv = document.createElement("div");
                    contactDiv.className = "contact-item";
                    if (activeChatUserId === email) contactDiv.classList.add("active");
                    
                    let contactName = msgs.find(m => m.senderEmail === email)?.senderName || email;

                    contactDiv.innerHTML = `
                        <div class="contact-name">${contactName}</div>
                        <div class="contact-preview">${lastMsg.text}</div>
                    `;
                    
                    contactDiv.onclick = function() {
                        activeChatUserId = email;
                        chatTitle.innerText = contactName;
                        if (window.innerWidth <= 768) {
                            chatSidebar.classList.add("hidden");
                            chatMain.classList.add("active");
                        }
                        renderContacts(); 
                        renderChat();
                    };
                    contactList.appendChild(contactDiv);
                });
            }

            function renderChat() {
                chatMessagesList.innerHTML = "";
                let msgsToRender = [];
                if (isOwner) {
                    if (!activeChatUserId) {
                        chatMessagesList.innerHTML = "<p style='text-align:center; color:#888; margin-top:40px;'>Select a conversation to start messaging.</p>";
                        return;
                    }
                    msgsToRender = currentCampaign.directMessages[activeChatUserId] || [];
                } else {
                    msgsToRender = currentCampaign.directMessages[currentUser.email] || [];
                }

                if (msgsToRender.length === 0) {
                    chatMessagesList.innerHTML = "<p style='text-align:center; color:#888; margin-top:40px;'>Say hi to start the conversation! 👋</p>";
                } else {
                    for (let i = 0; i < msgsToRender.length; i++) {
                        let msg = msgsToRender[i];
                        let isSelf = (msg.senderEmail === currentUser.email);
                        let msgDiv = document.createElement("div");
                        msgDiv.className = "chat-msg " + (isSelf ? "self" : "other");
                        msgDiv.innerText = msg.text;
                        chatMessagesList.appendChild(msgDiv);
                    }
                }
                chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
            }

            if (isOwner) {
                chatSidebar.style.display = "flex";
                chatTitle.innerText = "Select a message";
                renderContacts();
                renderChat();
            } else {
                activeChatUserId = currentUser.email; 
                chatTitle.innerText = "Creator: " + (currentCampaign.creator || "Anonymous");
                renderChat();
            }

            backToContactsBtn.onclick = function() {
                chatMain.classList.remove("active");
                chatSidebar.classList.remove("hidden");
                activeChatUserId = null;
                chatTitle.innerText = "Select a message";
                renderChat();
                renderContacts();
            };

            sendChatBtn.onclick = function() {
                let text = chatInput.value.trim();
                if (text === "") return;

                let threadId = isOwner ? activeChatUserId : currentUser.email;
                if (isOwner && !threadId) {
                    alert("Please select a conversation first.");
                    return;
                }

                if (!currentCampaign.directMessages[threadId]) {
                    currentCampaign.directMessages[threadId] = [];
                }

                currentCampaign.directMessages[threadId].push({
                    senderName: currentUser.name,
                    senderEmail: currentUser.email,
                    text: text,
                    timestamp: new Date().getTime()
                });

                allStoredCampaigns[campaignIndex] = currentCampaign;
                localStorage.setItem("myCampaigns", JSON.stringify(allStoredCampaigns));

                chatInput.value = "";
                if (isOwner) renderContacts();
                renderChat();
            };

            chatInput.addEventListener("keypress", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    sendChatBtn.click();
                }
            });
        }
    }
}

// 🔥 EXECUTING THE WRAPPED FUNCTION TO RENDER THE PAGE SAFELY!
renderCampaignPage();


/* =================================================================
   SECTION 9: VISUAL EFFECTS (SCROLL, ZOOM, REVEAL, HEARTS)
================================================================= */
let navbar = document.querySelector(".navbar");
if (navbar !== null) {
    window.addEventListener("scroll", function() {
        if (window.scrollY > 40) {
            navbar.style.background = "rgba(255,255,255,.8)";
            navbar.style.backdropFilter = "blur(20px)";
            navbar.style.boxShadow = "0 15px 40px rgba(0,0,0,.12)";
        } else {
            navbar.style.background = "rgba(255,255,255,.35)";
            navbar.style.backdropFilter = "blur(15px)";
            navbar.style.boxShadow = "0 15px 40px rgba(0,0,0,.08)";
        }
    });
}

let mainImage = document.getElementById("giftImage");
if (mainImage !== null) {
    mainImage.onclick = function() { mainImage.classList.toggle("zoom"); };
}

let backBtn = document.querySelector(".back-btn");
if (backBtn !== null) {
    backBtn.addEventListener("click", function() { history.back(); });
}

let cardsToReveal = document.querySelectorAll(".section-card, .card");
if (cardsToReveal.length > 0) {
    let observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting === true) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    });
    cardsToReveal.forEach(function(card) {
        card.style.opacity = "0";
        card.style.transform = "translateY(40px)";
        card.style.transition = ".7s";
        observer.observe(card);
    });
}

for (let i = 0; i < 18; i++) {
    let heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤";
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.fontSize = 12 + Math.random() * 18 + "px";
    heart.style.animationDuration = 8 + Math.random() * 8 + "s";
    heart.style.animationDelay = Math.random() * 6 + "s";
    document.querySelector(".hearts").appendChild(heart);
}
