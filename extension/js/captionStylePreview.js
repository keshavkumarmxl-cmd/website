(function(window) {
    const filler = {
        a: true, an: true, the: true, is: true, are: true, am: true, i: true, you: true, he: true, she: true,
        it: true, we: true, they: true, to: true, of: true, for: true, in: true, on: true, at: true,
        and: true, or: true, but: true, with: true, about: true
    };
    const premium = {
        luxury: true, home: true, property: true, sale: true, rent: true, location: true, price: true,
        dream: true, apartment: true, villa: true, house: true, real: true, estate: true, offer: true,
        premium: true, beautiful: true, modern: true, clean: true, interior: true, exterior: true,
        kitchen: true, bedroom: true, balcony: true, view: true, investment: true, deal: true,
        space: true, elegant: true
    };

    function cleanWord(word) {
        return String(word || "").replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
    }

    function splitText(text) {
        const words = String(text || "Everybody talks about").split(/\s+/).filter(Boolean);
        if (words.length <= 1) return { upper: "", highlight: words[0] || "Luxury", lower: "" };
        if (words.length === 2) return { upper: words[0], highlight: words[1], lower: "" };
        let idx = -1;
        for (let i = 0; i < words.length; i++) {
            const key = cleanWord(words[i]).toLowerCase();
            if (premium[key] && !filler[key]) {
                idx = i;
                break;
            }
        }
        if (idx < 0) idx = Math.floor(words.length / 2);
        if (filler[cleanWord(words[idx]).toLowerCase()]) idx = Math.max(1, Math.min(words.length - 2, idx));
        return {
            upper: words.slice(0, idx).join(" "),
            highlight: words[idx] || "",
            lower: words.slice(idx + 1).join(" ")
        };
    }

    function px(value, fallback) {
        const n = parseInt(value, 10);
        return (isNaN(n) ? fallback : Math.max(8, Math.min(n, 96))) + "px";
    }

    function styleLine(el, part, scale) {
        if (!el || !part) return;
        const fontStack = part.fontCandidates && part.fontCandidates.length ? part.fontCandidates.join(", ") : (part.font || "Arial");
        el.style.display = part.enabled === false ? "none" : "block";
        el.style.color = part.textColor || "#FFFFFF";
        el.style.fontFamily = fontStack + ", Arial, sans-serif";
        el.style.fontSize = px((part.fontSize || 48) * (scale || 0.32), 18);
        el.style.fontWeight = /bold|black|extra|semibold/i.test(fontStack) ? "900" : "800";
        el.style.fontStyle = part.italic ? "italic" : "normal";
        el.style.webkitTextStroke = Math.max(0, Math.round((parseInt(part.strokeWidth, 10) || 0) * 0.25)) + "px " + (part.strokeColor || "#000000");
        el.style.textShadow = part.glow ? "0 0 12px " + (part.textColor || "#FFFFFF") : (part.shadow ? "0 3px 10px rgba(0,0,0,0.82)" : "none");
        el.style.letterSpacing = Math.max(-1.2, Math.min(1, (parseInt(part.tracking, 10) || 0) / 45)) + "px";
    }

    function update(style, sampleText) {
        const root = document.getElementById("captionStylePreview");
        if (!root) return;
        const split = splitText(sampleText);
        const upper = root.querySelector(".kwv-caption-preview-upper");
        const highlight = root.querySelector(".kwv-caption-preview-highlight");
        const lower = root.querySelector(".kwv-caption-preview-lower");
        if (upper) upper.textContent = split.upper || "";
        if (highlight) highlight.textContent = split.highlight || "";
        if (lower) lower.textContent = split.lower || "";
        root.classList.toggle("compact", style.layout === "compactCenter");
        root.classList.toggle("centerBig", style.layout === "centerBigWord" || style.layout === "topSmallBottomBig");
        root.classList.toggle("split", style.layout === "splitEmphasis");
        root.classList.toggle("overlap", style.layout === "overlapBridge");
        styleLine(upper, style.upper, 0.38);
        styleLine(highlight, style.highlight, 0.40);
        styleLine(lower, style.lower, 0.36);
    }

    window.KWVCaptionStylePreview = {
        update: update,
        splitText: splitText
    };
})(window);
