/*=====================================================================
  GIFTBLOOM GLOBAL LOADER (loader.js)
  • Injects your exact canvas heart + shimmering calligraphy loader DOM & CSS
  • Intercepts every fetch() call and tracks active request counts (zero flicker)
  • Waits for HTML/CSS, all backend calls, AND dynamic campaign images to load
  • Automatically shows on page load, navigation, page refresh, and backend talks
  • Exposes window.showPageLoader() and window.hidePageLoader() globally
=====================================================================*/
(function () {
    "use strict";

    let activeRequests = 0;
    let manualLocks = 0;
    let isPageLoading = document.readyState !== "complete";
    let hideTimeout = null;
    let loaderAnimId = null;
    let isAnimating = false;
    let startCanvasLoop = null;

    /* 1. INJECT EXACT LOADER CSS */
    const style = document.createElement("style");
    style.id = "giftbloom-global-loader-style";
    style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Poppins:wght@400;600&display=swap');

        .page-loader {
            position: fixed;
            inset: 0;
            background: rgba(15, 10, 25, 0.4); 
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 999999; 
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 1;
            visibility: visible;
            transition: opacity 0.6s ease, visibility 0.6s ease;
            font-family: 'Poppins', sans-serif;
            user-select: none;
        }
        .page-loader.fade-out {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }
        .loader-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
        }
        #loaderCanvas {
            width: 300px;
            height: 300px;
            z-index: 1;
            display: block;
        }
        .loader-name {
            position: absolute;
            top: 43%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Great Vibes', 'Dancing Script', 'Brush Script MT', cursive;
            font-size: 14px;
            z-index: 3;
            pointer-events: none;
            white-space: nowrap;
            background: linear-gradient(
                90deg, 
                rgba(255, 77, 141, 0.3) 0%, 
                rgba(255, 255, 255, 1) 50%, 
                rgba(255, 77, 141, 0.3) 100%
            );
            background-size: 200% auto;
            color: transparent;
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 8px rgba(255, 77, 141, 0.8));
            animation: shimmer 1.8s linear infinite;
        }
        @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }
        .loader-status {
            color: #ffb3d9;
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 3px;
            text-transform: uppercase;
            text-shadow: 0 0 10px rgba(255, 77, 141, 0.6);
            animation: fade-text 1.2s infinite alternate;
            margin-top: -20px; 
            z-index: 2;
            text-align: center;
        }
        @keyframes fade-text {
            0% { opacity: 0.5; text-shadow: 0 0 5px rgba(255, 77, 141, 0.4); }
            100% { opacity: 1; text-shadow: 0 0 15px rgba(255, 77, 141, 1); }
        }
    `;
    document.head.appendChild(style);

    /* 2. GET LOGGED-IN USER OR ADMIN FIRST NAME */
    function getLoggedInFirstName() {
        try {
            const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
            if (userStr) {
                const u = JSON.parse(userStr);
                if (u && u.name && u.name.trim()) return u.name.trim().split(" ")[0];
            }
            const adminStr = localStorage.getItem("adminProfile") || sessionStorage.getItem("adminProfile");
            if (adminStr) {
                const a = JSON.parse(adminStr);
                if (a && a.name && a.name.trim()) return a.name.trim().split(" ")[0];
            }
        } catch (e) {}
        return "";
    }

    /* 3. ENSURE LOADER DOM EXISTS (WORKS WITH OR WITHOUT INLINE HTML) */
    function ensureLoaderDOM() {
        let loader = document.getElementById("pageLoader");
        if (!loader && document.body) {
            loader = document.createElement("div");
            loader.id = "pageLoader";
            loader.className = "page-loader";
            loader.innerHTML = `
                <div class="loader-content">
                    <div id="loaderName" class="loader-name">Loading...</div>
                    <canvas id="loaderCanvas" width="300" height="300"></canvas>
                    <p id="loaderStatusText" class="loader-status">Blooming your gifts...</p>
                </div>
            `;
            document.body.prepend(loader);
        }
        initCanvasAnimation();
        return loader;
    }

    /* 4. CANVAS PARTICLE HEART ANIMATION */
    function initCanvasAnimation() {
        const loaderCanvas = document.getElementById("loaderCanvas");
        if (!loaderCanvas || loaderCanvas.dataset.initialized === "true") return;
        loaderCanvas.dataset.initialized = "true";

        const ctx = loaderCanvas.getContext("2d");
        const cw = (loaderCanvas.width = 300);
        const ch = (loaderCanvas.height = 300);
        const cx = cw / 2;
        const cy = ch / 2 - 20;

        const HEART_RES = 256;
        const hpx = new Float32Array(HEART_RES);
        const hpy = new Float32Array(HEART_RES);

        for (let i = 0; i < HEART_RES; i++) {
            const t = (i / HEART_RES) * Math.PI * 2;
            hpx[i] = 16 * Math.pow(Math.sin(t), 3);
            hpy[i] = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        }

        const N = 350;
        const particles = [];
        const colors = ["#ff4d8d", "#4740ff", "#ff1493", "#ff84b7", "#ffb3d9", "#ff40a8"];

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
            if (!isAnimating) return;

            ctx.globalCompositeOperation = "destination-out";
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.fillRect(0, 0, cw, ch);

            ctx.globalCompositeOperation = "lighter";

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
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

                let diff = (activeIndex - p.targetIndex + HEART_RES) % HEART_RES;
                if (diff < 25) {
                    const intensity = 1 - diff / 25;
                    ctx.fillStyle = "#ff4d8d";
                    ctx.shadowBlur = 15 * intensity;
                    ctx.shadowColor = "#ff4d8d";
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else {
                    ctx.fillStyle = p.color;
                    ctx.fill();
                }
            }
            loaderAnimId = requestAnimationFrame(animateLoader);
        }

        startCanvasLoop = function () {
            if (!isAnimating) {
                isAnimating = true;
                loaderAnimId = requestAnimationFrame(animateLoader);
            }
        };

        startCanvasLoop();
    }

    /* 5. WAIT FOR DYNAMICALLY INJECTED CAMPAIGN IMAGES */
    function waitForDynamicImages(callback) {
        const imgs = Array.from(document.querySelectorAll(".campaign-card img, .image-box img, .card-image img"))
            .filter(img => !img.complete);

        if (imgs.length === 0) {
            callback();
            return;
        }

        let remaining = imgs.length;
        let settled = false;

        function checkDone() {
            if (settled) return;
            remaining--;
            if (remaining <= 0) {
                settled = true;
                callback();
            }
        }

        imgs.forEach(img => {
            img.addEventListener("load", checkDone, { once: true });
            img.addEventListener("error", checkDone, { once: true });
        });

        // 3-second safety cap so a slow Google Drive thumbnail never traps the user
        setTimeout(() => {
            if (!settled) {
                settled = true;
                callback();
            }
        }, 3000);
    }

    /* 6. VISIBILITY CONTROLLER */
    function renderLoaderVisible(customText = "Loading...", statusSubtext = "Blooming your gifts...") {
        if (!document.body) return;
        const loader = ensureLoaderDOM();
        if (!loader) return;

        clearTimeout(hideTimeout);

        const nameEl = document.getElementById("loaderName") || loader.querySelector(".loader-name");
        const statusEl = document.getElementById("loaderStatusText") || loader.querySelector(".loader-status");
        const firstName = getLoggedInFirstName();

        if (nameEl) {
            nameEl.textContent = firstName ? firstName : (customText || "Loading...");
        }
        if (statusEl) {
            statusEl.textContent = statusSubtext || "Blooming your gifts...";
        }

        document.body.style.cursor = "wait";
        loader.style.display = "flex";
        if (startCanvasLoop) startCanvasLoop();

        requestAnimationFrame(() => {
            loader.classList.remove("fade-out");
        });
    }

    function tryHideLoader() {
        if (isPageLoading || activeRequests > 0 || manualLocks > 0) return;

        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            if (isPageLoading || activeRequests > 0 || manualLocks > 0) return;

            waitForDynamicImages(() => {
                if (isPageLoading || activeRequests > 0 || manualLocks > 0) return;
                const loader = document.getElementById("pageLoader");
                if (document.body) document.body.style.cursor = "default";
                if (loader) {
                    loader.classList.add("fade-out");
                    setTimeout(() => {
                        if (activeRequests === 0 && manualLocks === 0 && !isPageLoading) {
                            loader.style.display = "none";
                            isAnimating = false;
                            if (loaderAnimId) cancelAnimationFrame(loaderAnimId);
                        }
                    }, 600);
                }
            });
        }, 120);
    }

    /* 7. GLOBAL WINDOW FUNCTIONS (BACKWARD COMPATIBLE) */
    window.showPageLoader = function (customText = "Loading...") {
        manualLocks++;
        renderLoaderVisible(customText, customText === "Loading..." ? "Blooming your gifts..." : customText);
    };

    window.hidePageLoader = function () {
        if (manualLocks > 0) manualLocks--;
        tryHideLoader();
    };

    /* 8. AUTOMATIC FETCH INTERCEPTOR (CATCHES EVERY BACKEND TALK) */
    const ACTION_STATUS_MAP = {
        loginUser: "Logging you in...",
        loginAdmin: "Verifying Admin access...",
        verifyAdminStep1: "Checking credentials...",
        getAdminDashboardData: "Loading Admin Dashboard...",
        updateAdminProfile: "Saving Admin profile...",
        changeAdminOwnPassword: "Updating Admin password...",
        logoutAllAdminSessions: "Ending all sessions...",
        getUserCampaigns: "Fetching your campaigns...",
        getAllCampaigns: "Loading campaigns...",
        getCampaignById: "Loading campaign details...",
        createCampaign: "Publishing campaign...",
        deleteCampaign: "Deleting campaign...",
        deleteAllUserCampaigns: "Deleting all campaigns...",
        updateCampaignStatus: "Updating campaign status...",
        toggleCampaignVerification: "Updating verification...",
        blockCampaign: "Blocking campaign...",
        extendCampaignDate: "Extending deadline...",
        verifyPayment: "Verifying payment...",
        rejectPayment: "Rejecting payment...",
        verifyDonation: "Verifying donation...",
        rejectDonation: "Rejecting donation...",
        recordDonation: "Recording donation...",
        getUserDonations: "Loading donations...",
        getUserNotifications: "Checking notifications...",
        markNotificationRead: "Updating notification...",
        markAllNotificationsRead: "Marking all read...",
        clearNotifications: "Clearing notifications...",
        requestProfileChange: "Sending verification code...",
        verifyProfileChange: "Verifying & saving profile...",
        resendProfileChangeOtp: "Resending verification code...",
        requestEmailVerification: "Sending verification email...",
        verifyEmailOtp: "Verifying your email...",
        changeUserPassword: "Updating password...",
        resetPassword: "Sending reset link...",
        updatePassword: "Updating password...",
        registerUser: "Creating your account...",
        verifySignupOtp: "Verifying signup code...",
        resendSignupOtp: "Resending signup code...",
        makeUserAdmin: "Promoting user to Admin...",
        removeAdminAccess: "Removing Admin access...",
        updateUserStatus: "Updating user status...",
        deleteUser: "Deleting account...",
        resolveReport: "Resolving report...",
        deleteReport: "Deleting report...",
        sendAdminEmail: "Sending email...",
        sendBulkEmail: "Sending broadcast email...",
        notifyAdminsPinChange: "Notifying admins...",
        checkGiftImage: "Verifying gift image...",
        logoutSession: "Logging out..."
    };

    const nativeFetch = window.fetch.bind(window);
    window.fetch = async function (...args) {
        let customCenter = "Loading...";
        let statusText = "Blooming your gifts...";
        try {
            const options = args[1];
            if (options && typeof options.body === "string") {
                const parsed = JSON.parse(options.body);
                if (parsed && parsed.action) {
                    // Silent background actions that shouldn't block the screen
                    if (
                        parsed.action === "incrementCampaignView" ||
                        parsed.action === "cancelProfileChange" ||
                        parsed.action === "askAI"
                    ) {
                        return nativeFetch(...args);
                    }
                    if (ACTION_STATUS_MAP[parsed.action]) {
                        customCenter = ACTION_STATUS_MAP[parsed.action];
                        statusText = ACTION_STATUS_MAP[parsed.action];
                    }
                }
            }
        } catch (e) {}

        activeRequests++;
        renderLoaderVisible(customCenter, statusText);

        try {
            return await nativeFetch(...args);
        } finally {
            activeRequests = Math.max(0, activeRequests - 1);
            tryHideLoader();
        }
    };

    /* 9. PAGE LOAD & NAVIGATION EVENTS */
    if (document.body) {
        renderLoaderVisible("Loading...", "Blooming your gifts...");
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            renderLoaderVisible("Loading...", "Blooming your gifts...");
        });
    }

    window.addEventListener("load", () => {
        isPageLoading = false;
        setTimeout(tryHideLoader, 180);
    });

    window.addEventListener("beforeunload", () => {
        renderLoaderVisible("Loading...", "Blooming your gifts...");
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            isPageLoading = false;
            activeRequests = 0;
            manualLocks = 0;
            tryHideLoader();
        }
    });
})();
