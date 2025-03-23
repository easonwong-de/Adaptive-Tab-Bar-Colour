"use strict";

/**
 * Converts any colour to an RGBA object.
 *
 * @param {string | number[]} colour Colour to convert or a colour code.
 * @returns Returns the colour in RGBA object.
 * @returns Returns pure black if the input is invalid.
 * @returns Returns the same colour code if the input is a colour code.
 * @returns Returns transparent by default.
 */
export function rgba(colour) {
	if (typeof colour === "string") {
		if (["DEFAULT", "IMAGEVIEWER", "PLAINTEXT", "HOME", "FALLBACK"].includes(colour)) return colour;
		const canvas = document.createElement("canvas").getContext("2d");
		canvas.fillStyle = colour;
		const canvasFillStyle = canvas.fillStyle;
		if (canvasFillStyle.startsWith("#")) {
			const r = canvasFillStyle[1] + canvasFillStyle[2];
			const g = canvasFillStyle[3] + canvasFillStyle[4];
			const b = canvasFillStyle[5] + canvasFillStyle[6];
			return {
				r: parseInt(r, 16),
				g: parseInt(g, 16),
				b: parseInt(b, 16),
				a: 1,
			};
		} else {
			const result = canvasFillStyle.match(/[.?\d]+/g).map(Number);
			return {
				r: result[0],
				g: result[1],
				b: result[2],
				a: result[3],
			};
		}
	} else if (Array.isArray(colour)) {
		return { r: colour[0], g: colour[1], b: colour[2], a: colour[3] };
	} else {
		return { r: 0, g: 0, b: 0, a: 0 };
	}
}

/**
 * Converts any colour to a hex string. Returns `#000000` if failed.
 */
export function hex(colour) {
	const canvas = document.createElement("canvas").getContext("2d");
	canvas.fillStyle = colour;
	const canvasFillStyle = canvas.fillStyle;
	if (canvasFillStyle.startsWith("#")) {
		return `${canvasFillStyle}`;
	} else {
		const RGBAColour = rgba(colour);
		if (typeof RGBAColour !== "object") return "#000000";
		return `#${((1 << 24) | (RGBAColour.r << 16) | (RGBAColour.g << 8) | RGBAColour.b).toString(16).slice(1)}`;
	}
}

/**
 * Calculates the contrast ratio between two colours. Contrast ratio over 4.5 is considered adequate.
 *
 * @author bensaine on GitHub (modified by Eason Wong).
 * @link https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param {object} colour1 First colour.
 * @param {object} colour2 Second colour.
 * @returns Contrast ratio, ranges from 1.05 (low contrast) to 21 (high contrast).
 */
export function contrastRatio(colour1, colour2) {
	const luminance1_x255 = relativeLuminanceX255(colour1);
	const luminance2_x255 = relativeLuminanceX255(colour2);
	return luminance1_x255 > luminance2_x255
		? (luminance1_x255 + 12.75) / (luminance2_x255 + 12.75)
		: (luminance2_x255 + 12.75) / (luminance1_x255 + 12.75);
}

/**
 * Calculates the relative luminace of a colour (times 255).
 *
 * @link https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * @param {object} colour The colour to calculate.
 * @returns Returns relative luminance of the colour (times 255).
 */
export function relativeLuminanceX255(colour) {
	return (
		0.2126 * linearChannelLuminance(colour.r) +
		0.7152 * linearChannelLuminance(colour.g) +
		0.0722 * linearChannelLuminance(colour.b)
	);
}

/**
 * @param {number} value The value of a sRGB channel.
 * @returns Returns the approximation of `255 * ((value + 0.055) / 1.055) ^ 2.4`
 */
function linearChannelLuminance(value) {
	if (value < 0) {
		return 0;
	} else if (value < 32) {
		return 0.1151 * value;
	} else if (value < 64) {
		return 0.2935 * value - 5.7074;
	} else if (value < 96) {
		return 0.5236 * value - 20.4339;
	} else if (value < 128) {
		return 0.788 * value - 45.8232;
	} else if (value < 160) {
		return 1.0811 * value - 83.3411;
	} else if (value < 192) {
		return 1.3992 * value - 134.2269;
	} else if (value < 224) {
		return 1.7395 * value - 199.5679;
	} else if (value < 256) {
		return 2.1001 * value - 280.341;
	} else {
		return 255;
	}
}

/**
 * Dims or lightens colour and converts it to an rgb string.
 *
 * @param {object} colour Colour to process, in RGBA object.
 * @param {number} dimX100 Between -100 (black) to 100 (white).
 * @returns Dimmed or lightened colour string e.g. "rgb(xxx)".
 */
export function dimColourString(colour, dimX100 = 0) {
	const newColour = dimColour(colour, dimX100);
	return `rgb(${newColour.r}, ${newColour.g}, ${newColour.b})`;
}

/**
 * Dims or lightens colour.
 *
 * @param {object} colour Colour to process, in RGBA object.
 * @param {number} dimX100 Between -100 (black) to 100 (white).
 * @returns Dimmed or lightened colour in RGBA object.
 * @todo Uses lumination curve.
 */
export function dimColour(colour, dimX100 = 0) {
	const dim = dimX100 / 100;
	if (dim > 1) {
		return { r: 255, g: 255, b: 255, a: 1 };
	} else if (dim > 0) {
		return {
			r: dim * 255 + (1 - dim) * colour.r,
			g: dim * 255 + (1 - dim) * colour.g,
			b: dim * 255 + (1 - dim) * colour.b,
			a: 1,
		};
	} else if (dim === 0) {
		return colour;
	} else if (dim < 0) {
		return { r: (dim + 1) * colour.r, g: (dim + 1) * colour.g, b: (dim + 1) * colour.b, a: 1 };
	} else if (dim < -1) {
		return { r: 0, g: 0, b: 0, a: 1 };
	}
}

/**
 * Overlays one colour over another.
 *
 * @param {Object} colourTop Colour on top.
 * @param {Object} colourBottom Colour underneath.
 * @returns Result of the addition in object.
 */
export function overlayColour(colourTop, colourBottom) {
	const a = (1 - colourTop.a) * colourBottom.a + colourTop.a;
	if (a === 0) {
		// Firefox renders transparent background in rgb(236, 236, 236)
		return rgba([236, 236, 236, 0]);
	} else {
		return {
			r: ((1 - colourTop.a) * colourBottom.a * colourBottom.r + colourTop.a * colourTop.r) / a,
			g: ((1 - colourTop.a) * colourBottom.a * colourBottom.g + colourTop.a * colourTop.g) / a,
			b: ((1 - colourTop.a) * colourBottom.a * colourBottom.b + colourTop.a * colourTop.b) / a,
			a: a,
		};
	}
}

/**
 * Adjusts frame colour and returns the optimal contrast scheme (light or dark) based on preferred scheme, colour contrast ratios, and minimum contrast thresholds.
 *
 * @param {object} colour RGBA object representing the frame's base colour.
 * @param {"light" | "dark"} preferredScheme The preferred colour scheme.
 * @param {boolean} allowDarkLight Determines if it's allowed to use dark theme in light scheme, and vice versa.
 * @param {number} minContrast_lightX10 Minimum contrast ratio required for light scheme eligibility.
 * @param {number} minContrast_darkX10 Minimum contrast ratio required for dark scheme eligibility.
 * @param {object} textColour_light Text colour for light scheme in an RGBA object, defaulting to black.
 * @param {object} textColour_dark Text colour for dark scheme in an RGBA object, defaulting to white.
 * @returns {{ colour: object, scheme: "light" | "dark", corrected: boolean }} The corrected colour and scheme and whether the colour was corrected.
 */
export function contrastCorrection(
	colour,
	preferredScheme,
	allowDarkLight,
	minContrast_lightX10,
	minContrast_darkX10,
	textColour_light = rgba([0, 0, 0, 1]),
	textColour_dark = rgba([255, 255, 255, 1])
) {
	const contrastRatio_dark = contrastRatio(colour, textColour_dark);
	const contrastRatio_light = contrastRatio(colour, textColour_light);
	const eligibility_dark = contrastRatio_dark > minContrast_darkX10 / 10;
	const eligibility_light = contrastRatio_light > minContrast_lightX10 / 10;
	if (eligibility_light && (preferredScheme === "light" || (preferredScheme === "dark" && allowDarkLight))) {
		return { colour: colour, scheme: "light", corrected: false };
	} else if (eligibility_dark && (preferredScheme === "dark" || (preferredScheme === "light" && allowDarkLight))) {
		return { colour: colour, scheme: "dark", corrected: false };
	} else if (preferredScheme === "light") {
		const dim =
			(100 *
				((minContrast_lightX10 / (10 * contrastRatio_light) - 1) * (relativeLuminanceX255(colour) + 12.75))) /
			(255 - relativeLuminanceX255(colour));
		return { colour: dimColour(colour, dim), scheme: "light", corrected: true };
	} else if (preferredScheme === "dark") {
		const dim = (100 * (10 * contrastRatio_dark)) / minContrast_darkX10 - 100;
		return { colour: dimColour(colour, dim), scheme: "dark", corrected: true };
	}
}
