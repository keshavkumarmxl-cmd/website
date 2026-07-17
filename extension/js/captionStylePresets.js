(function(window) {
    const fonts = {
        appleUi: ["SegoeUI", "Segoe UI", "HelveticaNeue", "Helvetica Neue", "Arial"],
        appleMedium: ["SegoeUI-Semibold", "Segoe UI Semibold", "SegoeUI-Bold", "Segoe UI Bold", "HelveticaNeue-Medium", "Helvetica Neue Medium", "Arial-BoldMT", "Arial Bold", "Arial"],
        appleHeavy: ["SegoeUI-Bold", "Segoe UI Bold", "Arial-BoldMT", "Arial Bold", "HelveticaNeue-Bold", "Helvetica Neue Bold", "Arial"],
        seagram: ["Seagram tfb", "Seagram TFB", "Seagram", "Seagram/TrueType", "[Seagram/TrueType]", "Georgia-Bold", "Georgia Bold", "Georgia"],
        meaCulpa: ["Mea Culpa", "MeaCulpa-Regular", "MeaCulpa", "Georgia-Italic", "Georgia"]
    };

    function part(fontCandidates, size, color, shadow, animation, y, tracking) {
        return {
            enabled: true,
            font: fontCandidates && fontCandidates[0] ? fontCandidates[0] : "Arial-BoldMT",
            fontCandidates: fontCandidates || fonts.appleMedium,
            fontSize: size,
            textColor: color,
            strokeColor: "#000000",
            strokeWidth: 0,
            glow: false,
            shadow: !!shadow,
            animation: animation || "fade",
            y: y || 0,
            tracking: tracking || 0
        };
    }

    const presets = {
        luxuryGold: {
            mode: "realEstate",
            layout: "cleanRealEstate",
            animation: "fade",
            upper: part(fonts.appleUi, 36, "#FFFFFF", true, "fade", -54, -6),
            highlight: part(fonts.appleHeavy, 66, "#D9B45A", true, "pop", 0, -12),
            lower: part(fonts.appleMedium, 58, "#FFFFFF", true, "slide", 54, -10)
        },
        cleanWhite: {
            mode: "realEstate",
            layout: "editorialOffset",
            animation: "fade",
            upper: part(fonts.seagram, 92, "#FFFFFF", true, "fade", -48, -4),
            highlight: part(fonts.meaCulpa, 118, "#FFFFFF", true, "fade", 0, 0),
            lower: part(fonts.appleHeavy, 104, "#FFFFFF", true, "fade", 48, -12)
        }
    };

    window.KWVCaptionStylePresets = {
        presets: presets,
        clone: function(id) {
            return JSON.parse(JSON.stringify(presets[id] || presets.luxuryGold));
        }
    };
})(window);
