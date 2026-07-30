const API_URL = "https://script.google.com/macros/s/AKfycbz3j7pEIhMfam_dVATTNJe6rHAaMNUAz55ywLqEj4XDJ5qb6hygrvGQQfSj2x1KLtRM/exec";

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
   SECTION 3: GET THE CAMPAIGN DATA USING THE URL & BACKEND
================================================================= */
let urlParams = new URLSearchParams(window.location.search);
let campaignId = urlParams.get('id'); 
let allStoredCampaigns = JSON.parse(localStorage.getItem("myCampaigns")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser"));
let isUserLoggedIn = localStorage.getItem("isLoggedIn");
let currentCampaign = null;

async function loadCampaignData() {
    if (!campaignId) {
        alert("Campaign not found!");
        window.location.href = "dashboard(combined).html";
        return;
    }

    try {
        // Fetch live data from Google Sheets
        let response = await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ 
                action: "getCampaignById", 
                data: { campaignId: campaignId } 
            })
        });

        let result = await response.json();

        // If successful, set currentCampaign and render the page
        if (result.status === "Success") {
            currentCampaign = result.data;
            
            // SEPARATED TRY-CATCH: Isolates rendering crashes from database crashes
            try {
                renderCampaignPage();
            } catch (renderError) {
                console.error("Rendering Error:", renderError);
                // Alert a more accurate error if the UI fails to build
                alert("Campaign loaded, but there was an error displaying the details on the page.");
            }

        } else {
            alert("Error: " + result.message);
            window.location.href = "dashboard(combined).html";
        }
    } catch (networkError) {
        console.error("Failed to fetch from DB:", networkError);
        alert("Could not connect to the database. Please check your internet connection.");
    }
}

/* =================================================================
   SECTION 4: RENDER PAGE LOGIC 
================================================================= */
function renderCampaignPage() {
    if (currentCampaign === undefined || currentCampaign === null) {
        alert("Campaign not found!");
        window.location.href = "dashboard(combined).html"; 
        return; 
    } 

    // ADMIN FIX 1: HIDDEN CAMPAIGN SECURITY CHECK
    let isOwnerCheck = false;
    if (isUserLoggedIn === "true" && currentUser !== null) {
        if (currentCampaign.ownerId === currentUser.email || currentCampaign.ownerId === currentUser.userId || currentCampaign.ownerId === currentUser.id) {
            isOwnerCheck = true;
        }
    }
    
    if (currentCampaign.status === "Hidden" && !isOwnerCheck) {
        alert("This campaign is currently hidden by the Administrator.");
        window.location.href = "allCampaigns.html";
        return; 
    }

    document.getElementById("mainContent").style.display = "block";
    
    // ADMIN FIX 2: ADD "VERIFIED" BADGE NEXT TO TITLE
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

    document.getElementById("campaignStory").innerText = currentCampaign.story || "No story provided.";
    document.querySelector(".receiver").innerText = "For " + (currentCampaign.receiver || "Someone special") + " ❤️";
    document.querySelector(".creator").innerText = "👤 By " + (currentCampaign.creator || "Anonymous");
    
           // ✅ NEW CODE: Use the correct variables from Google Sheets!
    if (currentCampaign.giftImageUrl) {
        let safeImageUrl = currentCampaign.giftImageUrl;
        
        // 🛠️ GOOGLE DRIVE IMAGE FIX: Convert 'uc?id=' to a web-safe thumbnail URL
        if (safeImageUrl.includes("drive.google.com/uc?id=")) {
            let fileId = safeImageUrl.split("id=")[1].split("&")[0]; // Extract the ID safely
            safeImageUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1000";
        }
        
        document.getElementById("giftImage").src = safeImageUrl;
    } else {
        // Fallback image just in case a campaign has no image at all
        document.getElementById("giftImage").src = "images/teddy.jpg"; 
    }

    let infoBoxes = document.querySelectorAll(".detail-box p");
    if (infoBoxes.length >= 4) {
        infoBoxes[0].innerText = currentCampaign.gift || "Unknown";
        infoBoxes[1].innerText = currentCampaign.occasion || "Special Occasion";
        infoBoxes[2].innerText = currentCampaign.category || "General";
        infoBoxes[3].innerText = currentCampaign.targetDate || "TBD";
    }

    /* --- MATH FOR PROGRESS BAR & STATS --- */
        /* --- MATH FOR PROGRESS BAR & STATS --- */
    // ❌ OLD: let raisedAmount = Number(currentCampaign.raised) || 0;
    // ❌ OLD: let targetAmount = Number(currentCampaign.target) || 0;
    
    // ✅ NEW:
    let raisedAmount = Number(currentCampaign.raisedAmount) || 0;
    let targetAmount = Number(currentCampaign.targetAmount) || 0;
    
    let percentage = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
    if (percentage > 100) percentage = 100; 

    let fillBar = document.querySelector(".fill");
    if (fillBar !== null) {
        fillBar.style.width = "0%"; 
        setTimeout(function() { fillBar.style.width = percentage + "%"; }, 300);
    }
    
    let progressInfo = document.querySelector(".progress-info");
    if(progressInfo) {
        progressInfo.innerHTML = `
            <span>${Math.round(percentage)}% Funded</span>
            <span>₹${raisedAmount} / ₹${targetAmount}</span>
        `;
    }

    let remainingAmount = targetAmount - raisedAmount;
    if (remainingAmount < 0) remainingAmount = 0; 
    
    // ❌ OLD: let donorsCount = currentCampaign.donors || 0;
    // ✅ NEW:
    let donorsCount = currentCampaign.donorsCount || 0;

    let daysLeft = "--";
    // ❌ OLD: if (currentCampaign.date) {
    // ❌ OLD:     let targetDate = new Date(currentCampaign.date);
    // ✅ NEW:
    if (currentCampaign.targetDate) {
        let targetDate = new Date(currentCampaign.targetDate);
        let today = new Date();
        let timeDiff = targetDate.getTime() - today.getTime();
        daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (daysLeft < 0) daysLeft = "Ended";
    }


    let heroStats = document.querySelector(".hero-stats");
    if(heroStats) {
        heroStats.innerHTML = `
            <div><h3>${donorsCount}</h3><p>Donors</p></div>
            <div><h3>${daysLeft}</h3><p>Days Left</p></div>
            <div><h3>₹${remainingAmount}</h3><p>Remaining</p></div>
        `;
    }

    /* --- 🛡️ HELPER: SAFELY PARSE ARRAYS FROM GOOGLE SHEETS --- */
    // If the database sends a JSON string instead of an array, this fixes it!
    function getSafeArray(data) {
        if (Array.isArray(data)) return data;
        if (typeof data === 'string' && data.trim() !== '') {
            try {
                let parsed = JSON.parse(data);
                return Array.isArray(parsed) ? parsed : [];
            } catch (e) {
                return []; // Fails safely if string is not valid JSON
            }
        }
        return [];
    }

    /* --- DYNAMIC DONATIONS --- */
    let donationsList = getSafeArray(currentCampaign.donations);
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
    let expensesList = getSafeArray(currentCampaign.expenses);
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
                    <span>${e.item || "Item"}</span>
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
    let wishesList = getSafeArray(currentCampaign.wishes);
    let wishesSection = document.querySelector(".wishes .glass");
    
    if (wishesSection) {
        let wishesHTML = "<h2>💬 Wishes & Messages</h2>";
        if (wishesList.length === 0) {
            wishesHTML += "<p style='color:#666;'>No messages yet.</p>";
        } else {
            wishesList.forEach(w => {
                wishesHTML += `
                <div class="wish-item">
                    <h4>${w.name || "Anonymous"} ❤️</h4>
                    <p>${w.message || ""}</p>
                </div>`;
            });
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
                localStorage.setItem("editingIndex", campaignId); 
                window.location.href = "create.html";
            };

                                   // ✅ NEW EXTEND DATE CALENDAR MODAL
            document.getElementById("extendBtn").onclick = function() {
                // 1. Format the current date for the calendar
                let currentDateValue = "";
                if (currentCampaign.targetDate) {
                    try {
                        currentDateValue = new Date(currentCampaign.targetDate).toISOString().split('T')[0];
                    } catch(e) {}
                }

                // 2. Create the beautiful UI Modal
                let modalHTML = `
                    <div id="extendModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(5px);">
                        <div class="glass section-card" style="background:white; padding:30px; text-align:center; max-width:90%; width:350px;">
                            <h3 style="color:#ff4d8d; margin-bottom:15px;">📅 Extend Date</h3>
                            <p style="color:#666; margin-bottom:15px; font-size:14px;">Select a new target date for your campaign.</p>
                            
                            <input type="date" id="newTargetDate" value="${currentDateValue}" style="width:100%; padding:14px; border:1px solid #ddd; border-radius:12px; margin-bottom:20px; font-family:'Poppins', sans-serif; font-size:16px; outline:none; color:#333;">
                            
                            <div style="display:flex; gap:10px;">
                                <button id="cancelExtend" style="flex:1; padding:12px; border:none; border-radius:12px; background:#f1f1f1; color:#333; font-weight:600; cursor:pointer;">Cancel</button>
                                <button id="confirmExtend" style="flex:1; padding:12px; border:none; border-radius:12px; background:linear-gradient(135deg, #ff4d8d, #ff7db1); color:white; font-weight:600; cursor:pointer;">Save Date</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // Inject the modal into the page
                document.body.insertAdjacentHTML('beforeend', modalHTML);

                // 3. Handle Cancel Button
                document.getElementById("cancelExtend").onclick = function() {
                    document.getElementById("extendModal").remove();
                };

                // 4. Handle Save Button
                document.getElementById("confirmExtend").onclick = async function() {
                    let newDate = document.getElementById("newTargetDate").value;
                    if (newDate) {
                        let confirmBtn = document.getElementById("confirmExtend");
                        confirmBtn.innerText = "Saving...";
                        confirmBtn.disabled = true;

                        try {
                            let response = await fetch(API_URL, {
                                method: "POST",
                                body: JSON.stringify({ 
                                    action: "extendCampaignDate", 
                                    data: { 
                                        campaignId: currentCampaign.campaignId || campaignId,
                                        newTargetDate: newDate
                                    } 
                                })
                            });

                            let result = await response.json();

                            if (result.status === "Success") {
                                currentCampaign.targetDate = newDate;
                                alert("✅ Date updated successfully in database!");
                                document.getElementById("extendModal").remove();
                                renderCampaignPage(); 
                            } else {
                                alert("Error saving date: " + result.message);
                                confirmBtn.innerText = "Save Date";
                                confirmBtn.disabled = false;
                            }
                        } catch (error) {
                            console.error("Error extending date:", error);
                            alert("Network error. Could not connect to the database.");
                            confirmBtn.innerText = "Save Date";
                            confirmBtn.disabled = false;
                        }
                    }
                }; // ✅ Closed confirmExtend function properly here
            }; // ✅ Closed extendBtn click handler properly here

            document.getElementById("deleteBtn").onclick = function() {
                if (confirm("⚠️ Delete this campaign permanently?")) {
                    alert("🗑 Campaign Deleted.");
                    window.location.href = "dashboard(combined).html"; 
                }
            };

 document.getElementById("deleteBtn").onclick = function() {
                if (confirm("⚠️ Delete this campaign permanently?")) {
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
            window.location.href = "donate.html?id=" + campaignId; };
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
                    campaignId: currentCampaign.campaignId || campaignId,
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
                c.originalIndex = c.campaignId || i; 
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
        if (donationsList.length > 0) {
            isDonor = donationsList.some(function(donation) {
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

            chatSubtitle.innerText = (currentCampaign.gift || "Gift") + " Campaign";

            if (!currentCampaign.directMessages) {
                currentCampaign.directMessages = {};
            }
            
            if (typeof currentCampaign.directMessages === 'string') {
                try { currentCampaign.directMessages = JSON.parse(currentCampaign.directMessages); }
                catch(e) { currentCampaign.directMessages = {}; }
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
                    if (!msgs || msgs.length === 0) return;
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

// 🔥 THIS TRIGGERS THE FETCH TO GOOGLE SHEETS FIRST, THEN RENDERS THE PAGE!
loadCampaignData();

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
 