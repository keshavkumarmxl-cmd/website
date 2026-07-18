(function () {
    "use strict";

    window.__KWV_WEBSITE_PREVIEW__ = /^https?:/i.test(window.location.protocol);
    if (window.__kwvPreviewShimReady) return;
    window.__kwvPreviewShimReady = true;

    var extensionUrl = window.location.href.split("/").slice(0, -1).join("/");
    var hostEnvironment = {
        appName: "AEFT",
        appVersion: "Preview",
        appLocale: "en_US",
        appUILocale: "en_US",
        appId: "AEFT",
        isAppOnline: true,
        appSkinInfo: {
            panelBackgroundColor: { color: { red: 18, green: 18, blue: 18, alpha: 255 } },
            baseFontFamily: "Arial",
            baseFontSize: 12,
            appBarBackgroundColor: { color: { red: 18, green: 18, blue: 18, alpha: 255 } },
            systemHighlightColor: { color: { red: 255, green: 0, blue: 0, alpha: 255 } }
        }
    };

    window.__adobe_cep__ = window.__adobe_cep__ || {
        getHostEnvironment: function () { return JSON.stringify(hostEnvironment); },
        getSystemPath: function () { return extensionUrl; },
        evalScript: function (script, callback) {
            console.info("[KWV website preview] AE command skipped:", script);
            if (typeof callback === "function") {
                setTimeout(function () { callback("preview::After Effects is not connected on the website."); }, 10);
            }
        },
        getHostCapabilities: function () { return JSON.stringify({ EXTENDED_PANEL_MENU: true, EXTENDED_PANEL_ICONS: true }); },
        getCurrentApiVersion: function () { return JSON.stringify({ major: 11, minor: 0, micro: 0 }); },
        getExtensionId: function () { return "KESHAVWITHVELO.preview"; },
        getScaleFactor: function () { return 1; },
        getMonitorScaleFactor: function () { return 1; },
        addEventListener: function () {},
        removeEventListener: function () {},
        dispatchEvent: function () {},
        invokeSync: function () { return ""; },
        invokeAsync: function (name, data, callback) { if (typeof callback === "function") callback(""); },
        closeExtension: function () {},
        requestOpenExtension: function () {},
        resizeContent: function () {}
    };

    function emptyFsResult() {
        return { err: 1, data: [] };
    }

    window.cep = window.cep || {};
    window.cep.fs = window.cep.fs || {
        readdir: emptyFsResult,
        stat: function () { return { err: 1, data: { isFile: false, isDirectory: false } }; },
        readFile: function () { return { err: 1, data: "" }; },
        writeFile: function () { return { err: 0 }; },
        makedir: function () { return { err: 0 }; },
        deleteFile: function () { return { err: 0 }; },
        showOpenDialog: emptyFsResult
    };
    window.cep.util = window.cep.util || {
        openURLInDefaultBrowser: function (url) {
            window.open(url, "_blank", "noopener");
        }
    };

    function installPanelEcho() {
        if (document.getElementById("kwvWebsitePanelEchoStyle")) return;

        var style = document.createElement("style");
        style.id = "kwvWebsitePanelEchoStyle";
        style.textContent = [
            ".kwv-site-panel-cursor{position:fixed;left:0;top:0;width:28px;height:28px;border:1px solid rgba(255,0,0,.95);border-radius:50%;box-shadow:0 0 22px rgba(255,0,0,.55),inset 0 0 12px rgba(31,199,255,.18);pointer-events:none;transform:translate(-50%,-50%);z-index:2147483647;opacity:0}",
            ".kwv-site-panel-dot{position:fixed;width:8px;height:8px;border-radius:50%;background:#ff0000;box-shadow:0 0 20px rgba(255,0,0,.8);pointer-events:none;transform:translate(-50%,-50%);animation:kwvSitePanelEchoFade .7s ease forwards;z-index:2147483646}",
            "@keyframes kwvSitePanelEchoFade{to{opacity:0;transform:translate(-50%,-50%) scale(5)}}"
        ].join("");
        document.head.appendChild(style);

        var cursor = document.createElement("div");
        cursor.className = "kwv-site-panel-cursor";
        document.body.appendChild(cursor);

        var lastEcho = 0;
        document.addEventListener("pointermove", function (event) {
            cursor.style.opacity = "1";
            cursor.style.left = event.clientX + "px";
            cursor.style.top = event.clientY + "px";

            var now = performance.now();
            if (now - lastEcho > 42) {
                lastEcho = now;
                var dot = document.createElement("span");
                dot.className = "kwv-site-panel-dot";
                dot.style.left = event.clientX + "px";
                dot.style.top = event.clientY + "px";
                document.body.appendChild(dot);
                setTimeout(function () { dot.remove(); }, 720);
            }
        }, true);

        document.addEventListener("pointerleave", function () {
            cursor.style.opacity = "0";
        }, true);
    }

    function getActivePreviewEngine() {
        var active = document.querySelector("[data-ai-search-engine].active");
        return (active && active.getAttribute("data-ai-search-engine")) || "google";
    }

    function previewFrameHtml(engine) {
        var map = {
            google: {
                placeholder: "Search Google or type a URL",
                active: "google"
            },
            youtube: {
                placeholder: "Search YouTube videos",
                active: "youtube"
            },
            images: {
                placeholder: "Search images and PNG ideas",
                active: "images"
            },
            bgremover: {
                placeholder: "Drop image or choose file",
                active: "bgremover"
            }
        };
        var data = map[engine] || map.google;
        return "<!doctype html><html><head><meta charset='utf-8'><style>" +
            "html,body{margin:0;width:100%;height:100%;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;overflow:hidden;user-select:none}" +
            "body{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,rgba(255,0,0,.20) 0%,rgba(255,0,0,.08) 22%,transparent 48%),#000}" +
            ".wrap{width:min(86%,370px);min-height:300px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:translateY(-8px)}" +
            ".brand{margin:0 0 18px;font-size:19px;line-height:1;font-weight:950;letter-spacing:.5px;text-transform:uppercase;text-shadow:0 0 12px rgba(255,255,255,.18)}" +
            ".brand span{color:#ff1515;text-shadow:0 0 15px rgba(255,0,0,.72)}" +
            ".search{width:100%;height:46px;display:flex;align-items:center;gap:10px;padding:0 7px 0 15px;border:1px solid rgba(255,0,0,.38);border-radius:999px;background:rgba(7,7,7,.96);box-shadow:0 0 26px rgba(255,0,0,.13),inset 0 1px 0 rgba(255,255,255,.025)}" +
            ".search p{flex:1;margin:0;color:#8f96a3;font-size:11px;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.go{width:36px;height:36px;border:0;border-radius:50%;background:#ff1515;color:#fff;display:grid;place-items:center;font-size:18px;font-weight:900;box-shadow:0 0 18px rgba(255,0,0,.42)}" +
            ".shortcuts{display:grid;grid-template-columns:repeat(2,76px);gap:24px;margin-top:24px;justify-content:center}.shortcut{display:flex;flex-direction:column;align-items:center;gap:8px;color:#fff;text-transform:uppercase;font-size:8px;font-weight:950;letter-spacing:.75px}" +
            ".icon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;font-size:21px;font-weight:950;background:#101010;position:relative;overflow:hidden}.g{background:conic-gradient(from -35deg,#4285f4 0 25%,#34a853 0 48%,#fbbc05 0 70%,#ea4335 0 100%);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.yt{width:38px;height:27px;border-radius:8px;background:#ff1515;color:#fff;font-size:13px;padding-left:2px}.img{font-size:0;border:1px solid rgba(255,255,255,.16);background:linear-gradient(135deg,#4285f4,#34a853 42%,#fbbc05 67%,#ea4335)}.img:before{content:'';position:absolute;left:8px;right:8px;bottom:9px;height:10px;background:linear-gradient(135deg,transparent 0 38%,#fff 39% 61%,transparent 62%),linear-gradient(45deg,transparent 0 46%,rgba(255,255,255,.85) 47% 62%,transparent 63%);opacity:.95}.img:after{content:'';position:absolute;right:8px;top:8px;width:5px;height:5px;border-radius:50%;background:#fff}" +
            ".shortcut.active .icon{box-shadow:0 0 24px rgba(255,0,0,.38)}.preview-note{margin-top:20px;color:#6f7580;font-size:9px;font-weight:700;letter-spacing:.2px}" +
            "</style></head><body><div class='wrap'><h1 class='brand'>KESHAV <span>WITH VELO</span></h1><div class='search'><p>" + data.placeholder + "</p><div class='go'>&#8594;</div></div><div class='shortcuts'><div class='shortcut " + (data.active === "google" ? "active" : "") + "'><div class='icon g'>G</div><b>Google</b></div><div class='shortcut " + (data.active === "youtube" ? "active" : "") + "'><div class='icon yt'>&#9658;</div><b>YouTube</b></div></div><div class='preview-note'>Website preview mode</div></div></body></html>";
    }

    function renderSearchPreview(engine) {
        var frame = document.getElementById("aiSearchFrame");
        if (!frame) return;
        var nextEngine = engine || getActivePreviewEngine();
        var nextKey = "kwv-preview-" + nextEngine;
        if (frame.getAttribute("data-kwv-preview-key") === nextKey) return;
        frame.setAttribute("data-kwv-preview-key", nextKey);
        frame.removeAttribute("src");
        frame.srcdoc = previewFrameHtml(nextEngine);
        frame.style.display = "block";
        frame.style.opacity = "1";
        frame.style.visibility = "visible";
        var home = document.getElementById("aiSearchHome");
        if (home) home.classList.add("hidden");
    }

    function installSearchPreview() {
        document.addEventListener("click", function (event) {
            var target = event.target && event.target.closest && event.target.closest("[data-ai-search-engine]");
            if (!target) return;
            setTimeout(function () {
                renderSearchPreview(target.getAttribute("data-ai-search-engine") || "google");
            }, 80);
        }, true);

        var input = document.getElementById("aiBrowserInput");
        if (input) {
            input.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    setTimeout(function () { renderSearchPreview(getActivePreviewEngine()); }, 80);
                }
            }, true);
        }

        setTimeout(function () { renderSearchPreview("google"); }, 900);
        setInterval(function () {
            var frame = document.getElementById("aiSearchFrame");
            if (!frame) return;
            var src = frame.getAttribute("src") || "";
            if (src && src !== "about:srcdoc") {
                frame.removeAttribute("data-kwv-preview-key");
                renderSearchPreview(getActivePreviewEngine());
            }
        }, 1000);
    }

    function installCompactSelectPreview() {
        if (document.getElementById("kwvWebsiteSelectStyle")) return;

        var style = document.createElement("style");
        style.id = "kwvWebsiteSelectStyle";
        style.textContent = [
            ".kwv-preview-select-menu{position:fixed;z-index:2147483645;display:none;max-height:220px;overflow:auto;border:1px solid rgba(255,0,0,.75);border-radius:8px;background:#050505;box-shadow:0 18px 50px rgba(0,0,0,.68),0 0 22px rgba(255,0,0,.2);padding:4px;scrollbar-width:thin;scrollbar-color:#ff0000 #080808}",
            ".kwv-preview-select-menu.active{display:block}",
            ".kwv-preview-select-menu button{display:block;width:100%;min-height:24px;border:0;border-radius:5px;background:transparent;color:#f5f5f5;text-align:left;padding:0 9px;font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.3px;cursor:pointer}",
            ".kwv-preview-select-menu button:hover,.kwv-preview-select-menu button.active{background:#ff0000;color:#fff}"
        ].join("");
        document.head.appendChild(style);

        var menu = document.createElement("div");
        menu.className = "kwv-preview-select-menu";
        document.body.appendChild(menu);

        function closeMenu() {
            menu.classList.remove("active");
            menu.innerHTML = "";
            menu.__select = null;
        }

        function openMenu(select) {
            var rect = select.getBoundingClientRect();
            var width = Math.max(rect.width, 190);
            var maxLeft = Math.max(8, window.innerWidth - width - 8);
            var left = Math.min(Math.max(8, rect.left), maxLeft);
            var top = rect.bottom + 4;
            var maxHeight = Math.min(220, window.innerHeight - top - 8);
            if (maxHeight < 120) {
                maxHeight = Math.min(220, Math.max(120, rect.top - 8));
                top = Math.max(8, rect.top - maxHeight - 4);
            }

            menu.style.left = Math.round(left) + "px";
            menu.style.top = Math.round(top) + "px";
            menu.style.width = Math.round(width) + "px";
            menu.style.maxHeight = Math.round(maxHeight) + "px";
            menu.innerHTML = "";
            menu.__select = select;

            Array.prototype.forEach.call(select.options || [], function (option) {
                var item = document.createElement("button");
                item.type = "button";
                item.textContent = option.textContent || option.value;
                item.className = option.selected ? "active" : "";
                item.addEventListener("click", function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    select.value = option.value;
                    select.dispatchEvent(new Event("input", { bubbles: true }));
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    closeMenu();
                });
                menu.appendChild(item);
            });

            menu.classList.add("active");
        }

        document.addEventListener("mousedown", function (event) {
            var select = event.target && event.target.closest && event.target.closest("select");
            if (!select) {
                if (!event.target.closest || !event.target.closest(".kwv-preview-select-menu")) closeMenu();
                return;
            }
            if (select.options && select.options.length > 6) {
                event.preventDefault();
                event.stopPropagation();
                if (menu.classList.contains("active") && menu.__select === select) closeMenu();
                else openMenu(select);
            }
        }, true);

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") closeMenu();
        }, true);

        window.addEventListener("scroll", closeMenu, true);
        window.addEventListener("resize", closeMenu);
    }

    function cleanPreviewHomeShortcuts() {
        var homeShortcuts = document.querySelector(".ai-search-shortcuts");
        if (!homeShortcuts) return;

        var imageShortcut = homeShortcuts.querySelector('[data-ai-search-engine="images"]');
        if (imageShortcut) imageShortcut.remove();

        homeShortcuts.style.maxWidth = "190px";
        homeShortcuts.style.gridTemplateColumns = "repeat(2, minmax(0, 1fr))";
        homeShortcuts.style.gap = "18px";

        Array.prototype.forEach.call(homeShortcuts.querySelectorAll(".ai-search-shortcut"), function (button) {
            var label = button.querySelector("span:not(.ai-search-shortcut-mark)");
            if (label) label.remove();
        });
    }

    function installHomeShortcutCleanup() {
        cleanPreviewHomeShortcuts();
        document.addEventListener("click", function () {
            setTimeout(cleanPreviewHomeShortcuts, 40);
            setTimeout(cleanPreviewHomeShortcuts, 220);
            setTimeout(cleanPreviewHomeShortcuts, 700);
        }, true);

        try {
            new MutationObserver(cleanPreviewHomeShortcuts).observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        } catch (err) {}
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            installPanelEcho();
            installSearchPreview();
            installCompactSelectPreview();
            installHomeShortcutCleanup();
        });
    } else {
        installPanelEcho();
        installSearchPreview();
        installCompactSelectPreview();
        installHomeShortcutCleanup();
    }
})();
