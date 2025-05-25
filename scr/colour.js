"use strict";

import { colourCodes } from "./default_values";

export default class colour {
	#r = 0;
	#g = 0;
	#b = 0;
	#a = 0;
	#code;

	/**
	 * Creates a new colour instance from a colour code, CSS colour string, or RGBA array.
	 *
	 * @param {string | number[]} colour The initial colour value. Can be a colour code, a CSS colour string, or an array of RGBA values. Leave it empty to create a transparent colour instance.
	 */
	constructor(colour = undefined) {
		if (colourCodes.includes(colour)) {
			this.#code = colour;
		} else if (typeof colour === "string") {
			const ctx = document.createElement("canvas").getContext("2d");
			ctx.fillStyle = colour;
			const parsedColour = ctx.fillStyle;
			if (parsedColour.startsWith("#")) {
				this.rgba(
					parseInt(parsedColour.slice(1, 3), 16),
					parseInt(parsedColour.slice(3, 5), 16),
					parseInt(parsedColour.slice(5, 7), 16),
					1
				);
			} else {
				this.rgba(...parsedColour.match(/[.?\d]+/g).map(Number));
			}
		} else if (Array.isArray(colour)) {
			this.rgba(...colour);
		}
	}

	/**
	 * Assign RGBA values to the colour instance.
	 *
	 * @param {number} r R.
	 * @param {number} g G.
	 * @param {number} b B.
	 * @param {number} a A.
	 * @returns Returns the colour instance with the assigned RGBA values.
	 */
	rgba(r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		return this;
	}

	/**
	 * Returns a new colour instance with its brightness adjusted by the specified percentage.
	 *
	 * @param {number} percentage The dimming factor as a percentage.
	 *   - 0 returns the original colour.
	 *   - Positive values move the colour towards white (100 is white).
	 *   - Negative values move the colour towards black (-100 is black).
	 * @returns {colour} A new colour instance with adjusted brightness.
	 */
	dim(percentage) {
		const cent = percentage / 100;
		if (cent > 1) {
			return new colour().rgba(255, 255, 255, this.#a);
		} else if (cent > 0) {
			return new colour().rgba(
				cent * 255 + (1 - cent) * this.#r,
				cent * 255 + (1 - cent) * this.#g,
				cent * 255 + (1 - cent) * this.#b,
				this.#a
			);
		} else if (cent === 0) {
			return new colour().rgba(this.#r, this.#g, this.#b, this.#a);
		} else if (cent < 0) {
			return new colour().rgba((cent + 1) * this.#r, (cent + 1) * this.#g, (cent + 1) * this.#b, this.#a);
		} else if (cent < -1) {
			return new colour().rgba(0, 0, 0, this.#a);
		}
	}

	/**
	 * Calculates the relative luminace of a colour (times 255).
	 *
	 * @link https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
	 * @returns Returns the relative luminance of the colour (times 255).
	 */
	relativeLuminanceX255() {
		return (
			0.2126 * this.#linearChannelLuminance(this.#r) +
			0.7152 * this.#linearChannelLuminance(this.#g) +
			0.0722 * this.#linearChannelLuminance(this.#b)
		);
	}

	/**
	 * @param {number} value The value of a sRGB channel.
	 * @returns Returns the linear approximation of `255 * ((value + 0.055) / 1.055) ^ 2.4`
	 */
	#linearChannelLuminance(value) {
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
	 * Calculates the contrast ratio between this colour and another colour.
	 *
	 * Contrast ratio over 4.5 is considered adequate.
	 *
	 * @link https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
	 * @param {colour} colour First colour.
	 * @returns Returns the contrast ratio between the two colours. It ranges from 1.05 (low contrast) to 21 (high contrast).
	 */
	contrastRatio(colour) {
		const luminance1X255 = this.relativeLuminanceX255();
		const luminance2X255 = colour.relativeLuminanceX255();
		return luminance1X255 > luminance2X255
			? (luminance1X255 + 12.75) / (luminance2X255 + 12.75)
			: (luminance2X255 + 12.75) / (luminance1X255 + 12.75);
	}

	/**
	 * Creates a colour instance that meets the minimum contrast ratio against a specified colour.
	 *
	 * @param {"light" | "dark"} preferredScheme The preferred colour scheme.
	 * @param {boolean} allowDarkLight Whether to allow a result in the opposite of the preferred colour scheme.
	 * @param {number} minContrast_lightX10 The minimum contrast ratio required for light scheme eligibility (times 10).
	 * @param {number} minContrast_darkX10 The minimum contrast ratio required for dark scheme eligibility (times 10).
	 * @param {colour} contrastColour_light The colour to correct against in light mode, defaulting to black.
	 * @param {colour} contrastColour_dark The colour to correct against in dark mode, defaulting to white.
	 * @returns {{ colour: colour, scheme: "light" | "dark", corrected: boolean }} The corrected colour, the scheme, and whether the colour was adjusted.
	 */
	contrastCorrection(
		preferredScheme,
		allowDarkLight,
		minContrast_lightX10,
		minContrast_darkX10,
		contrastColour_light = new colour().rgba(0, 0, 0, 1),
		contrastColour_dark = new colour().rgba(255, 255, 255, 1)
	) {
		const contrastRatio_dark = this.contrastRatio(contrastColour_dark);
		const contrastRatio_light = this.contrastRatio(contrastColour_light);
		const eligibility_dark = contrastRatio_dark > minContrast_darkX10 / 10;
		const eligibility_light = contrastRatio_light > minContrast_lightX10 / 10;
		if (eligibility_light && (preferredScheme === "light" || (preferredScheme === "dark" && allowDarkLight))) {
			return { colour: this, scheme: "light", corrected: false };
		} else if (
			eligibility_dark &&
			(preferredScheme === "dark" || (preferredScheme === "light" && allowDarkLight))
		) {
			return { colour: this, scheme: "dark", corrected: false };
		} else if (preferredScheme === "light") {
			const dim =
				(100 *
					((minContrast_lightX10 / (10 * contrastRatio_light) - 1) *
						(this.relativeLuminanceX255() + 12.75))) /
				(255 - this.relativeLuminanceX255());
			return { colour: this.dim(dim), scheme: "light", corrected: true };
		} else if (preferredScheme === "dark") {
			const dim = (100 * (10 * contrastRatio_dark)) / minContrast_darkX10 - 100;
			return { colour: this.dim(dim), scheme: "dark", corrected: true };
		}
	}

	/**
	 * @returns {string}
	 */
	toString() {
		if (this.#code) return this.#code;
		else return `rgba(${this.#r}, ${this.#g}, ${this.#b}, ${this.#a})`;
	}

	/**
	 * @returns {string}
	 */
	toRGB() {
		return `rgb(${this.#r}, ${this.#g}, ${this.#b})`;
	}

	/**
	 * @returns {string}
	 */
	toHex() {
		const hexR = Math.round(this.#r).toString(16).padStart(2, "0");
		const hexG = Math.round(this.#g).toString(16).padStart(2, "0");
		const hexB = Math.round(this.#b).toString(16).padStart(2, "0");
		return `#${hexR}${hexG}${hexB}`;
	}

	get r() {
		return this.#r;
	}
	set r(value) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for r");
		this.#r = Math.max(0, Math.min(255, num));
	}

	get g() {
		return this.#g;
	}
	set g(value) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for g");
		this.#g = Math.max(0, Math.min(255, num));
	}

	get b() {
		return this.#b;
	}
	set b(value) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for b");
		this.#b = Math.max(0, Math.min(255, num));
	}

	get a() {
		return this.#a;
	}
	set a(value) {
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for a");
		this.#a = Math.max(0, Math.min(1, num));
	}

	get code() {
		return this.#code;
	}
	set code(value) {
		if (colourCodes.includes(value)) this.#code = value;
		else throw new Error("Invalid colour code");
	}
}
