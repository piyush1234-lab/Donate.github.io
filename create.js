/*=====================================
      GIFTBLOOM API CONNECTION
=====================================*/
// Keeping the API URL here for reference, but it will be used in the final publish page instead!
const API_URL = "https://script.google.com/macros/s/AKfycbxyVajhdo-ZT_N5px_hqM2fFWNqpAu3yw6YRZDhK0_3jQ_eLdzKYhnvyfeQyxuGP_jS/exec";

/*=====================================
        LOGIN CHECK (ENFORCED)
=====================================*/
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// 🔥 FIX: Redirect immediately if they are not logged in or are a guest
if(localStorage.getItem("isLoggedIn") !== "true" || !currentUser || !currentUser.userId) {
    alert("Please log in to create a campaign.");
    window.location.href = "login.html";
}

/*=====================================
      DETECT USER LOCATION (once per day, cached)
      Primary: GeoJS (silent, no popup)
      Fallback: navigator.geolocation (shows permission popup)
=====================================*/
async function detectUserLocation() {
    const lastFetched = localStorage.getItem("userStateTimestamp");
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (lastFetched && (Date.now() - Number(lastFetched)) < ONE_DAY) {
        // Already have a fresh state — just make sure backend has it too
        const cachedState = localStorage.getItem("userState");
        if (cachedState) syncStateToBackend(cachedState);
        return;
    }

    // 1. Try GeoJS first (silent, no permission popup)
    try {
        const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
        if (!res.ok) throw new Error("GeoJS response not OK");
        const geo = await res.json();
        const state = geo.region || null;

        if (state) {
            console.log("✅ GeoJS working — state detected:", state);
            localStorage.setItem("userState", state);
            localStorage.setItem("userStateTimestamp", Date.now());
            syncStateToBackend(state);
            return;
        } else {
            throw new Error("GeoJS returned no region");
        }
    } catch (e) {
        console.log("❌ GeoJS failed:", e.message, "— falling back to navigator.geolocation");
    }

    // 2. Fallback: navigator.geolocation
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
                syncStateToBackend(state);
            } else {
                console.log("⚠️ navigator.geolocation succeeded but reverse-geocode returned no state");
            }
        } catch (e) {
            console.log("❌ navigator.geolocation reverse-geocode failed:", e.message);
        }
    }, (err) => {
        console.log("❌ navigator.geolocation denied or unavailable:", err.message);
    }, { timeout: 8000, maximumAge: ONE_DAY });
}

// Silently sends the detected state to the backend to fill Users column H
function syncStateToBackend(state) {
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
            action: "updateUserState",
            data: { userId: currentDraftUserId, state: state }
        })
    }).catch(e => console.log("⚠️ Failed to sync state to backend:", e.message));
}

detectUserLocation(); // fire on page load, fully silent unless GeoJS fails

/*=====================================
        MOBILE MENU
=====================================*/
const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if(menuBtn && menu){
    menuBtn.addEventListener("click",(e)=>{
        e.stopPropagation();
        menu.classList.toggle("show");
    });
    document.querySelectorAll("#menu a").forEach(link=>{
        link.addEventListener("click",()=>{
            menu.classList.remove("show");
        });
    });
    document.addEventListener("click",(e)=>{
        if(!menu.contains(e.target) && !menuBtn.contains(e.target)){
            menu.classList.remove("show");
        }
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
      UNIQUE ID GENERATOR
=====================================*/
function generateCampaignId() {
    const randomNum = Math.floor(100000 + Math.random() * 900000); 
    return "GBC-" + randomNum;
}

/*=====================================
      EDIT MODE & DRAFT LOGIC
=====================================*/
let savedCampaign = null;
const currentDraftUserId = currentUser.userId;
const DRAFT_KEY = "draftData_" + currentDraftUserId;
const DRAFT_TIME_KEY = "draftTime_" + currentDraftUserId;

document.addEventListener("DOMContentLoaded", () => {
    let editData = localStorage.getItem(DRAFT_KEY);
    let draftTime = localStorage.getItem(DRAFT_TIME_KEY); 

    const urlParams = new URLSearchParams(window.location.search);
    const forceNew = urlParams.get('new') === 'true';

    // 1. FRESH START
    if (forceNew) {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(DRAFT_TIME_KEY);
        editData = null; 
    }

    // 2. AUTO-DELETE OLD DRAFTS (6-Hour Expiration)
    if (editData !== null) {
        if (!draftTime) {
            localStorage.setItem(DRAFT_TIME_KEY, Date.now());
        } else {
            let hoursPassed = (Date.now() - parseInt(draftTime)) / (1000 * 60 * 60);
            if (hoursPassed > 6) { 
                localStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(DRAFT_TIME_KEY);
                editData = null; 
            }
        }
    }

    // 3. Load data
    if (editData !== null) {
        savedCampaign = JSON.parse(editData);
        let mainTitle = document.querySelector("h1");
        if (mainTitle) {
            mainTitle.innerText = "📝 Continue Draft";
        }
        
        // Restore cropped images from draft
        finalCroppedGift = savedCampaign.giftImageBase64 || "";
        finalCroppedQR = savedCampaign.qrImageBase64 || "";
        isUpiQr = savedCampaign.upiId ? true : false;
    } 

    // 4. Fill the Form Fields
    const idField = document.getElementById("campaignId");
    const ownerIdField = document.getElementById("visibleOwnerId");

    if (savedCampaign) {
        if (idField) idField.value = savedCampaign.campaignId || generateCampaignId();
        if (ownerIdField) ownerIdField.value = savedCampaign.ownerId || currentDraftUserId;
        
        if (document.getElementById("giftName")) document.getElementById("giftName").value = savedCampaign.gift || "";
        if (document.getElementById("receiver")) document.getElementById("receiver").value = savedCampaign.receiver || "";
        if (document.getElementById("creator")) document.getElementById("creator").value = savedCampaign.creator || "";
        if (document.getElementById("occasion")) document.getElementById("occasion").value = savedCampaign.occasion || "Birthday";
        if (document.getElementById("category")) document.getElementById("category").value = savedCampaign.category || "Soft Toy";
        if (document.getElementById("target")) document.getElementById("target").value = savedCampaign.target || "";
        if (document.getElementById("targetDate")) document.getElementById("targetDate").value = savedCampaign.targetDate || "";
        if (document.getElementById("story")) document.getElementById("story").value = savedCampaign.story || "";
        
        if (savedCampaign.occasion === "Other" && document.getElementById("otherOccasionBox")) {
            document.getElementById("otherOccasionBox").style.display = "block";
        }
        if (savedCampaign.category === "Other" && document.getElementById("otherCategoryBox")) {
            document.getElementById("otherCategoryBox").style.display = "block";
        }

        if (savedCampaign.receiveMessages === "no") {
            const noRadio = document.querySelector('input[name="receiveMessages"][value="no"]');
            if(noRadio) noRadio.checked = true;
        }

    } else {
        // Blank slate
        if (idField) idField.value = generateCampaignId();
        if (ownerIdField) ownerIdField.value = currentDraftUserId;
        if (document.getElementById("creator")) document.getElementById("creator").value = currentUser.name || "";
    }

    if(typeof validateCascade === "function") {
        setTimeout(validateCascade, 100); 
    }

    // 5. ACTIVE TAB CHECKER (5 min interval)
    setInterval(() => {
        let currentDraftTime = localStorage.getItem(DRAFT_TIME_KEY);
        if (currentDraftTime) {
            let activeHoursPassed = (Date.now() - parseInt(currentDraftTime)) / (1000 * 60 * 60);
            if (activeHoursPassed > 6) {
                localStorage.removeItem(DRAFT_KEY);
                localStorage.removeItem(DRAFT_TIME_KEY);
                alert("Your draft has expired because of inactivity. The form has been reset.");
                window.location.href = "create.html?new=true";
            }
        }
    }, 5 * 60 * 1000); 
});

/*=====================================
      FLOATING HEARTS
=====================================*/
const hearts = document.querySelector(".hearts");
for(let i=0; i<18; i++){
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤";
    heart.style.left = Math.random()*100+"vw";
    heart.style.fontSize = (10+Math.random()*18)+"px";
    heart.style.animationDuration = (8+Math.random()*8)+"s";
    heart.style.animationDelay = (Math.random()*5)+"s";
    if(hearts) hearts.appendChild(heart);
}

/*=====================================
      LIGHTBOX (ZOOM) LOGIC
=====================================*/
const zoomLightbox = document.getElementById("zoomLightbox");
const lightboxImg = document.getElementById("lightboxImg");
const closeLightboxBtn = document.getElementById("closeLightboxBtn");

function openZoom(imageSrc) {
    lightboxImg.src = imageSrc;
    zoomLightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeZoom() {
    zoomLightbox.style.display = "none";
    document.body.style.overflow = ""; 
}

closeLightboxBtn.onclick = closeZoom;
zoomLightbox.onclick = (e) => { if (e.target === zoomLightbox) closeZoom(); };

/*=====================================
      CROPPER LOGIC (GIFT & QR)
=====================================*/
let cropper; 
let currentCropType = ""; 
let finalCroppedGift = ""; 
let finalCroppedQR = ""; 
let isUpiQr = false;

const cropperModal = document.getElementById("cropperModal");
const imageToCrop = document.getElementById("imageToCrop");
const cropperTitle = document.getElementById("cropperTitle");

const giftInput = document.getElementById("giftImage");
const qrInput = document.getElementById("paymentQR");

let giftPreview = document.createElement("img");
giftPreview.className = "preview-img";
giftPreview.onclick = () => openZoom(finalCroppedGift);
giftInput.after(giftPreview);

let qrPreview = document.createElement("img");
qrPreview.className = "preview-img";
qrPreview.style.borderColor = "#2e7d32"; 
qrPreview.onclick = () => openZoom(finalCroppedQR);
qrInput.after(qrPreview);

let upiDisplay = document.createElement("input");
upiDisplay.type = "text";
upiDisplay.readOnly = true;
upiDisplay.style.marginTop = "10px";
upiDisplay.style.background = "#e8f5e9"; 
upiDisplay.style.color = "#2e7d32";      
upiDisplay.style.fontWeight = "600";
upiDisplay.style.display = "none"; 
qrPreview.after(upiDisplay);

// Load images correctly from the new unified draft object
if (savedCampaign && savedCampaign.giftImageBase64) {
    giftPreview.src = savedCampaign.giftImageBase64;
    giftPreview.style.display = "block";
}
if (savedCampaign && savedCampaign.qrImageBase64 && savedCampaign.upiId) {
    qrPreview.src = savedCampaign.qrImageBase64;
    qrPreview.style.display = "block";
    upiDisplay.value = "✅ UPI: " + savedCampaign.upiId;
    upiDisplay.dataset.cleanUpi = savedCampaign.upiId;
    upiDisplay.style.display = "block";
}

function openCropper(file, type) {
    if(!file) return;
    currentCropType = type;
    cropperTitle.innerText = type === "gift" ? "Crop Gift Image" : "Crop QR Code";
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imageToCrop.src = e.target.result;
        cropperModal.style.display = "flex"; 
        document.body.style.overflow = "hidden"; 
        
        if (cropper) cropper.destroy(); 
        
        cropper = new Cropper(imageToCrop, {
            viewMode: 1,
            autoCropArea: 1
        });
       };
    reader.readAsDataURL(file);
}


giftInput.addEventListener("change", (e) => openCropper(e.target.files[0], "gift"));
qrInput.addEventListener("change", (e) => openCropper(e.target.files[0], "qr"));


document.getElementById("applyCropBtn").onclick = function() {
    if(!cropper) return;
    // HIGH RES CROPPING
    let canvas = cropper.getCroppedCanvas({ maxWidth: 1200, maxHeight: 1200 });

    if (currentCropType === "gift") {
        finalCroppedGift = canvas.toDataURL("image/jpeg", 0.95); 

        giftPreview.src = finalCroppedGift;
        giftPreview.style.display = "block"; 
        cropperModal.style.display = "none";
        document.body.style.overflow = ""; 
        validateCascade();

    } else if (currentCropType === "qr") {
        const context = canvas.getContext("2d", { willReadFrequently: true });
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data.toLowerCase().includes("upi://pay")) {
            isUpiQr = true;
            let upiId = "Unknown UPI ID";
            try {
                const params = new URLSearchParams(code.data.substring(code.data.indexOf('?')));
                if(params.has('pa')) upiId = params.get('pa');
            } catch(err) {}

            finalCroppedQR = canvas.toDataURL("image/jpeg", 0.95); 

            qrPreview.src = finalCroppedQR;
            qrPreview.style.display = "block";
            
            upiDisplay.value = "✅ UPI: " + upiId;
            upiDisplay.dataset.cleanUpi = upiId; 
            upiDisplay.style.display = "block";
            
            cropperModal.style.display = "none";
            document.body.style.overflow = ""; 
            validateCascade();
        } else {
            isUpiQr = false;
            alert("Could not read a valid UPI QR code from the cropped area. Make sure it's a clear UPI code.");
            cropperModal.style.display = "none";
            document.body.style.overflow = ""; 
            qrInput.value = ""; 
        }
    }
};

const rotateBtn = document.getElementById("rotateCropBtn");
if (rotateBtn) {
    rotateBtn.onclick = function() {
        if (cropper) cropper.rotate(90); 
    };
}

document.getElementById("cancelCropBtn").onclick = function() {
    cropperModal.style.display = "none";
    document.body.style.overflow = ""; 
    if(currentCropType === "gift") giftInput.value = "";
    if(currentCropType === "qr") qrInput.value = "";
};

/*=====================================
      OTHER OCCASION & CATEGORY LOGIC
=====================================*/
const occasionSelect = document.getElementById("occasion");
const otherOccasionBox = document.getElementById("otherOccasionBox");
occasionSelect.addEventListener("change",()=>{
    otherOccasionBox.style.display = occasionSelect.value === "Other" ? "block" : "none";
});

const categorySelect = document.getElementById("category");
const otherCategoryBox = document.getElementById("otherCategoryBox");
categorySelect.addEventListener("change",()=>{
    otherCategoryBox.style.display = categorySelect.value === "Other" ? "block" : "none";
});

if(savedCampaign){
    if(savedCampaign.occasion==="Other") otherOccasionBox.style.display="block";
    if(savedCampaign.category==="Other") otherCategoryBox.style.display="block";
}

const today = new Date().toISOString().split("T")[0];
document.getElementById("targetDate").min = today;

/*=====================================
      WATERFALL FORM UNLOCK LOGIC
=====================================*/
function validateCascade() {
    const gift = document.getElementById("giftName");
    const receiver = document.getElementById("receiver");
    const creator = document.getElementById("creator");
    const occasion = document.getElementById("occasion");
    const otherOccasion = document.getElementById("otherOccasion");
    const category = document.getElementById("category");
    const otherCategory = document.getElementById("otherCategory");
    const target = document.getElementById("target");
    const date = document.getElementById("targetDate");
    const story = document.getElementById("story");
    const msgGroup = document.getElementById("receiveMsgGroup");
    const qr = document.getElementById("paymentQR");
    const giftImg = document.getElementById("giftImage");

    const isFilled = (el) => {
        if (!el) return false;
        const val = el.value.trim();
        if (val === "") return false;
        if (el.type === "text" || el.tagName.toLowerCase() === "textarea") return val.length >= 3; 
        return true;
    };

    function setLock(element, shouldLock, message) {
        if (!element) return;
        if (shouldLock) {
            element.classList.add("locked-field");
            element.dataset.lockedMsg = message; 
            element.disabled = false; 
        } else {
            element.classList.remove("locked-field");
            element.dataset.lockedMsg = "";
        }
    }
    
    let lockReceiver = !isFilled(gift);
    setLock(receiver, lockReceiver, "Please enter the Gift Name to unlock this field.");

    let lockCreator = lockReceiver || !isFilled(receiver);
    setLock(creator, lockCreator, "Please enter the Receiver Name to unlock this field.");

    let lockOccasion = lockCreator || !isFilled(creator);
    setLock(occasion, lockOccasion, "Please enter Your Name to unlock this field.");

    let occValid = isFilled(occasion) && (occasion.value !== "Other" || isFilled(otherOccasion));
    let lockCategory = lockOccasion || !occValid;
    setLock(category, lockCategory, "Please complete the Occasion to unlock this field.");

    let catValid = isFilled(category) && (category.value !== "Other" || isFilled(otherCategory));
    let lockTarget = lockCategory || !catValid;
    setLock(target, lockTarget, "Please complete the Gift Category to unlock this field.");

    let lockDate = lockTarget || !isFilled(target);
    setLock(date, lockDate, "Please enter the Target Amount to unlock this field.");

    let lockStory = lockDate || !isFilled(date);
    setLock(story, lockStory, "Please select a Target Date to unlock this field.");

    let lockMsgGroup = lockStory || !isFilled(story);
    setLock(msgGroup, lockMsgGroup, "Please write your Campaign Story to unlock this field.");

    let lockGiftImg = lockMsgGroup;
    setLock(giftImg, lockGiftImg, "Please confirm message preferences to unlock this field.");

    let lockQr = lockGiftImg || (finalCroppedGift === "");
    setLock(qr, lockQr, "Please upload a Gift Image to unlock this field.");
}

/*=====================================
      ATTACH LISTENERS TO ALL FIELDS
=====================================*/
let typingTimer;

document.querySelectorAll("#campaignForm input, #campaignForm select, #campaignForm textarea").forEach(el => {
    if(el.readOnly || el.type === "hidden" || el.type === "radio") return;

    el.addEventListener("input", () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(validateCascade, 500); 
    });

    el.addEventListener("change", validateCascade);

    el.addEventListener("mousedown", (e) => {
        if (el.classList.contains("locked-field")) {
            e.preventDefault(); 
            alert(el.dataset.lockedMsg); 
            el.blur(); 
        }
    });

    el.addEventListener("focus", (e) => {
        if (el.classList.contains("locked-field")) {
            el.blur(); 
        }
    });
});

validateCascade();

/*=====================================
      FORM VALIDATION & SAVE TO DRAFT
=====================================*/
document.getElementById("nextBtn").addEventListener("click", () => {
    const gift = document.getElementById("giftName").value.trim();
    const receiver = document.getElementById("receiver").value.trim();
    const creator = document.getElementById("creator").value.trim();
    const occasion = document.getElementById("occasion").value;
    const category = document.getElementById("category").value;
    const target = document.getElementById("target").value;
    const date = document.getElementById("targetDate").value;
    const story = document.getElementById("story").value.trim();

    const uniqueOwnerId = document.getElementById("visibleOwnerId").value;
    const receiveMessages = document.querySelector('input[name="receiveMessages"]:checked').value;

    if(!gift || !receiver || !creator || !target || !date || !story) {
        alert("Please fill all required fields.");
        return;
    }

    if (!finalCroppedGift) { alert("Gift image is required."); return; }
    if (!finalCroppedQR) { alert("QR image is required to receive donations."); return; }
    if (!isUpiQr) { alert("Valid UPI QR code is required."); return; }

    const extractedUpiId = upiDisplay.dataset.cleanUpi || "";
    const campaignId = document.getElementById("campaignId").value;

    const nextBtn = document.getElementById("nextBtn");
    nextBtn.innerHTML = "Saving Draft... ⏳";
    nextBtn.disabled = true;

    // Bundle the data (Aligned with the database columns for later use)
    const draftData = {
        campaignId: campaignId,
        ownerId: uniqueOwnerId,
        creator: creator,
        gift: gift,
        receiver: receiver,
        occasion: occasion === "Other" ? document.getElementById("otherOccasion").value.trim() : occasion,
        category: category === "Other" ? document.getElementById("otherCategory").value.trim() : category,
        target: target,
        targetDate: date,
        story: story,
        receiveMessages: receiveMessages,
        giftImageBase64: finalCroppedGift, 
        qrImageBase64: finalCroppedQR, 
        upiId: extractedUpiId,
        status: "Active",
        adminApproved: "Pending",
        raised: 0,
        donors: 0,
        createdAt: new Date().toLocaleString()
    };

    // Save strictly to this specific user's ID
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    localStorage.setItem(DRAFT_TIME_KEY, Date.now()); 

    // Redirect to expenses immediately without waiting for database upload
    window.location.href = "expenses.html";
});
