(function (global) {
    "use strict";

    var PREVIEW_SRC = "Preview/preview.mp4";
    var REVEAL_DELAY_MS = 520;
    var FAILSAFE_MS = 10000;
    var AUTOPLAY_GRACE_MS = 2600;
    var started = false;
    var finished = false;
    var fallbackTimer = null;

    function injectStyles() {
        if (document.getElementById("kwvExtensionPreviewStyles")) return;
        var style = document.createElement("style");
        style.id = "kwvExtensionPreviewStyles";
        style.textContent = [
            "body.kwv-preview-holding .main-wrapper{opacity:0;pointer-events:none;user-select:none;}",
            ".kwv-extension-preview{position:fixed;inset:0;z-index:999998;display:flex;align-items:center;justify-content:center;background:#000;color:#fff;overflow:hidden;font-family:Arial,Helvetica,sans-serif;opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s ease;}",
            ".kwv-extension-preview.is-active{opacity:1;visibility:visible;}",
            ".kwv-extension-preview.is-revealing{animation:kwvPreviewReveal " + REVEAL_DELAY_MS + "ms ease-out forwards;will-change:opacity;}",
            ".kwv-extension-preview-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;opacity:0;transform:translateZ(0);transition:opacity .18s ease;}",
            ".kwv-extension-preview.video-ready .kwv-extension-preview-video{opacity:1;}",
            ".kwv-extension-preview.is-revealing .kwv-extension-preview-video{opacity:0;transition:opacity .24s ease-out;}",
            ".kwv-extension-preview-shade{position:absolute;inset:0;background:transparent;pointer-events:none;}",
            ".kwv-extension-preview-start{position:relative;z-index:2;display:none;height:36px;border:1px solid rgba(255,255,255,.32);border-radius:7px;background:rgba(0,0,0,.82);color:#fff;padding:0 14px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.7px;cursor:pointer;box-shadow:0 12px 34px rgba(0,0,0,.42);}",
            ".kwv-extension-preview.needs-start .kwv-extension-preview-start{display:inline-flex;align-items:center;}",
            "body.kwv-preview-ready .main-wrapper{animation:kwvMainPreviewIn .22s ease-out both;will-change:opacity;}",
            "@keyframes kwvPreviewReveal{0%{opacity:1;}100%{opacity:0;visibility:hidden;}}",
            "@keyframes kwvMainPreviewIn{0%{opacity:0;}100%{opacity:1;}}"
        ].join("");
        document.head.appendChild(style);
    }

    function createOverlay() {
        var overlay = document.getElementById("kwvExtensionPreview");
        if (overlay) return overlay;
        overlay = document.createElement("div");
        overlay.id = "kwvExtensionPreview";
        overlay.className = "kwv-extension-preview";
        overlay.setAttribute("aria-hidden", "true");
        overlay.innerHTML = [
            '<video class="kwv-extension-preview-video" id="kwvExtensionPreviewVideo" preload="auto" playsinline disablepictureinpicture>',
            '<source src="' + PREVIEW_SRC + '" type="video/mp4">',
            '</video>',
            '<div class="kwv-extension-preview-shade"></div>',
            '<button class="kwv-extension-preview-start" id="kwvExtensionPreviewStart" type="button">Start Preview</button>'
        ].join("");
        document.body.appendChild(overlay);
        return overlay;
    }

    function setFailsafe(ms) {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(revealMain, Math.max(8000, Number(ms || FAILSAFE_MS)));
    }

    function cancelPreview() {
        var overlay = document.getElementById("kwvExtensionPreview");
        var video = document.getElementById("kwvExtensionPreviewVideo");
        if (video) {
            try { video.pause(); } catch (pauseErr) {}
            try { video.removeAttribute("src"); video.load(); } catch (loadErr) {}
        }
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
        }
        started = false;
        finished = false;
    }

    function revealMain() {
        if (finished) return;
        finished = true;
        if (fallbackTimer) {
            clearTimeout(fallbackTimer);
            fallbackTimer = null;
        }
        var overlay = document.getElementById("kwvExtensionPreview");
        var video = document.getElementById("kwvExtensionPreviewVideo");
        if (video) {
            try { video.pause(); } catch (pauseErr) {}
        }
        document.body.classList.remove("kwv-preview-holding");
        document.body.classList.add("kwv-preview-ready");
        if (overlay) {
            try { overlay.offsetHeight; } catch (layoutErr) {}
            global.requestAnimationFrame(function () {
                overlay.classList.add("is-revealing");
            });
        }
        setTimeout(function () {
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, REVEAL_DELAY_MS);
    }

    function startPreview() {
        if (started || finished) return;
        started = true;
        injectStyles();
        var overlay = createOverlay();
        var video = document.getElementById("kwvExtensionPreviewVideo");
        var startButton = document.getElementById("kwvExtensionPreviewStart");
        overlay.classList.add("is-active");
        overlay.setAttribute("aria-hidden", "false");

        setFailsafe(FAILSAFE_MS);

        function playWithAudio() {
            if (!video) {
                revealMain();
                return;
            }
            overlay.classList.remove("needs-start");
            video.muted = false;
            video.volume = 1;
            try { video.currentTime = 0; } catch (seekErr) {}
            var playResult = video.play();
            if (playResult && playResult.catch) {
                playResult.catch(function () {
                    overlay.classList.add("needs-start");
                    setTimeout(function () {
                        if (!finished && overlay.classList.contains("needs-start")) revealMain();
                    }, AUTOPLAY_GRACE_MS);
                });
            }
        }

        if (video) {
            function markVideoReady() {
                if (!finished) overlay.classList.add("video-ready");
            }
            video.addEventListener("loadedmetadata", function () {
                var duration = Number(video.duration || 0);
                if (isFinite(duration) && duration > 0) setFailsafe(Math.min((duration * 1000) + 3500, FAILSAFE_MS));
            }, { once: true });
            video.addEventListener("canplay", markVideoReady, { once: true });
            video.addEventListener("playing", markVideoReady, { once: true });
            video.addEventListener("ended", revealMain, { once: true });
            video.addEventListener("error", revealMain, { once: true });
            video.addEventListener("stalled", function () {
                setTimeout(function () {
                    if (!finished && video.readyState < 2) revealMain();
                }, 4500);
            });
        }
        if (startButton) {
            startButton.addEventListener("click", function () {
                started = true;
                playWithAudio();
            });
        }
        playWithAudio();
    }

    function handleLicenseState(state) {
        state = state || {};
        if (!state.active) {
            document.body.classList.remove("kwv-preview-holding");
            cancelPreview();
            return;
        }
        document.body.classList.add("kwv-preview-holding");
        setTimeout(startPreview, 80);
    }

    function init() {
        injectStyles();
        global.addEventListener("kwv-license-state", function (evt) {
            handleLicenseState(evt.detail || {});
        });
        if (global.KWVLicenseManager && global.KWVLicenseManager.state) {
            setTimeout(function () {
                handleLicenseState(global.KWVLicenseManager.state);
            }, 120);
        }
        setTimeout(function () {
            if (!started && !finished && document.body.classList.contains("kwv-preview-holding")) {
                revealMain();
            }
        }, FAILSAFE_MS);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})(window);
