const API_BASE_URL = window.LICENSING_API_BASE_URL || "https://api.keshavwithvelo.in";
const REDUCE_LIVE_MOTION = true;
const ENABLE_CURSOR_MOTION = true;
const ENABLE_SLOW_ORBIT = true;
const cursor = document.getElementById("cursorEcho");
let lastEcho = 0;
let lastFrameEcho = 0;
const pointerTarget = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
};
const pointerCurrent = {
    x: pointerTarget.x,
    y: pointerTarget.y
};
function setMaintenanceGate(isActive, message) {
    const existing = document.getElementById("kwvMaintenanceGate");
    if (!isActive) {
        if (existing) existing.remove();
        document.body.classList.remove("kwv-maintenance-active");
        return;
    }

    const gate = existing || document.createElement("div");
    gate.id = "kwvMaintenanceGate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-labelledby", "kwvMaintenanceTitle");
    const safeMessage = String(message || "Website under maintenance. We are currently facing issues with our payment gateway and backend. After this is solved, we will update the website.")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    gate.innerHTML = `
        <div class="kwv-maintenance-card">
            <div class="kwv-maintenance-mark">KV</div>
            <p class="kwv-maintenance-eyebrow">Scheduled maintenance</p>
            <h1 id="kwvMaintenanceTitle">We'll be back shortly.</h1>
            <p>${safeMessage}</p>
            <div class="kwv-maintenance-actions">
                <a href="https://discord.gg/Yx5VaqPtFq" target="_blank" rel="noopener">Join Discord</a>
                <a href="mailto:keshavwithvelo@gmail.com">Contact support</a>
            </div>
        </div>
    `;

    if (!existing) document.body.appendChild(gate);
    document.body.classList.add("kwv-maintenance-active");
    document.documentElement.classList.remove("kwv-maintenance-checking");
}

async function initMaintenanceGate() {
    if (window.__KWV_MAINTENANCE_INITIAL__ && window.__KWV_MAINTENANCE_INITIAL__.checked) {
        setMaintenanceGate(window.__KWV_MAINTENANCE_INITIAL__.isActive, window.__KWV_MAINTENANCE_INITIAL__.message);
        document.documentElement.classList.remove("kwv-maintenance-checking");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/site-settings/maintenance`, {
            headers: { Accept: "application/json" },
            cache: "no-store"
        });
        if (!response.ok) return;
        const data = await response.json();
        setMaintenanceGate(data.isActive, data.message);
    } catch (error) {
        setMaintenanceGate(false);
    }
    document.documentElement.classList.remove("kwv-maintenance-checking");
}

initMaintenanceGate();

function updateScrollMotion() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, window.scrollY / max));
    document.body.style.setProperty("--scroll-progress", progress.toFixed(4));
    const pct = document.getElementById("scrollPercent");
    if (pct) pct.textContent = `${Math.round(progress * 100)}%`;
}

updateScrollMotion();
window.addEventListener("scroll", updateScrollMotion, { passive: true });
window.addEventListener("resize", updateScrollMotion);

function updateShowcaseMotion(clientX, clientY) {
    if (REDUCE_LIVE_MOTION) {
        document.body.style.setProperty("--showcase-shift", "0");
        return;
    }

    const showcase = document.querySelector(".panel-showcase");
    if (!showcase) return;

    const rect = showcase.getBoundingClientRect();
    const inside =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

    if (!inside) {
        document.body.style.setProperty("--showcase-shift", "0");
        return;
    }

    const shift = ((clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 2;
    document.body.style.setProperty("--showcase-shift", shift.toFixed(3));
}

function addEchoDot(clientX, clientY, targetDocument = document) {
    if (!ENABLE_CURSOR_MOTION) return;

    const now = performance.now();
    if (now - lastEcho > 52) {
        lastEcho = now;
        const dot = targetDocument.createElement("span");
        dot.className = "echo-dot";
        dot.style.left = `${clientX}px`;
        dot.style.top = `${clientY}px`;
        targetDocument.body.appendChild(dot);
        setTimeout(() => dot.remove(), 700);
    }
}

function addFrameEchoDot(frameDocument, clientX, clientY) {
    if (REDUCE_LIVE_MOTION) return;

    const now = performance.now();
    if (now - lastFrameEcho <= 24) return;

    lastFrameEcho = now;
    const dot = frameDocument.createElement("span");
    dot.style.cssText = `
        position: fixed;
        left: ${clientX}px;
        top: ${clientY}px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.94), rgba(255,21,21,0.78) 42%, transparent 76%);
        box-shadow: 0 0 14px rgba(255,21,21,0.75), 0 0 30px rgba(255,21,21,0.34), 0 0 42px rgba(31,199,255,0.18);
        pointer-events: none;
        transform: translate3d(-50%, -50%, 0);
        animation: frameEchoFade 0.62s cubic-bezier(.2,.8,.2,1) forwards;
        z-index: 2147483647;
        mix-blend-mode: screen;
    `;

    if (!frameDocument.getElementById("frameEchoStyle")) {
        const style = frameDocument.createElement("style");
        style.id = "frameEchoStyle";
        style.textContent = `
            * { cursor: none !important; }
            #frameCursorEcho {
                position: fixed;
                left: 0;
                top: 0;
                width: 20px;
                height: 20px;
                border: 1px solid rgba(255,255,255,0.7);
                border-radius: 50%;
                background:
                    radial-gradient(circle, rgba(255,255,255,0.95) 0 12%, rgba(255,21,21,0.98) 13% 24%, transparent 25%),
                    radial-gradient(circle, rgba(255,21,21,0.18), transparent 68%);
                box-shadow: 0 0 14px rgba(255,21,21,0.88), 0 0 30px rgba(255,21,21,0.42), 0 0 46px rgba(31,199,255,0.22);
                pointer-events: none;
                transform: translate3d(-50%, -50%, 0);
                opacity: 0;
                z-index: 2147483647;
                mix-blend-mode: screen;
            }
            #frameCursorEcho::before {
                content: "";
                position: absolute;
                inset: -6px;
                border: 1px solid rgba(255,21,21,0.28);
                border-radius: 50%;
            }
            #frameCursorEcho::after {
                content: "";
                position: absolute;
                inset: 6px;
                border-radius: 50%;
                background: rgba(255,255,255,0.86);
                box-shadow: 0 0 12px rgba(255,21,21,0.9);
            }
            @keyframes frameEchoFade {
                to {
                    opacity: 0;
                    transform: translate3d(-50%, -50%, 0) scale(3.6);
                }
            }
        `;
        frameDocument.head.appendChild(style);
    }

    frameDocument.body.appendChild(dot);
    setTimeout(() => dot.remove(), 700);
}

function ensureFrameCursor(frameDocument) {
    if (!frameDocument.getElementById("frameCursorStyle")) {
        const style = frameDocument.createElement("style");
        style.id = "frameCursorStyle";
        style.textContent = `
            #frameCursorEcho {
                position: fixed;
                left: 0;
                top: 0;
                width: 18px;
                height: 18px;
                border: 1px solid rgba(255,255,255,0.7);
                border-radius: 50%;
                background:
                    radial-gradient(circle, rgba(255,255,255,0.95) 0 12%, rgba(255,21,21,0.98) 13% 24%, transparent 25%),
                    radial-gradient(circle, rgba(255,21,21,0.18), transparent 68%);
                box-shadow: 0 0 12px rgba(255,21,21,0.82), 0 0 24px rgba(255,21,21,0.34);
                pointer-events: none;
                transform: translate3d(-50%, -50%, 0);
                opacity: 0;
                z-index: 2147483647;
                mix-blend-mode: screen;
            }
            #frameCursorEcho::before {
                content: "";
                position: absolute;
                inset: -5px;
                border: 1px solid rgba(255,21,21,0.26);
                border-radius: 50%;
            }
            #frameCursorEcho::after {
                content: "";
                position: absolute;
                inset: 6px;
                border-radius: 50%;
                background: rgba(255,255,255,0.86);
                box-shadow: 0 0 10px rgba(255,21,21,0.9);
            }
        `;
        frameDocument.head.appendChild(style);
    }

    let frameCursor = frameDocument.getElementById("frameCursorEcho");
    if (!frameCursor) {
        frameCursor = frameDocument.createElement("div");
        frameCursor.id = "frameCursorEcho";
        frameDocument.body.appendChild(frameCursor);
    }
    return frameCursor;
}

function handlePointerMove(clientX, clientY, isInteractive = false, shouldAddEcho = true) {
    pointerTarget.x = clientX;
    pointerTarget.y = clientY;
    if (cursor && ENABLE_CURSOR_MOTION) {
        cursor.style.opacity = "1";
        cursor.classList.toggle("active", isInteractive);
    }
    document.body.style.setProperty("--mouse-x", `${clientX}px`);
    document.body.style.setProperty("--mouse-y", `${clientY}px`);
    document.body.style.setProperty("--mouse-drift-x", REDUCE_LIVE_MOTION ? "0px" : `${((window.innerWidth / 2 - clientX) / 36).toFixed(2)}px`);
    document.body.style.setProperty("--mouse-drift-y", REDUCE_LIVE_MOTION ? "0px" : `${((window.innerHeight / 2 - clientY) / 36).toFixed(2)}px`);
    updateShowcaseMotion(clientX, clientY);
    if (shouldAddEcho) addEchoDot(clientX, clientY);
}

function hideParentFrameCursor() {
    if (!cursor) return;
    cursor.classList.add("in-frame");
    cursor.classList.remove("active");
    cursor.style.opacity = "0";
    document.querySelectorAll(".echo-dot").forEach((dot) => dot.remove());
}

function animateCursor() {
    if (!cursor || !ENABLE_CURSOR_MOTION) return;

    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.18;
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.18;
    cursor.style.transform = `translate3d(${pointerCurrent.x}px, ${pointerCurrent.y}px, 0) translate(-50%, -50%)`;
    document.body.style.setProperty("--smooth-mouse-x", `${pointerCurrent.x.toFixed(1)}px`);
    document.body.style.setProperty("--smooth-mouse-y", `${pointerCurrent.y.toFixed(1)}px`);
    requestAnimationFrame(animateCursor);
}

animateCursor();

function animateCounters() {
    const counters = [...document.querySelectorAll("[data-count-to]")];
    if (!counters.length) return;

    const runCounter = (counter) => {
        if (counter.dataset.counted === "true") return;
        counter.dataset.counted = "true";
        const target = Number(counter.dataset.countTo || 0);
        const start = performance.now();
        const duration = 1100;

        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = String(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
        counters.forEach(runCounter);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                runCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.35 });

    counters.forEach((counter) => observer.observe(counter));
}

animateCounters();

function getYoutubeId(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;

    try {
        const url = new URL(raw);
        if (url.searchParams.has("v")) return url.searchParams.get("v");

        const parts = url.pathname.split("/").filter(Boolean);
        const embedIndex = parts.indexOf("embed");
        const shortsIndex = parts.indexOf("shorts");

        if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
        if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
        if (url.hostname.includes("youtu.be") && parts[0]) return parts[0];
    } catch (error) {
        return "";
    }

    return "";
}

function setTutorialVideo(url) {
    const video = document.querySelector(".tutorial-video");
    const frame = document.getElementById("tutorialFrame");
    const watchLink = document.getElementById("tutorialWatchLink");
    if (!video || !frame || !watchLink) return;

    const videoId = getYoutubeId(url);

    if (!videoId) {
        video.classList.add("is-empty");
        frame.removeAttribute("src");
        watchLink.setAttribute("aria-disabled", "true");
        watchLink.href = "#";
        return;
    }

    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    video.classList.remove("is-empty");
    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
    watchLink.href = watchUrl;
    watchLink.setAttribute("aria-disabled", "false");
}

async function initTutorialVideo() {
    const video = document.querySelector(".tutorial-video");
    if (!video) return;

    let url = video.dataset.youtubeUrl || "";

    try {
        const response = await fetch(`${API_BASE_URL}/api/site-settings/tutorial`, {
            headers: { Accept: "application/json" }
        });
        if (response.ok) {
            const data = await response.json();
            url = data.youtubeUrl || url;
        }
    } catch (error) {
        // Keep the built-in placeholder if the API is unavailable.
    }

    setTutorialVideo(url);
}

initTutorialVideo();

function setOfferTicker(text, isActive = true) {
    const ticker = document.getElementById("offerTicker");
    const track = document.getElementById("offerTickerTrack");
    const message = String(text || "").trim();
    if (!ticker || !track) return;

    if (!message || !isActive) {
        ticker.classList.remove("active");
        ticker.setAttribute("aria-hidden", "true");
        track.textContent = "";
        return;
    }

    track.textContent = "";
    for (let i = 0; i < 8; i += 1) {
        const item = document.createElement("span");
        item.textContent = message;
        track.append(item);
    }
    ticker.classList.add("active");
    ticker.setAttribute("aria-hidden", "false");
}

async function initOfferTicker() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/site-settings/offer-banner`, {
            headers: { Accept: "application/json" }
        });
        if (!response.ok) return;
        const data = await response.json();
        setOfferTicker(data.text, data.isActive);
    } catch (error) {
        setOfferTicker("");
    }
}

initOfferTicker();

function animateFeatureOrbit() {
    const orbit = document.querySelector(".feature-orbit");
    const cards = [...document.querySelectorAll(".orbit-card")];

    if (orbit && cards.length) {
        const rect = orbit.getBoundingClientRect();
        const mobile = window.innerWidth <= 980;

        if (mobile) {
            cards.forEach((card) => {
                card.style.transform = "";
            });
        } else {
            const radiusX = Math.min(rect.width * 0.47, 620);
            const radiusY = Math.min(rect.height * 0.45, 600);
            const time = ENABLE_SLOW_ORBIT ? performance.now() / 1000 : 0;
            const speed = 0.012;

            cards.forEach((card, index) => {
                const angle = (index / cards.length) * Math.PI * 2 + time * speed;
                const x = Math.cos(angle) * radiusX;
                const y = Math.sin(angle) * radiusY;

                const depth = (Math.sin(angle) + 1) / 2;
                card.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
                card.style.opacity = (0.72 + depth * 0.28).toFixed(2);
                card.style.zIndex = String(2 + Math.round(depth * 6));
            });
        }
    }

    if (ENABLE_SLOW_ORBIT && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        requestAnimationFrame(animateFeatureOrbit);
    }
}

animateFeatureOrbit();

document.addEventListener("pointermove", (event) => {
    if (cursor) cursor.classList.remove("in-frame");
    const frameArea = event.target.closest(".extension-frame-shell, .floating-panel-shell, .real-extension-frame");
    handlePointerMove(
        event.clientX,
        event.clientY,
        Boolean(event.target.closest("button, a, .extension-frame-shell, .floating-panel-shell")),
        !frameArea
    );
});

document.addEventListener("pointerleave", () => {
    if (cursor) cursor.style.opacity = "0";
    document.body.style.setProperty("--showcase-shift", "0");
});

function wireFramePointerEcho(frame) {
    const attach = () => {
        try {
            const frameDocument = frame.contentDocument;
            if (!frameDocument || frame.dataset.echoWired === "true") return;
            frame.dataset.echoWired = "true";
            if (!frameDocument.getElementById("frameCursorHideStyle")) {
                const hideCursorStyle = frameDocument.createElement("style");
                hideCursorStyle.id = "frameCursorHideStyle";
                hideCursorStyle.textContent = "* { cursor: none !important; }";
                frameDocument.head.appendChild(hideCursorStyle);
            }

            frameDocument.addEventListener("pointermove", (event) => {
                const rect = frame.getBoundingClientRect();
                handlePointerMove(rect.left + event.clientX, rect.top + event.clientY, true, false);
                if (!cursor) return;
                cursor.classList.add("in-frame");
                const frameCursor = ensureFrameCursor(frameDocument);
                frameCursor.style.opacity = "1";
                frameCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
                addFrameEchoDot(frameDocument, event.clientX, event.clientY);
            });

            frameDocument.addEventListener("pointerleave", () => {
                const frameCursor = frameDocument.getElementById("frameCursorEcho");
                if (frameCursor) frameCursor.style.opacity = "0";
                cursor.classList.remove("in-frame");
                cursor.classList.remove("active");
            });
        } catch (error) {
            frame.addEventListener("pointerenter", () => cursor.classList.add("active"));
            frame.addEventListener("pointerleave", () => {
                cursor.classList.remove("active");
                cursor.classList.remove("in-frame");
            });
        }
    };

    frame.addEventListener("pointerenter", hideParentFrameCursor);
    frame.addEventListener("pointerover", hideParentFrameCursor);
    frame.addEventListener("load", attach);
    attach();
}

document.querySelectorAll(".real-extension-frame").forEach(wireFramePointerEcho);

document.querySelectorAll(".extension-frame-shell, .floating-panel-shell").forEach((shell) => {
    shell.addEventListener("pointerenter", (event) => {
        if (event.target.querySelector(".real-extension-frame")) {
            document.querySelectorAll(".echo-dot").forEach((dot) => dot.remove());
        }
    });
});

document.querySelectorAll("button, .primary-btn, .ghost-btn").forEach((control) => {
    control.addEventListener("pointerdown", (event) => {
        if (REDUCE_LIVE_MOTION) return;

        const rect = control.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "button-ripple";
        ripple.style.left = `${event.clientX - rect.left}px`;
        ripple.style.top = `${event.clientY - rect.top}px`;
        control.appendChild(ripple);
        setTimeout(() => ripple.remove(), 650);
    });
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
    button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scroll);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
});

const shell = document.getElementById("frameShell");
const frameButtons = {
    fitBtn: "",
    wideBtn: "wide",
    tallBtn: "tall"
};

Object.entries(frameButtons).forEach(([id, mode]) => {
    const button = document.getElementById(id);
    if (!button || !shell) return;
    button.addEventListener("click", () => {
        shell.classList.remove("wide", "tall");
        if (mode) shell.classList.add(mode);
        document.querySelectorAll(".frame-actions button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
    });
});

document.getElementById("fitBtn")?.classList.add("active");

const modal = document.getElementById("paymentModal");
const modalTitle = document.getElementById("modalTitle");
const checkoutChoice = document.getElementById("checkoutChoice");
const checkoutDetails = document.getElementById("checkoutDetails");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutStatus = document.getElementById("checkoutStatus");
const checkoutPlanLabel = document.getElementById("checkoutPlanLabel");
const checkoutPriceLabel = document.getElementById("checkoutPriceLabel");
const checkoutDiscountLine = document.getElementById("checkoutDiscountLine");
const checkoutButtonText = document.getElementById("checkoutButtonText");
const planOptionButtons = document.querySelectorAll("[data-select-plan]");
let selectedPlan = "India Launch";

const customerSessionKey = "kwvCustomerSession";
const loginModal = document.getElementById("loginModal");
const loginOpen = document.getElementById("loginOpen");
const loginClose = document.getElementById("loginClose");
const loginButtonText = document.getElementById("loginButtonText");
const customerLoginForm = document.getElementById("customerLoginForm");
const loginStatus = document.getElementById("loginStatus");
const loginSubmitText = document.getElementById("loginSubmitText");
const loginDashboard = document.getElementById("loginDashboard");
const customerLogout = document.getElementById("customerLogout");
const loginAccountEmail = document.getElementById("loginAccountEmail");
const loginAccountHint = document.getElementById("loginAccountHint");
const loginAccountStatus = document.getElementById("loginAccountStatus");
const loginWelcome = document.getElementById("loginWelcome");
const customerDownloadUpdate = document.getElementById("customerDownloadUpdate");
const customerDownloadText = document.getElementById("customerDownloadText");
const customerDownloadStatus = document.getElementById("customerDownloadStatus");

let planDetails = {
    "India Launch": {
        title: "India Launch checkout",
        plan: "India Launch",
        price: "₹99",
        amount: 9900,
        currency: "INR",
        button: "Checkout"
    },
    International: {
        title: "International checkout",
        plan: "International",
        price: "$2",
        amount: 200,
        currency: "USD",
        button: "Checkout"
    }
};

function sitePriceLabel(plan) {
    if (!plan) return "";
    if (plan.key === "India Launch" || plan.plan === "India Launch" || plan.title === "India Launch") return "₹99";
    if (plan.key === "International" || plan.plan === "International" || plan.title === "International") return "$2";
    return plan.price;
}

function updateDisplayedPrices() {
    Object.entries(planDetails).forEach(([key, details]) => {
        const price = document.querySelector(`[data-plan-price="${key}"]`);
        const button = document.querySelector(`[data-plan-button="${key}"]`);
        if (price) price.textContent = details.price;
        if (button) button.textContent = `Buy for ${details.price}`;
    });
}

function setSelectedPlan(planKey) {
    selectedPlan = planKey;
    const details = planDetails[selectedPlan] || planDetails["India Launch"];
    modalTitle.textContent = details.title;
    checkoutPlanLabel.textContent = details.plan;
    checkoutPriceLabel.textContent = details.price;
    setCheckoutDiscount("");
    checkoutButtonText.textContent = details.button;
    setCheckoutStatus("Choose India or International, then complete checkout.");
    planOptionButtons.forEach((button) => {
        const isActive = button.dataset.selectPlan === selectedPlan;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
}

function showPlanChoice(preferredPlan = "India Launch") {
    setSelectedPlan(preferredPlan);
    checkoutChoice.hidden = false;
    checkoutDetails.hidden = true;
    checkoutForm.reset();
}

function showCheckoutDetails(planKey = "India Launch") {
    setSelectedPlan(planKey);
    checkoutChoice.hidden = true;
    checkoutDetails.hidden = false;
    requestAnimationFrame(() => document.getElementById("checkoutName")?.focus());
}

async function loadPricing() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pricing`);
        if (!response.ok) return;
        const data = await response.json();
        (data.plans || []).forEach((plan) => {
            const normalizedPrice = sitePriceLabel(plan);
            planDetails[plan.key] = {
                title: `${plan.title} checkout`,
                plan: plan.title,
                price: normalizedPrice || plan.price,
                amount: plan.amount,
                currency: plan.currency,
                button: "Checkout"
            };
        });
        updateDisplayedPrices();
    } catch (error) {
        // Keep static fallback prices if the backend is waking up.
    }
}

function setCheckoutStatus(message, mode = "") {
    checkoutStatus.className = `checkout-note${mode ? ` ${mode}` : ""}`;
    checkoutStatus.textContent = message;
}

function setCheckoutDiscount(message = "") {
    if (!checkoutDiscountLine) return;
    checkoutDiscountLine.textContent = message;
    checkoutDiscountLine.classList.toggle("hidden", !message);
}

function appendCheckoutLine(label, value) {
    const line = document.createElement("span");
    line.className = "checkout-note-line";
    line.append(label);

    if (value instanceof Node) {
        line.append(value);
    } else {
        const strong = document.createElement("strong");
        strong.textContent = value;
        line.append(strong);
    }

    checkoutStatus.append(line);
}

function setCheckoutSuccess(data) {
    checkoutStatus.className = "checkout-note success";
    checkoutStatus.textContent = "";

    const emailMessage = document.createElement("span");
    if (data.emailDelivery?.sent) {
        emailMessage.textContent = `Payment confirmed. Activation email and key sent to ${data.email}.`;
    } else if (data.emailDelivery?.skipped) {
        emailMessage.textContent = "Payment confirmed. Email delivery needs manual follow-up; contact support with your payment ID.";
    } else {
        emailMessage.textContent = "Payment confirmed. Email delivery failed; contact support with your payment ID.";
    }
    checkoutStatus.append(emailMessage);

    if (data.downloadUrl) {
        const downloadLink = document.createElement("a");
        downloadLink.href = data.downloadUrl;
        downloadLink.target = "_blank";
        downloadLink.rel = "noopener";
        downloadLink.textContent = "Download extension";
        appendCheckoutLine("Download: ", downloadLink);
    }
}

document.querySelectorAll("[data-open-payment]").forEach((button) => {
    button.addEventListener("click", () => {
        const plan = button.dataset.openPayment || "India Launch";
        if (button.classList.contains("pricing-buy")) {
            showCheckoutDetails(plan);
        } else {
            showPlanChoice(plan);
        }
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    });
});

planOptionButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showCheckoutDetails(button.dataset.selectPlan || "India Launch");
    });
});

function readCustomerSession() {
    try {
        return JSON.parse(localStorage.getItem(customerSessionKey) || "null");
    } catch (error) {
        return null;
    }
}

function saveCustomerSession(customer, keyLast4 = "") {
    localStorage.setItem(customerSessionKey, JSON.stringify({
        ...customer,
        keyLast4: keyLast4 || customer.keyLast4 || customer.licenseHint || "",
        verifiedAt: new Date().toISOString()
    }));
}

function clearCustomerSession() {
    localStorage.removeItem(customerSessionKey);
}

function setLoginStatus(message, mode = "") {
    if (!loginStatus) return;
    loginStatus.className = `checkout-note${mode ? ` ${mode}` : ""}`;
    loginStatus.textContent = message;
}

function setCustomerDownloadStatus(message, mode = "") {
    if (!customerDownloadStatus) return;
    customerDownloadStatus.className = `checkout-note${mode ? ` ${mode}` : ""}`;
    customerDownloadStatus.textContent = message;
}

function renderCustomerSession(customer) {
    const isLoggedIn = Boolean(customer?.email);
    if (loginOpen) loginOpen.classList.toggle("is-logged-in", isLoggedIn);
    if (loginButtonText) loginButtonText.textContent = isLoggedIn ? "Profile" : "Login";

    if (customerLoginForm) customerLoginForm.hidden = isLoggedIn;
    if (loginDashboard) loginDashboard.hidden = !isLoggedIn;
    if (!isLoggedIn) return;

    if (loginAccountEmail) loginAccountEmail.textContent = customer.email;
    if (loginAccountHint) loginAccountHint.textContent = `**** ${customer.licenseHint || "----"}`;
    if (loginAccountStatus) loginAccountStatus.textContent = customer.licenseStatus || "Verified";
    if (loginWelcome) loginWelcome.textContent = `${customer.product || "Your 400x access"} is verified for this purchase email.`;
    setCustomerDownloadStatus("Download the latest verified extension ZIP for this account.");
}

function openLoginModal() {
    renderCustomerSession(readCustomerSession());
    loginModal?.classList.add("active");
    loginModal?.setAttribute("aria-hidden", "false");
    if (!readCustomerSession()) {
        setLoginStatus("Enter the same email used during purchase.");
        requestAnimationFrame(() => document.getElementById("loginEmail")?.focus());
    }
}

function closeLoginModal() {
    loginModal?.classList.remove("active");
    loginModal?.setAttribute("aria-hidden", "true");
}

loginOpen?.addEventListener("click", openLoginModal);
loginClose?.addEventListener("click", closeLoginModal);
loginModal?.addEventListener("click", (event) => {
    if (event.target === loginModal) closeLoginModal();
});

document.getElementById("loginKeyLast4")?.addEventListener("input", (event) => {
    event.target.value = String(event.target.value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
});

customerLoginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(customerLoginForm);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const keyLast4 = String(formData.get("keyLast4") || "").trim().toUpperCase();
    const submitButton = customerLoginForm.querySelector("button");

    if (!email || keyLast4.length !== 4) {
        setLoginStatus("Enter your activation email and exact last 4 license key characters.", "error");
        return;
    }

    submitButton.disabled = true;
    if (loginSubmitText) loginSubmitText.textContent = "Verifying...";
    setLoginStatus("Checking your purchase license...", "loading");

    try {
        const response = await fetch(`${API_BASE_URL}/api/customer-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, keyLast4 })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.reason || data.error || "Login failed");

        saveCustomerSession(data.customer, keyLast4);
        renderCustomerSession(readCustomerSession());
        customerLoginForm.reset();
    } catch (error) {
        setLoginStatus(error.message || "Could not verify login. Check your email and last 4 key characters.", "error");
    } finally {
        submitButton.disabled = false;
        if (loginSubmitText) loginSubmitText.textContent = "Verify login";
    }
});

customerLogout?.addEventListener("click", () => {
    clearCustomerSession();
    renderCustomerSession(null);
    setLoginStatus("Logged out. Enter purchase details to login again.");
    requestAnimationFrame(() => document.getElementById("loginEmail")?.focus());
});

customerDownloadUpdate?.addEventListener("click", () => {
    const customer = readCustomerSession();
    const email = customer?.email;
    const keyLast4 = String(customer?.keyLast4 || customer?.licenseHint || "").trim().toUpperCase();

    if (!email || keyLast4.length !== 4) {
        setCustomerDownloadStatus("Login again so we can verify your purchase before download.", "error");
        return;
    }

    setCustomerDownloadStatus("Checking latest update access...", "loading");
    if (customerDownloadText) customerDownloadText.textContent = "Opening download...";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${API_BASE_URL}/api/customer-download`;
    form.target = "_blank";
    form.style.display = "none";

    const emailInput = document.createElement("input");
    emailInput.type = "hidden";
    emailInput.name = "email";
    emailInput.value = email;

    const keyInput = document.createElement("input");
    keyInput.type = "hidden";
    keyInput.name = "keyLast4";
    keyInput.value = keyLast4;

    form.append(emailInput, keyInput);
    document.body.appendChild(form);
    form.submit();
    form.remove();

    window.setTimeout(() => {
        setCustomerDownloadStatus("If your browser blocked the new tab, allow popups and click download new version again.");
        if (customerDownloadText) customerDownloadText.textContent = "Download new version";
    }, 900);
});

renderCustomerSession(readCustomerSession());

function closeModal() {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

document.getElementById("modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
});

checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

        const formData = new FormData(checkoutForm);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim().toLowerCase();
        const couponCode = String(formData.get("couponCode") || "").trim().toUpperCase();
        if (!name || !email) {
            setCheckoutStatus("Enter your name and email so we can deliver your license.", "error");
            return;
        }

    const submitButton = checkoutForm.querySelector("button");
    submitButton.disabled = true;
    checkoutButtonText.textContent = "Opening Razorpay...";
    setCheckoutStatus("Creating secure Razorpay order...", "loading");

    try {
        const details = planDetails[selectedPlan] || planDetails["India Launch"];
        const orderResponse = await fetch(`${API_BASE_URL}/api/razorpay/order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: "keshav-with-velo",
                plan: selectedPlan,
                name,
                email,
                couponCode
            })
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.reason || orderData.error || orderData.message || "Could not create Razorpay order");
        if (!window.Razorpay) throw new Error("Razorpay checkout script is not loaded. Check internet connection.");

        const order = orderData.order;
        if (order.discount) {
            checkoutPriceLabel.textContent = details.price;
            setCheckoutDiscount(`${order.discount.code} applied: ${order.discount.label}. Pay ${formatCheckoutPrice(order.finalAmount, order.currency)}.`);
        } else {
            checkoutPriceLabel.textContent = details.price;
            setCheckoutDiscount("");
        }
        setCheckoutStatus("Razorpay gateway is opening...", "loading");

        const payment = await new Promise((resolve, reject) => {
            const razorpay = new window.Razorpay({
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                name: "Keshav With Velo",
                description: order.description || details.title,
                order_id: order.orderId,
                notes: {
                    productId: "keshav-with-velo",
                    plan: selectedPlan,
                    name,
                    email,
                    couponCode: order.couponCode || ""
                },
                prefill: { name, email },
                theme: {
                    color: "#ff1515"
                },
                handler: resolve,
                modal: {
                    ondismiss: () => reject(new Error("Payment popup closed before completion."))
                }
            });

            razorpay.on("payment.failed", (response) => {
                reject(new Error(response?.error?.description || "Razorpay payment failed."));
            });

            razorpay.open();
        });

        checkoutButtonText.textContent = "Generating license...";
        setCheckoutStatus("Payment received. Creating your license...", "loading");

        const response = await fetch(`${API_BASE_URL}/api/purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: "keshav-with-velo",
                name,
                email,
                paymentProvider: "razorpay",
                paymentId: payment.razorpay_payment_id,
                razorpayOrderId: payment.razorpay_order_id,
                razorpaySignature: payment.razorpay_signature,
                couponCode: order.couponCode || "",
                licenseType: order.licenseType || "standard"
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.reason || data.error || "Purchase failed");

        setCheckoutSuccess(data);
        checkoutForm.reset();
    } catch (error) {
        setCheckoutDiscount("");
        setCheckoutStatus(error.message || "Could not generate license. Check backend server.", "error");
    } finally {
        submitButton.disabled = false;
        const details = planDetails[selectedPlan] || planDetails["India Launch"];
        checkoutButtonText.textContent = details.button;
    }
});

function formatCheckoutPrice(amount, currency) {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: amount % 100 === 0 ? 0 : 2
    }).format(amount / 100);
}

loadPricing();
