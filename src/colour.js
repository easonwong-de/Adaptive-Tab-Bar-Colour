"use strict";

/**
 * All possible colour codes.
 *
 * Each of which represents a certain colour determined by the browser.
 */
const colourCodes = [
	"HOME",
	"FALLBACK",
	"PLAINTEXT",
	"SYSTEM",
	"ADDON",
	"PDFVIEWER",
	"IMAGEVIEWER",
	"JSONVIEWER",
	"DEFAULT",
];

/**
 * Represents a colour with RGBA channels or a predefined colour code.
 *
 * Provides methods for parsing, manipulating, and converting colours, as well
 * as calculating contrast and luminance for accessibility.
 *
 * @class
 */
export default class colour {
	#r = 0;
	#g = 0;
	#b = 0;
	#a = 0;
	#code = undefined;

	/**
	 * Parses the given initialiser to set the colour value.
	 *
	 * @param {string | object | colour} [initialiser=undefined] - A colour
	 *   code, a CSS colour string, or an instance of `colour`. Default is
	 *   `undefined`
	 * @param {boolean} [acceptCode=true] - Whether the instance is allowed to
	 *   contain a colour code. Default is `true`
	 */
	constructor(initialiser = undefined, acceptCode = true) {
		if (acceptCode && colourCodes.includes(initialiser)) {
			this.#code = initialiser;
		} else if (typeof initialiser === "string") {
			const canvas = document.createElement("canvas");
			canvas.width = 1;
			canvas.height = 1;
			const canvasContext = canvas.getContext("2d");
			canvasContext.fillStyle = initialiser;
			const parsedColour = canvasContext.fillStyle;
			canvas.remove();
			if (parsedColour.startsWith("#")) {
				this.rgba(
					parseInt(parsedColour.slice(1, 3), 16),
					parseInt(parsedColour.slice(3, 5), 16),
					parseInt(parsedColour.slice(5, 7), 16),
					1,
				);
			} else {
				this.rgba(...parsedColour.match(/[.?\d]+/g).map(Number));
			}
		} else if (initialiser instanceof colour) {
			if (initialiser.code) this.#code = initialiser.code;
			else
				this.rgba(
					initialiser.r,
					initialiser.g,
					initialiser.b,
					initialiser.a,
				);
		}
	}

	/**
	 * Assigns RGBA values to the colour instance.
	 *
	 * @param {number} r - Red channel value (0-255).
	 * @param {number} g - Green channel value (0-255).
	 * @param {number} b - Blue channel value (0-255).
	 * @param {number} a - Alpha channel value (0-1).
	 * @returns {colour} This colour instance for method chaining.
	 */
	rgba(r, g, b, a) {
		this.#code = undefined;
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
		return this;
	}

	/**
	 * Applies an opacity factor to the current colour.
	 *
	 * @param {number} opacity - The opacity factor to apply (0-1).
	 * @returns {colour} This colour instance for method chaining.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	opacity(opacity) {
		this.#noCode();
		this.#a *= Math.max(0, Math.min(1, opacity));
		return this;
	}

	/**
	 * Returns a new colour instance with its brightness adjusted by the
	 * specified percentage.
	 *
	 * @param {number} percentage - The brightness factor as a percentage.
	 *
	 *   - 0 returns the original colour.
	 *   - Positive values move the colour towards white (100 is white).
	 *   - Negative values move the colour towards black (-100 is black).
	 *   - Values beyond the range of -100 to 100 make the colour black or white.
	 *
	 * @returns {colour} A new colour instance with adjusted brightness.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	brightness(percentage) {
		this.#noCode();
		const cent = percentage / 100;
		if (1 < cent) {
			return new this.constructor().rgba(255, 255, 255, this.#a);
		} else if (0 < cent && cent <= 1) {
			return new this.constructor().rgba(
				cent * 255 + (1 - cent) * this.#r,
				cent * 255 + (1 - cent) * this.#g,
				cent * 255 + (1 - cent) * this.#b,
				this.#a,
			);
		} else if (cent === 0) {
			return this;
		} else if (-1 <= cent && cent < 0) {
			return new this.constructor().rgba(
				(cent + 1) * this.#r,
				(cent + 1) * this.#g,
				(cent + 1) * this.#b,
				this.#a,
			);
		} else if (cent < -1) {
			return new this.constructor().rgba(0, 0, 0, this.#a);
		}
	}

	/**
	 * Mixes this colour with another colour underneath.
	 *
	 * @param {colour} colour - The colour underneath to mix with.
	 * @returns {colour} A new colour instance as the result of the mix.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	mix(colour) {
		this.#noCode();
		const a = this.#a + colour.a * (1 - this.#a);
		return a === 0
			? new this.constructor()
			: new this.constructor().rgba(
					(this.#a * this.#r + colour.a * (1 - this.#a) * colour.r) /
						a,
					(this.#a * this.#g + colour.a * (1 - this.#a) * colour.g) /
						a,
					(this.#a * this.#b + colour.a * (1 - this.#a) * colour.b) /
						a,
					a,
				);
	}

	/**
	 * Creates a colour instance that meets the minimum contrast ratio against
	 * specified colours.
	 *
	 * @param {"light" | "dark"} preferredScheme - The preferred colour scheme.
	 * @param {boolean} allowDarkLight - Whether to allow a result in the
	 *   opposite of the preferred colour scheme.
	 * @param {number} minContrastLightX10 - The minimum contrast ratio required
	 *   for light scheme eligibility (times 10).
	 * @param {number} minContrastDarkX10 - The minimum contrast ratio required
	 *   for dark scheme eligibility (times 10).
	 * @param {colour} [contrastColourLight] - The colour to contrast against in
	 *   light mode. Defaults to black.
	 * @param {colour} [contrastColourDark] - The colour to contrast against in
	 *   dark mode. Defaults to white.
	 * @returns {{
	 * 	colour: colour;
	 * 	scheme: "light" | "dark";
	 * 	corrected: boolean;
	 * }}
	 *   Object containing the corrected colour, chosen scheme, and whether
	 *   correction was applied.
	 * @throws {Error} If the colour is defined by a colour code or if colour
	 *   correction cannot be processed.
	 */
	contrastCorrection(
		preferredScheme,
		allowDarkLight,
		minContrastLightX10,
		minContrastDarkX10,
		contrastColourLight = new this.constructor().rgba(0, 0, 0, 1),
		contrastColourDark = new this.constructor().rgba(255, 255, 255, 1),
	) {
		this.#noCode();
		const contrastRatioLight = this.#contrastRatio(contrastColourLight);
		const contrastRatioDark = this.#contrastRatio(contrastColourDark);
		const eligibilityLight = contrastRatioLight > minContrastLightX10 / 10;
		const eligibilityDark = contrastRatioDark > minContrastDarkX10 / 10;
		if (
			eligibilityLight &&
			(preferredScheme === "light" ||
				(preferredScheme === "dark" && allowDarkLight))
		) {
			return { colour: this, scheme: "light", corrected: false };
		} else if (
			eligibilityDark &&
			(preferredScheme === "dark" ||
				(preferredScheme === "light" && allowDarkLight))
		) {
			return { colour: this, scheme: "dark", corrected: false };
		} else if (preferredScheme === "light") {
			const dim =
				(100 *
					((minContrastLightX10 / (10 * contrastRatioLight) - 1) *
						(this.#luminanceX255() + 12.75))) /
				(255 - this.#luminanceX255());
			return {
				colour: this.brightness(dim),
				scheme: "light",
				corrected: true,
			};
		} else if (preferredScheme === "dark") {
			const dim =
				(100 * (10 * contrastRatioDark)) / minContrastDarkX10 - 100;
			return {
				colour: this.brightness(dim),
				scheme: "dark",
				corrected: true,
			};
		} else {
			throw new Error("Cannot process colour correction");
		}
	}

	/**
	 * Calculates the contrast ratio between this colour and another colour.
	 *
	 * Contrast ratio over 4.5 is considered adequate for accessibility.
	 *
	 * @private
	 * @param {colour} colour - The colour to compare against.
	 * @returns {number} The contrast ratio between the two colours (1.05 to
	 *   21).
	 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
	 */
	#contrastRatio(colour) {
		const luminance1X255 = this.#luminanceX255();
		const luminance2X255 = colour.#luminanceX255();
		return luminance1X255 > luminance2X255
			? (luminance1X255 + 12.75) / (luminance2X255 + 12.75)
			: (luminance2X255 + 12.75) / (luminance1X255 + 12.75);
	}

	/**
	 * Calculates the relative luminance of the colour (times 255).
	 *
	 * @private
	 * @returns {number} The relative luminance of the colour (0-255).
	 * @see https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
	 */
	#luminanceX255() {
		return (
			0.2126 * this.#channelLuminance(this.#r) +
			0.7152 * this.#channelLuminance(this.#g) +
			0.0722 * this.#channelLuminance(this.#b)
		);
	}

	/**
	 * Converts an sRGB channel value to channel luminance (times 255).
	 *
	 * @private
	 * @param {number} value - The sRGB channel value (0-255).
	 * @returns {number} The linear approximation of the channel's luminance
	 *   (times 255).
	 */
	#channelLuminance(value) {
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
	 * Returns the colour as a string representation.
	 *
	 * If the colour is defined by a code, returns the code. Otherwise, returns
	 * an RGBA CSS string.
	 *
	 * @returns {string} The colour code or the CSS RGBA representation.
	 */
	toString() {
		if (this.#code) return this.#code;
		else return this.toRGBA();
	}

	/**
	 * Returns the colour as an RGB CSS string.
	 *
	 * @returns {string} The RGB CSS string.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	toRGB() {
		this.#noCode();
		return `rgb(${this.#r}, ${this.#g}, ${this.#b})`;
	}

	/**
	 * Returns the colour as an RGBA CSS string.
	 *
	 * @returns {string} The RGBA CSS string.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	toRGBA() {
		this.#noCode();
		return `rgba(${this.#r}, ${this.#g}, ${this.#b}, ${this.#a})`;
	}

	/**
	 * Returns the colour as a hex string.
	 *
	 * @returns {string} The hex string.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	toHex() {
		this.#noCode();
		const hexR = Math.round(this.#r).toString(16).padStart(2, "0");
		const hexG = Math.round(this.#g).toString(16).padStart(2, "0");
		const hexB = Math.round(this.#b).toString(16).padStart(2, "0");
		return `#${hexR}${hexG}${hexB}`;
	}

	/**
	 * Returns the colour as a hex string with alpha.
	 *
	 * @returns {string} The hex string with alpha.
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	toHexa() {
		this.#noCode();
		const hexR = Math.round(this.#r).toString(16).padStart(2, "0");
		const hexG = Math.round(this.#g).toString(16).padStart(2, "0");
		const hexB = Math.round(this.#b).toString(16).padStart(2, "0");
		const hexA = Math.round(255 * this.#a)
			.toString(16)
			.padStart(2, "0");
		return `#${hexR}${hexG}${hexB}${hexA}`;
	}

	/**
	 * Checks if the colour is fully opaque.
	 *
	 * @returns {boolean} `true` if the colour is opaque (alpha = 1 or is a
	 *   colour code), `false` otherwise.
	 */
	isOpaque() {
		return this.#code || this.#a === 1;
	}

	/**
	 * Throws if the colour is defined by a colour code.
	 *
	 * @private
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	#noCode() {
		if (this.#code)
			throw new Error("The colour is defined by a colour code");
	}

	/**
	 * Gets the red channel value.
	 *
	 * @returns {number} The red channel value (0-255).
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	get r() {
		this.#noCode();
		return this.#r;
	}

	/**
	 * Sets the red channel value.
	 *
	 * @param {number} value - The red channel value to set.
	 * @throws {Error} If the colour is defined by a colour code or the value is
	 *   invalid.
	 */
	set r(value) {
		this.#noCode();
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for r");
		this.#r = Math.max(0, Math.min(255, num));
	}

	/**
	 * Gets the green channel value.
	 *
	 * @returns {number} The green channel value (0-255).
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	get g() {
		this.#noCode();
		return this.#g;
	}

	/**
	 * Sets the green channel value.
	 *
	 * @param {number} value - The green channel value to set.
	 * @throws {Error} If the colour is defined by a colour code or the value is
	 *   invalid.
	 */
	set g(value) {
		this.#noCode();
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for g");
		this.#g = Math.max(0, Math.min(255, num));
	}

	/**
	 * Gets the blue channel value.
	 *
	 * @returns {number} The blue channel value (0-255).
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	get b() {
		this.#noCode();
		return this.#b;
	}

	/**
	 * Sets the blue channel value.
	 *
	 * @param {number} value - The blue channel value to set.
	 * @throws {Error} If the colour is defined by a colour code or the value is
	 *   invalid.
	 */
	set b(value) {
		this.#noCode();
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for b");
		this.#b = Math.max(0, Math.min(255, num));
	}

	/**
	 * Gets the alpha channel value.
	 *
	 * @returns {number} The alpha channel value (0-1).
	 * @throws {Error} If the colour is defined by a colour code.
	 */
	get a() {
		this.#noCode();
		return this.#a;
	}

	/**
	 * Sets the alpha channel value.
	 *
	 * @param {number} value - The alpha channel value to set (0-1).
	 * @throws {Error} If the colour is defined by a colour code or the value is
	 *   invalid.
	 */
	set a(value) {
		this.#noCode();
		const num = Number(value);
		if (isNaN(num)) throw new Error("Invalid value for a");
		this.#a = Math.max(0, Math.min(1, num));
	}

	/**
	 * Gets the colour code.
	 *
	 * @returns {string | undefined} The colour code, or `undefined` if the
	 *   colour is defined by RGBA values.
	 */
	get code() {
		return this.#code;
	}

	/**
	 * Sets the colour code.
	 *
	 * @param {string} value - The colour code to set.
	 * @throws {Error} If the value is not a valid colour code.
	 */
	set code(value) {
		if (colourCodes.includes(value)) this.#code = value;
		else throw new Error("Invalid colour code");
	}
}
