/**
 * Converts any colour to rgba object.
 * @author JayB on Stack Overflow (modified by Eason Wong).
 * @param {string | Number[]} colour Colour to convert.
 * @returns Colour in rgba object. Pure black if invalid.
 */
export function rgba(colour) {
	if (typeof colour == "string") {
		if (
			colour == "DEFAULT" ||
			colour == "IMAGEVIEWER" ||
			colour == "PLAINTEXT" ||
			colour == "HOME" ||
			colour == "FALLBACK"
		)
			return colour;
		var canvas = document.createElement("canvas").getContext("2d");
		canvas.fillStyle = colour;
		let colour_temp = canvas.fillStyle;
		if (colour_temp.startsWith("#")) {
			let r = colour_temp[1] + colour_temp[2];
			let g = colour_temp[3] + colour_temp[4];
			let b = colour_temp[5] + colour_temp[6];
			return {
				r: parseInt(r, 16),
				g: parseInt(g, 16),
				b: parseInt(b, 16),
				a: 1,
			};
		} else {
			let result = colour_temp.match(/[.?\d]+/g).map(Number);
			return {
				r: result[0],
				g: result[1],
				b: result[2],
				a: result[3],
			};
		}
	} else if (typeof colour == "object") return { r: colour[0], g: colour[1], b: colour[2], a: colour[3] };
	else return null;
}

/**
 * Calculates the contrast ratio between two colours. Contrast ratio over 4.5 is considered adequate.
 * @author bensaine on GitHub (modified by Eason Wong).
 * @link https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 * @link https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * @param {Object} colour1 First colour.
 * @param {Object} colour2 Second colour.
 * @returns Contrast ratio, ranges from 1.05 (low contrast) to 21 (high contrast).
 */
export function contrastRatio(colour1, colour2) {
	let luminance1Times255 = 0.2126 * colour1.r + 0.7152 * colour1.g + 0.0722 * colour1.b;
	let luminance2Times255 = 0.2126 * colour2.r + 0.7152 * colour2.g + 0.0722 * colour2.b;
	return luminance1Times255 > luminance2Times255
		? (luminance1Times255 + 12.75) / (luminance2Times255 + 12.75)
		: (luminance2Times255 + 12.75) / (luminance1Times255 + 12.75);
}

/**
 * Dims or lightens colour.
 * @param {object} colour Colour to process, in rgb(a) object.
 * @param {number} dim between -1.0 (black) to 1.0 (white).
 * @returns Dimmed or lightened colour string e.g. "rgb(xxx)".
 */
export function dimColour(colour, dim) {
	if (dim > 0)
		return `rgb(${dim * 255 + (1 - dim) * colour.r}, ${dim * 255 + (1 - dim) * colour.g}, ${
			dim * 255 + (1 - dim) * colour.b
		})`;
	if (dim < 0) return `rgb(${(dim + 1) * colour.r}, ${(dim + 1) * colour.g}, ${(dim + 1) * colour.b})`;
	return `rgb(${colour.r}, ${colour.g}, ${colour.b})`;
}

/**
 * Overlays one colour over another.
 * @param {Object} colourTop Colour on top.
 * @param {Object} colourBottom Colour underneath.
 * @returns Result of the addition in object.
 */
export function overlayColour(colourTop, colourBottom) {
	let a = (1 - colourTop.a) * colourBottom.a + colourTop.a;
	// Firefox renders transparent background in rgb(236, 236, 236)
	if (a == 0) return rgba([236, 236, 236, 0]);
	else
		return {
			r: ((1 - colourTop.a) * colourBottom.a * colourBottom.r + colourTop.a * colourTop.r) / a,
			g: ((1 - colourTop.a) * colourBottom.a * colourBottom.g + colourTop.a * colourTop.g) / a,
			b: ((1 - colourTop.a) * colourBottom.a * colourBottom.b + colourTop.a * colourTop.b) / a,
			a: a,
		};
}

/**
 * Copies rgba objects.
 * @param {Object} target Target colour object.
 * @param {Object} source Source colour object.
 */
export function cc(target, source) {
	target.r = source.r;
	target.g = source.g;
	target.b = source.b;
	target.a = source.a;
}
