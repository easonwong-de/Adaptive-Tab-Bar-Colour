// Sends color in RGBA object to background.js
// If A in RGBA is not 1, falls back to default color.

// Settings cache: updated on message
var pref_no_theme_color;
var pref_reservedColor_cs;

// Current color lookup table
var current_reservedColor_cs;

// Default color lookup table
const default_reservedColor_cs = Object.freeze({
	"apnews.com": "IGNORE_THEME",
	"developer.mozilla.org": "IGNORE_THEME",
	"github.com": "IGNORE_THEME",
	"mail.google.com": "QS_div.wl",
	"open.spotify.com": "#000000",
	"www.instagram.com": "IGNORE_THEME",
	"www.linkedin.com": "IGNORE_THEME",
	"www.spiegel.de": "IGNORE_THEME",
});

/**
 * Loads preferences into cache and check integrity
 */
function loadPref(pref) {
	setDynamicUpdate(pref.dynamic);
	pref_no_theme_color = pref.no_theme_color;
	pref_reservedColor_cs = pref.reservedColor_cs;
	current_reservedColor_cs = pref.custom ? pref_reservedColor_cs : default_reservedColor_cs;
	return pref_no_theme_color != null && pref_reservedColor_cs != null;
}

// Initializes response color
var RESPONSE_COLOR = rgba([0, 0, 0, 0]);

// This will be displayed in the pop-up
var RESPONSE_INFO = "";

// Send color to background as soon as page loads
browser.storage.local.get((pref) => {
	if (loadPref(pref)) findAndSendColor();
});

var debouncePrevRun = 0;
var debounceTimeoutID = null;

/**
 * Runs the given function with a maximum rate of 100ms.
 * @param {function} fn Fuction without debounce.
 * @returns Function with debounce.
 * @author cloone8 on GitHub.
 */
function addDebounce(fn) {
	const timeout = 100;
	return () => {
		const curTime = Date.now();
		if (debounceTimeoutID) {
			// Clear pending function
			clearTimeout(debounceTimeoutID);
			debounceTimeoutID = null;
		}
		if (curTime - timeout > debouncePrevRun) {
			// No timeout => call the function right away
			debouncePrevRun = curTime;
			fn();
		} else {
			// Blocked by timeout => delay the function call
			debounceTimeoutID = setTimeout(() => {
				debouncePrevRun = Date.now();
				debounceTimeoutID = null;
				fn();
			}, timeout - (curTime - debouncePrevRun));
		}
	};
}

/**
 * Sets up / Turns off dynamic update.
 * @param {boolean} dynamic Dynamic update.
 */
function setDynamicUpdate(dynamic) {
	const findAndSendColor_debounce = addDebounce(findAndSendColor);
	const findAndSendColor_fix_debounce = addDebounce(findAndSendColor_fix);
	if (dynamic) {
		document.addEventListener("animationend", findAndSendColor_fix_debounce);
		document.addEventListener("animationcancel", findAndSendColor_fix_debounce);
		document.addEventListener("pageshow", findAndSendColor);
		document.addEventListener("click", findAndSendColor_debounce);
		document.addEventListener("resize", findAndSendColor_debounce);
		document.addEventListener("scroll", findAndSendColor_debounce);
		document.addEventListener("transitionend", findAndSendColor_fix_debounce);
		document.addEventListener("transitioncancel", findAndSendColor_fix_debounce);
		document.addEventListener("visibilitychange", findAndSendColor_debounce);
	} else {
		document.removeEventListener("animationend", findAndSendColor_fix_debounce);
		document.removeEventListener("animationcancel", findAndSendColor_fix_debounce);
		document.removeEventListener("pageshow", findAndSendColor);
		document.removeEventListener("click", findAndSendColor_debounce);
		document.removeEventListener("resize", findAndSendColor_debounce);
		document.removeEventListener("scroll", findAndSendColor_debounce);
		document.removeEventListener("transitionend", findAndSendColor_fix_debounce);
		document.removeEventListener("transitioncancel", findAndSendColor_fix_debounce);
		document.removeEventListener("visibilitychange", findAndSendColor_debounce);
	}
}

// Detects theme-color changes
var onThemeColor = new MutationObserver(findAndSendColor);
if (document.querySelector("meta[name=theme-color]") != null)
	onThemeColor.observe(document.querySelector("meta[name=theme-color]"), {
		attributes: true,
	});

// Detects Dark Reader
var onDarkReader = new MutationObserver(findAndSendColor);
onDarkReader.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["data-darkreader-mode"],
});

// Detects style injections & theme-color being added
var onStyleInjection = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (
			(mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "STYLE") ||
			(mutation.removedNodes.length > 0 && mutation.removedNodes[0].nodeName == "STYLE")
		) {
			findAndSendColor();
		} else if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "META" && mutation.addedNodes[0].name == "theme-color") {
			onThemeColor.observe(document.querySelector("meta[name=theme-color]"), { attributes: true });
		}
	});
});
onStyleInjection.observe(document.documentElement, { childList: true });
onStyleInjection.observe(document.head, { childList: true });

// Fired by update() from background.js
// Loads newly applied settings
browser.runtime.onMessage.addListener((pref, sender, sendResponse) => {
	setDynamicUpdate(pref.dynamic);
	pref_no_theme_color = pref.no_theme_color;
	pref_reservedColor_cs = pref.reservedColor_cs;
	if (pref.reason == "INFO_REQUEST") {
		findColor();
		sendResponse(RESPONSE_INFO);
	} else if (pref.reason == "COLOR_REQUEST") {
		findAndSendColor();
		sendResponse(RESPONSE_COLOR);
	}
});

/**
 * Finds color.
 */
function findColor() {
	if (!document.fullscreenElement) {
		RESPONSE_COLOR = rgba([0, 0, 0, 0]);
		if (!findColorReserved()) findColorUnreserved();
	}
}

/**
 * Finds color and send to background.
 */
function findAndSendColor() {
	if (!document.fullscreenElement) {
		RESPONSE_COLOR = rgba([0, 0, 0, 0]);
		if (!findColorReserved()) findColorUnreserved();
		if (document.visibilityState == "visible") browser.runtime.connect().postMessage({ color: RESPONSE_COLOR });
	}
}

/**
 * Finds color and send to background (fix for transitionend event).
 */
function findAndSendColor_fix() {
	if (!document.fullscreenElement) {
		RESPONSE_COLOR = rgba([0, 0, 0, 0]);
		if (!findColorReserved()) findColorUnreserved();
		if (document.hasFocus()) browser.runtime.connect().postMessage({ color: RESPONSE_COLOR });
	}
}

/**
 * Sets RESPONSE_COLOR with the help of host actions stored in pref_reservedColor_cs.
 * @returns True if a legal reserved color for the webpage can be found.
 */
function findColorReserved() {
	let domain = document.location.host; // "host" can be "www.irgendwas.com"
	let action = pref_reservedColor_cs[domain];
	if (action == null || (!pref_no_theme_color && action == "UN_IGNORE_THEME") || (pref_no_theme_color && action == "IGNORE_THEME")) {
		return false;
	} else if (pref_no_theme_color && action == "UN_IGNORE_THEME") {
		// User prefers igoring theme color, but sets to use theme color for this host
		if (findThemeColor()) {
			RESPONSE_INFO = `Theme color defined by the website is un-ignored
				<label id="info_action" title="Do not use theme color defined by the website">
					<span>Do not use theme color</span>
				</label>`;
		} else {
			findComputedColor();
			RESPONSE_INFO = `Theme color is not found, color is picked from the web page`;
		}
		return true;
	} else if (!pref_no_theme_color && action == "IGNORE_THEME") {
		// User sets to ignore the theme color of this host
		if (findThemeColor()) {
			findComputedColor();
			RESPONSE_INFO = `Theme color defined by the website is ignored
				<label id="info_action" title="Use theme color defined by the website">
					<span>Use theme color</span>
				</label>`;
		} else {
			findComputedColor();
		}
		return true;
	} else if (action.startsWith("QS_")) {
		let selector = action.replace("QS_", "");
		RESPONSE_COLOR = getColorFrom(document.querySelector(selector));
		RESPONSE_INFO = `Color is picked from an HTML element matching <b>${selector}</b>`;
	} else {
		RESPONSE_COLOR = rgba(action);
		RESPONSE_INFO = `Color for this domain is specified in the settings`;
	}
	// Return ture if reponse color is legal and can be sent to background.js
	return RESPONSE_COLOR != null && RESPONSE_COLOR.a == 1;
}

/**
 * Sets RESPONSE_COLOR using findThemeColor() and findComputedColor().
 */
function findColorUnreserved() {
	if (pref_no_theme_color) {
		if (findThemeColor()) {
			if (RESPONSE_COLOR != "DARKNOISE" && RESPONSE_COLOR != "PLAINTEXT") {
				findComputedColor();
				RESPONSE_INFO += `, because theme color defined by the website is ignored
					<label id="info_action" title="Use theme color defined by the website">
						<span>Un-ignore theme color</span>
					</label>`;
			}
		} else {
			findComputedColor();
		}
	} else {
		if (!findThemeColor()) findComputedColor();
	}
}

/**
 * Sets RESPONSE_COLOR using theme-color defined by the website HTML, or preset color for image / plain text viewer.
 * @returns False if no legal theme-color can be found.
 */
function findThemeColor() {
	if (getComputedStyle(document.documentElement).backgroundImage == `url("chrome://global/skin/media/imagedoc-darknoise.png")`) {
		// Image viewer
		// Firefox chooses imagedoc-darknoise.png as the background of image viewer
		// Doesn't work with images on data:image url
		RESPONSE_COLOR = "DARKNOISE";
		RESPONSE_INFO = `Using <b>chrome://global/skin/media/imagedoc-darknoise.png</b> as background`;
		return true;
	} else if (
		document.getElementsByTagName("link").length > 0 &&
		document.getElementsByTagName("link")[0].href == "resource://content-accessible/plaintext.css"
	) {
		// Plain text viewer
		// Firefox seems to have blocked content script when viewing plain text online
		// Thus this may only works for viewing local text file
		if (getColorFrom(document.body).a != 1) {
			RESPONSE_COLOR = "PLAINTEXT";
			RESPONSE_INFO = `Using color from <b>resource://content-accessible/plaintext.css</b>`;
			return true;
		} else {
			return false;
		}
	} else {
		let colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		let headerTag = document.querySelector(`meta[name="theme-color"][media="(prefers-color-scheme: ${colorScheme})"]`);
		if (headerTag == null) headerTag = document.querySelector(`meta[name="theme-color"]`);
		if (headerTag != null) {
			RESPONSE_COLOR = rgba(headerTag.content);
			// Return true if it is legal (opaque) and can be sent to background.js
			// Otherwise, return false and trigger getComputedColor()
			if (RESPONSE_COLOR.a == 1) {
				RESPONSE_INFO = `Using theme color defined by the website
					<label id="info_action" title="Ignore theme color defined by the website">
						<span>Ignore theme color</span>
					</label>`;
				return true;
			} else {
				return false;
			}
		} else {
			return false;
		}
	}
}

/**
 * Sets REPONSE_COLOR using web elements.
 * @author emilio on GitHub (modified by easonwong-de).
 */
function findComputedColor() {
	let color_temp0 = rgba([0, 0, 0, 0]);
	let element = document.elementFromPoint(window.innerWidth / 2, 3);
	for (element; element; element = element.parentElement) {
		// If the color is already opaque, intercept the loop
		if (color_temp0.a == 1) break;
		// Only if the element is wide and thick enough will it be included in the calculation
		if (element.offsetWidth / window.innerWidth >= 0.9 && element.offsetHeight >= 20) {
			let color_temp1 = getColorFrom(element);
			// If the element is tranparen, just skip
			if (color_temp1.a == 0) continue;
			color_temp0 = overlayColor(color_temp0, color_temp1);
		}
	}
	cc(RESPONSE_COLOR, color_temp0);
	// If the color is still not opaque, overlay it over the webpage body
	// If the body is not opaque, overlay it over rgb(236, 236, 236)
	// On Firefox Nightly it should be rgb(255, 255, 255)
	if (RESPONSE_COLOR.a != 1) {
		let body = document.getElementsByTagName("body")[0];
		if (body == undefined) {
			RESPONSE_COLOR = "FALLBACK";
			RESPONSE_INFO = "No color is available, using fallback color";
		} else {
			let body_color = getColorFrom(body);
			if (body_color.a == 1) {
				RESPONSE_COLOR = overlayColor(RESPONSE_COLOR, body_color);
				RESPONSE_INFO = "Color is successfully picked from the web page";
			} else {
				RESPONSE_COLOR = "FALLBACK";
				RESPONSE_INFO = "No color is available, using fallback color";
			}
		}
	} else {
		RESPONSE_INFO = "Color is successfully picked from the web page";
	}
}

/**
 * @param {HTMLElement} element The element to get color from.
 * @returns The color of the element in object, transparent if null.
 */
function getColorFrom(element) {
	if (element == null) return rgba([0, 0, 0, 0]);
	let color = getComputedStyle(element).backgroundColor;
	return color == null ? rgba([0, 0, 0, 0]) : rgba(color);
}

/**
 * Overlays one color over another.
 * @param {Object} top Color on top.
 * @param {Object} bottom Color underneath.
 * @returns Result of the addition in object.
 */
function overlayColor(top, bottom) {
	let a = (1 - top.a) * bottom.a + top.a;
	if (a == 0) {
		// Firefox renders transparent background in rgb(236, 236, 236)
		return rgba([236, 236, 236, 0]);
	} else {
		return {
			r: ((1 - top.a) * bottom.a * bottom.r + top.a * top.r) / a,
			g: ((1 - top.a) * bottom.a * bottom.g + top.a * top.g) / a,
			b: ((1 - top.a) * bottom.a * bottom.b + top.a * top.b) / a,
			a: a,
		};
	}
}

/**
 * Converts any color to rgba object.
 * @author JayB on Stack Overflow (modified by easonwong-de).
 * @param {string | Number[]} color Color to convert.
 * @returns Color in rgba object. Pure black if invalid.
 */
function rgba(color) {
	if (typeof color == "string") {
		if (color == "DEFAULT" || color == "DARKNOISE" || color == "PLAINTEXT" || color == "HOME" || color == "FALLBACK") return color;
		var canvas = document.createElement("canvas").getContext("2d");
		canvas.fillStyle = color;
		let color_temp = canvas.fillStyle;
		if (color_temp.startsWith("#")) {
			let r = color_temp[1] + color_temp[2];
			let g = color_temp[3] + color_temp[4];
			let b = color_temp[5] + color_temp[6];
			return {
				r: parseInt(r, 16),
				g: parseInt(g, 16),
				b: parseInt(b, 16),
				a: 1,
			};
		} else {
			let result = color_temp.match(/[.?\d]+/g).map(Number);
			return {
				r: result[0],
				g: result[1],
				b: result[2],
				a: result[3],
			};
		}
	} else {
		return { r: color[0], g: color[1], b: color[2], a: color[3] };
	}
}

/**
 * Copies rgba objects.
 * @param {Object} target Target color object.
 * @param {Object} source Source color object.
 */
function cc(target, source) {
	target.r = source.r;
	target.g = source.g;
	target.b = source.b;
	target.a = source.a;
}

// Passes coloring info to pop-up
RESPONSE_INFO;
