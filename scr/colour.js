"use strict";

/**
 * Converts any colour to a rgba object.
 *
 * @author JayB on Stack Overflow (modified by easonwong-de).
 * @param {string | Number[]} colour Colour to convert or a colour code.
 * @returns Returns the colour in rgba object.
 * @returns Returns pure black if the input is invalid.
 * @returns Returns the same colour code if the input is a colour code.
 */
export function rgba(colour) {
	if (typeof colour === "string") {
		if (
			colour === "DEFAULT" ||
			colour === "IMAGEVIEWER" ||
			colour === "PLAINTEXT" ||
			colour === "HOME" ||
			colour === "FALLBACK"
		)
			return colour;
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
	} else if (typeof colour === "object") {
		return { r: colour[0], g: colour[1], b: colour[2], a: colour[3] };
	} else {
		return null;
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
		return canvasFillStyle + "";
	} else {
		const colourRGBA = rgba(colour);
		if (typeof colourRGBA !== "object") return "#000000";
		return "#" + ((1 << 24) | (colourRGBA.r << 16) | (colourRGBA.g << 8) | colourRGBA.b).toString(16).slice(1);
	}
}

/**
 * Calculates the contrast ratio between two colours. Contrast ratio over 4.5 is considered adequate.
 * @author bensaine on GitHub (modified by Eason Wong).
 * @link https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param {object} colour1 First colour.
 * @param {object} colour2 Second colour.
 * @returns Contrast ratio, ranges from 1.05 (low contrast) to 21 (high contrast).
 */
export function contrastRatio(colour1, colour2) {
	const luminance1_x255 = relativeLuminance_x255(colour1);
	const luminance2_x255 = relativeLuminance_x255(colour2);
	return luminance1_x255 > luminance2_x255
		? (luminance1_x255 + 12.75) / (luminance2_x255 + 12.75)
		: (luminance2_x255 + 12.75) / (luminance1_x255 + 12.75);
}

/**
 * Calculates the relative luminace of a colour (times 255).
 *
 * @link https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * @param {object} colour The colour to calculate.
 * @returns Returns relative luminance of the colour (0 - 255).
 */
export function relativeLuminance_x255(colour) {
	return (
		0.2126 * luminanceApproximation(colour.r) +
		0.7152 * luminanceApproximation(colour.g) +
		0.0722 * luminanceApproximation(colour.b)
	);
}

function luminanceApproximation(channel) {
	if (channel < 64) {
		return 0.2036 * channel;
	} else if (channel < 128) {
		return 0.6524 * channel + 64;
	} else if (channel < 192) {
		return 1.234 * channel + 128;
	} else {
		return 1.91 * channel + 192;
	}
}

/**
 * Dims or lightens colour.
 *
 * @param {object} colour Colour to process, in rgb(a) object.
 * @param {number} dimX100 Between -100 (black) to 100 (white).
 * @returns Dimmed or lightened colour string e.g. "rgb(xxx)".
 */
export function dimColour(colour, dimX100) {
	const dim = dimX100 / 100;
	if (dim > 1) {
		return "rgb(255, 255, 255)";
	} else if (dim > 0) {
		return `rgb(${dim * 255 + (1 - dim) * colour.r}, ${dim * 255 + (1 - dim) * colour.g}, ${
			dim * 255 + (1 - dim) * colour.b
		})`;
	} else if (dim === 0) {
		return `rgb(${colour.r}, ${colour.g}, ${colour.b})`;
	} else if (dim < 0) {
		return `rgb(${(dim + 1) * colour.r}, ${(dim + 1) * colour.g}, ${(dim + 1) * colour.b})`;
	} else if (dim < -1) {
		return "rgb(0, 0, 0)";
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
 * @param {object} frameColour RGBA object representing the frame's base colour.
 * @param {"light" | "dark"} preferredScheme The preferred colour scheme.
 * @param {boolean} allowDarkLight Determines if it's allowed to use dark theme in light scheme, and vice versa.
 * @param {number} minContrast_light Minimum contrast ratio required for light scheme eligibility.
 * @param {number} minContrast_dark Minimum contrast ratio required for dark scheme eligibility.
 * @param {object} textColour_light Text colour for light scheme in an rgba object, defaulting to black.
 * @param {object} textColour_dark Text colour for dark scheme in an rgba object, defaulting to white.
 * @returns {{ colour: object, scheme: "light" | "dark" }} Object with the corrected frame colour and scheme.
 */
export function contrastCorrection(
	frameColour,
	preferredScheme,
	allowDarkLight,
	minContrast_light,
	minContrast_dark,
	textColour_light = rgba([0, 0, 0, 1]),
	textColour_dark = rgba([255, 255, 255, 1])
) {
	const contrastRatio_dark = contrastRatio(frameColour, textColour_dark);
	const contrastRatio_light = contrastRatio(frameColour, textColour_light);
	const eligibility_dark = contrastRatio_dark > minContrast_dark / 10;
	const eligibility_light = contrastRatio_light > minContrast_light / 10;
	if (eligibility_light && (preferredScheme === "light" || (preferredScheme === "dark" && allowDarkLight))) {
		return { colour: frameColour, scheme: "light" };
	} else if (eligibility_dark && (preferredScheme === "dark" || (preferredScheme === "light" && allowDarkLight))) {
		return { colour: frameColour, scheme: "dark" };
	} else if (preferredScheme === "light") {
		const dim =
			((minContrast_light / (10 * contrastRatio_light) - 1) * (relativeLuminance_x255(frameColour) + 12.75)) /
			(255 - relativeLuminance_x255(frameColour));
		return { colour: rgba(dimColour(frameColour, dim)), scheme: "light" };
	} else if (preferredScheme === "dark") {
		const dim = (10 * contrastRatio_dark) / minContrast_dark - 1;
		return { colour: rgba(dimColour(frameColour, dim)), scheme: "dark" };
	}
}
