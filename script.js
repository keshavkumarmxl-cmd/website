const API_BASE_URL = window.LICENSING_API_BASE_URL || "https://keshavwithvelo-license-api.onrender.com";
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
    const now = performance.now();
    if (now - lastEcho > 24) {
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
    cursor.style.opacity = "1";
    cursor.classList.toggle("active", isInteractive);
    document.body.style.setProperty("--mouse-x", `${clientX}px`);
    document.body.style.setProperty("--mouse-y", `${clientY}px`);
    document.body.style.setProperty("--mouse-drift-x", `${((window.innerWidth / 2 - clientX) / 36).toFixed(2)}px`);
    document.body.style.setProperty("--mouse-drift-y", `${((window.innerHeight / 2 - clientY) / 36).toFixed(2)}px`);
    updateShowcaseMotion(clientX, clientY);
    if (shouldAddEcho) addEchoDot(clientX, clientY);
}

function hideParentFrameCursor() {
    cursor.classList.add("in-frame");
    cursor.classList.remove("active");
    cursor.style.opacity = "0";
    document.querySelectorAll(".echo-dot").forEach((dot) => dot.remove());
}

function animateCursor() {
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
            const radiusX = Math.min(rect.width * 0.43, 540);
            const radiusY = Math.min(rect.height * 0.43, 520);
            const time = performance.now() / 1000;
            const speed = 0.07;

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

    requestAnimationFrame(animateFeatureOrbit);
}

animateFeatureOrbit();

document.addEventListener("pointermove", (event) => {
    cursor.classList.remove("in-frame");
    const frameArea = event.target.closest(".extension-frame-shell, .floating-panel-shell, .real-extension-frame");
    handlePointerMove(
        event.clientX,
        event.clientY,
        Boolean(event.target.closest("button, a, .extension-frame-shell, .floating-panel-shell")),
        !frameArea
    );
});

document.addEventListener("pointerleave", () => {
    cursor.style.opacity = "0";
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
    button.addEventListener("click", () => {
        shell.classList.remove("wide", "tall");
        if (mode) shell.classList.add(mode);
        document.querySelectorAll(".frame-actions button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
    });
});

document.getElementById("fitBtn").classList.add("active");

const modal = document.getElementById("paymentModal");
const modalTitle = document.getElementById("modalTitle");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutStatus = document.getElementById("checkoutStatus");
const checkoutPlanLabel = document.getElementById("checkoutPlanLabel");
const checkoutPriceLabel = document.getElementById("checkoutPriceLabel");
const checkoutButtonText = document.getElementById("checkoutButtonText");
let selectedPlan = "India Launch";

const planDetails = {
    "India Launch": {
        title: "India Launch checkout",
        plan: "India Launch",
        price: "Rs 99",
        button: "Checkout"
    },
    International: {
        title: "International checkout",
        plan: "International",
        price: "$1",
        button: "Checkout"
    }
};

function setCheckoutStatus(message, mode = "") {
    checkoutStatus.className = `checkout-note${mode ? ` ${mode}` : ""}`;
    checkoutStatus.textContent = message;
}

document.querySelectorAll("[data-open-payment]").forEach((button) => {
    button.addEventListener("click", () => {
        selectedPlan = button.dataset.openPayment;
        const details = planDetails[selectedPlan] || planDetails["India Launch"];
        modalTitle.textContent = details.title;
        checkoutPlanLabel.textContent = details.plan;
        checkoutPriceLabel.textContent = details.price;
        checkoutButtonText.textContent = details.button;
        setCheckoutStatus("Secure license delivery after payment confirmation.");
        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
    });
});

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
                email
            })
        });

        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.reason || orderData.error || orderData.message || "Could not create Razorpay order");
        if (!window.Razorpay) throw new Error("Razorpay checkout script is not loaded. Check internet connection.");

        const order = orderData.order;
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
                    email
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
                licenseType: order.licenseType || "standard"
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.reason || data.error || "Purchase failed");

        checkoutStatus.className = "checkout-note success";
        const emailLine = data.emailDelivery?.sent
            ? `Email sent to ${data.email}.`
            : `Email delivery failed. Save this key now and contact support if needed.`;
        checkoutStatus.innerHTML = `License generated: <strong>${data.licenseKey}</strong><br>${emailLine}<br>Download: ${data.downloadUrl}`;
        checkoutForm.reset();
    } catch (error) {
        setCheckoutStatus(error.message || "Could not generate license. Check backend server.", "error");
    } finally {
        submitButton.disabled = false;
        const details = planDetails[selectedPlan] || planDetails["India Launch"];
        checkoutButtonText.textContent = details.button;
    }
});
