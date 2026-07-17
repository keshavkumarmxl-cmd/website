(function(window) {
    function el(id) {
        return document.getElementById(id);
    }

    function value(id, fallback) {
        const node = el(id);
        return node ? String(node.getAttribute("data-color") || node.value || fallback || "") : String(fallback || "");
    }

    function setValue(id, next) {
        const node = el(id);
        if (!node || !next) return;
        node.setAttribute("data-color", next);
        node.style.setProperty("--caption-chip-color", next);
    }

    function isEnabled() {
        const toggle = el("captionStyleEnabled");
        return !!(toggle && toggle.checked);
    }

    function setCollapsed() {
        const root = el("captionStyleEngine");
        const label = el("captionStyleToggleText");
        const enabled = isEnabled();
        if (root) root.classList.toggle("is-collapsed", !enabled);
        if (label) label.textContent = enabled ? "On" : "Off";
    }

    function applyPreset(id) {
        if (!window.KWVCaptionStylePresets) return;
        const preset = window.KWVCaptionStylePresets.clone(id || "luxuryGold");
        if (el("captionLayout")) el("captionLayout").value = preset.layout || "cleanRealEstate";
        if (el("captionAnimation")) el("captionAnimation").value = preset.animation || "fade";
        setValue("captionUpperColor", preset.upper && preset.upper.textColor ? preset.upper.textColor : "#FFFFFF");
        setValue("captionMiddleColor", preset.highlight && preset.highlight.textColor ? preset.highlight.textColor : "#D9B45A");
        setValue("captionBottomColor", preset.lower && preset.lower.textColor ? preset.lower.textColor : "#FFFFFF");
        updatePreview();
    }

    function collect() {
        if (!isEnabled()) return { mode: "normal" };
        const preset = window.KWVCaptionStylePresets ? window.KWVCaptionStylePresets.clone(value("captionPreset", "luxuryGold")) : {};
        const style = {
            mode: "realEstate",
            selectedMode: "realEstate",
            layout: value("captionLayout", "cleanRealEstate"),
            animation: value("captionAnimation", "fade"),
            applyTo: value("captionApplyTo", "all"),
            realEstateAuto: true,
            upper: preset.upper || { enabled: true, fontSize: 36, textColor: "#FFFFFF", strokeColor: "#000000", strokeWidth: 0, shadow: true, y: -54, tracking: -6 },
            highlight: preset.highlight || { enabled: true, fontSize: 66, textColor: "#D9B45A", strokeColor: "#000000", strokeWidth: 0, glow: false, autoPick: true, y: 0, tracking: -12 },
            lower: preset.lower || { enabled: true, fontSize: 58, textColor: "#FFFFFF", strokeColor: "#000000", strokeWidth: 0, shadow: true, y: 54, tracking: -10 }
        };
        style.upper.textColor = value("captionUpperColor", style.upper.textColor || "#FFFFFF");
        style.highlight.textColor = value("captionMiddleColor", style.highlight.textColor || "#D9B45A");
        style.lower.textColor = value("captionBottomColor", style.lower.textColor || "#FFFFFF");
        style.highlight.autoPick = true;
        style.upper.animation = style.animation;
        style.highlight.animation = style.animation;
        style.lower.animation = style.animation;
        return style;
    }

    function updatePreview(sampleText) {
        const style = collect();
        if (window.KWVCaptionStylePreview) {
            window.KWVCaptionStylePreview.update(style, sampleText || window.__kwvCaptionPreviewText || "Everybody talks about");
        }
    }

    let activeColorTarget = "";
    let pickerState = { h: 0, s: 0, v: 1 };

    function normalizeHex(input, fallback) {
        let hex = String(input || "").trim();
        if (!hex) return fallback || "#FFFFFF";
        if (hex.charAt(0) !== "#") hex = "#" + hex;
        if (/^#[0-9a-f]{3}$/i.test(hex)) {
            hex = "#" + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2) + hex.charAt(3) + hex.charAt(3);
        }
        return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : (fallback || "#FFFFFF");
    }

    function clamp(value, min, max) {
        value = parseFloat(value);
        if (isNaN(value)) value = min;
        return Math.max(min, Math.min(max, value));
    }

    function rgbToHex(r, g, b) {
        function part(n) {
            n = Math.round(clamp(n, 0, 255));
            return (n < 16 ? "0" : "") + n.toString(16);
        }
        return ("#" + part(r) + part(g) + part(b)).toUpperCase();
    }

    function hexToRgb(hex) {
        hex = normalizeHex(hex, "#FFFFFF").substring(1);
        return {
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
        };
    }

    function rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const d = max - min;
        let h = 0;
        if (d) {
            if (max === r) h = ((g - b) / d) % 6;
            else if (max === g) h = ((b - r) / d) + 2;
            else h = ((r - g) / d) + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        return { h: h, s: max ? d / max : 0, v: max };
    }

    function hsvToRgb(h, s, v) {
        h = ((h % 360) + 360) % 360;
        s = clamp(s, 0, 1);
        v = clamp(v, 0, 1);
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;
        if (h < 60) { r = c; g = x; }
        else if (h < 120) { r = x; g = c; }
        else if (h < 180) { g = c; b = x; }
        else if (h < 240) { g = x; b = c; }
        else if (h < 300) { r = x; b = c; }
        else { r = c; b = x; }
        return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
    }

    function setPickerOpen(open, targetId) {
        const picker = el("captionColorPicker");
        if (!picker) return;
        activeColorTarget = open ? (targetId || activeColorTarget || "captionUpperColor") : "";
        picker.classList.toggle("active", !!open);
        picker.setAttribute("aria-hidden", open ? "false" : "true");
        ["captionUpperColor", "captionMiddleColor", "captionBottomColor"].forEach(function(id) {
            const button = el(id);
            if (button) button.classList.toggle("active", open && id === activeColorTarget);
        });
        if (open) syncPicker();
    }

    function labelForTarget(id) {
        if (id === "captionMiddleColor") return "Middle Color";
        if (id === "captionBottomColor") return "Bottom Color";
        return "Upper Color";
    }

    function syncPicker() {
        const target = el(activeColorTarget);
        const current = normalizeHex(target ? target.getAttribute("data-color") : "#FFFFFF", "#FFFFFF");
        const rgb = hexToRgb(current);
        pickerState = rgbToHsv(rgb.r, rgb.g, rgb.b);
        const title = el("captionColorPickerTitle");
        if (title) title.textContent = labelForTarget(activeColorTarget);
        updatePickerUi(current);
    }

    function updatePickerUi(hex) {
        let rgb;
        if (hex) {
            rgb = hexToRgb(hex);
        } else {
            rgb = hsvToRgb(pickerState.h, pickerState.s, pickerState.v);
        }
        const picker = el("captionColorPicker");
        const cursor = el("captionColorPickerCursor");
        const hue = el("captionColorPickerHue");
        const hueThumb = el("captionColorPickerHueThumb");
        const preview = el("captionColorPickerPreview");
        const hexInput = el("captionColorPickerHex");
        const nextHex = rgbToHex(rgb.r, rgb.g, rgb.b);
        if (picker) {
            picker.style.setProperty("--caption-picker-hue", String(Math.round(pickerState.h)));
            picker.style.setProperty("--caption-picker-color", nextHex);
        }
        if (cursor) {
            cursor.style.left = (pickerState.s * 100) + "%";
            cursor.style.top = ((1 - pickerState.v) * 100) + "%";
        }
        if (hue) hue.style.setProperty("--caption-picker-hue", String(Math.round(pickerState.h)));
        if (hueThumb) hueThumb.style.top = (clamp(pickerState.h, 0, 360) / 360 * 100) + "%";
        if (preview) preview.style.setProperty("--caption-picker-color", nextHex);
        if (hexInput && hexInput.value.toUpperCase() !== nextHex) hexInput.value = nextHex;
        ["R", "G", "B"].forEach(function(channel) {
            const input = el("captionColorPicker" + channel);
            if (input) input.value = Math.round(rgb[channel.toLowerCase()]);
        });
    }

    function applyPickerColor(color, updateState) {
        if (!activeColorTarget) return;
        const current = value(activeColorTarget, "#FFFFFF");
        const next = normalizeHex(color, current);
        if (updateState !== false) {
            const rgb = hexToRgb(next);
            pickerState = rgbToHsv(rgb.r, rgb.g, rgb.b);
        }
        setValue(activeColorTarget, next);
        updatePickerUi(next);
        updatePreview();
    }

    function applyPickerState() {
        const rgb = hsvToRgb(pickerState.h, pickerState.s, pickerState.v);
        applyPickerColor(rgbToHex(rgb.r, rgb.g, rgb.b), false);
    }

    function setSvFromEvent(evt) {
        const box = el("captionColorPickerSv");
        if (!box) return;
        const rect = box.getBoundingClientRect();
        pickerState.s = clamp((evt.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
        pickerState.v = clamp(1 - ((evt.clientY - rect.top) / Math.max(1, rect.height)), 0, 1);
        applyPickerState();
    }

    function setHueFromEvent(evt) {
        const box = el("captionColorPickerHue");
        if (!box) return;
        const rect = box.getBoundingClientRect();
        pickerState.h = clamp(((evt.clientY - rect.top) / Math.max(1, rect.height)) * 360, 0, 360);
        applyPickerState();
    }

    function bind() {
        const root = el("captionStyleEngine");
        if (!root) return;
        root.addEventListener("input", function() { updatePreview(); });
        root.addEventListener("change", function(evt) {
            if (evt && evt.target && evt.target.id === "captionPreset") applyPreset(evt.target.value);
            else updatePreview();
        });
        ["captionUpperColor", "captionMiddleColor", "captionBottomColor"].forEach(function(id) {
            const button = el(id);
            if (!button) return;
            setValue(id, button.getAttribute("data-color") || "#FFFFFF");
            button.addEventListener("click", function(evt) {
                evt.preventDefault();
                setPickerOpen(activeColorTarget !== id || !(el("captionColorPicker") && el("captionColorPicker").classList.contains("active")), id);
            });
        });
        const closePicker = el("captionColorPickerClose");
        if (closePicker) closePicker.onclick = function() { setPickerOpen(false); };
        const hueInput = el("captionColorPickerHue");
        if (hueInput) {
            let draggingHue = false;
            hueInput.addEventListener("mousedown", function(evt) {
                draggingHue = true;
                setHueFromEvent(evt);
                evt.preventDefault();
            });
            document.addEventListener("mousemove", function(evt) {
                if (draggingHue) setHueFromEvent(evt);
            });
            document.addEventListener("mouseup", function() {
                draggingHue = false;
            });
        }
        const svBox = el("captionColorPickerSv");
        if (svBox) {
            let dragging = false;
            svBox.addEventListener("mousedown", function(evt) {
                dragging = true;
                setSvFromEvent(evt);
                evt.preventDefault();
            });
            document.addEventListener("mousemove", function(evt) {
                if (dragging) setSvFromEvent(evt);
            });
            document.addEventListener("mouseup", function() {
                dragging = false;
            });
        }
        ["R", "G", "B"].forEach(function(channel) {
            const input = el("captionColorPicker" + channel);
            if (!input) return;
            input.addEventListener("input", function() {
                const r = el("captionColorPickerR") ? clamp(el("captionColorPickerR").value, 0, 255) : 255;
                const g = el("captionColorPickerG") ? clamp(el("captionColorPickerG").value, 0, 255) : 255;
                const b = el("captionColorPickerB") ? clamp(el("captionColorPickerB").value, 0, 255) : 255;
                applyPickerColor(rgbToHex(r, g, b));
            });
        });
        const hexInput = el("captionColorPickerHex");
        if (hexInput) {
            hexInput.addEventListener("input", function() {
                const raw = String(hexInput.value || "").trim();
                const hex = raw.charAt(0) === "#" ? raw : ("#" + raw);
                if (/^#[0-9a-f]{6}$/i.test(hex)) applyPickerColor(hex);
            });
        }
        const toggle = el("captionStyleEnabled");
        if (toggle) {
            try {
                toggle.checked = window.localStorage.getItem("kwv.captionStyleEnabled") === "1";
            } catch (err) {}
            toggle.addEventListener("change", function() {
                try {
                    window.localStorage.setItem("kwv.captionStyleEnabled", toggle.checked ? "1" : "0");
                } catch (err) {}
                setCollapsed();
                updatePreview();
            });
        }
        setCollapsed();
        applyPreset(value("captionPreset", "luxuryGold"));
    }

    window.KWVCaptionStyleEngine = {
        init: bind,
        collect: collect,
        applyPreset: applyPreset,
        updatePreview: updatePreview
    };
})(window);
