// Sends colour in RGBA object to background.js
// If A in RGBA is not 1, falls back to default colour.

// Settings cache: updated on message
var dynamic = true;
var noThemeColour = true;
var reservedColour = null;

/**
 * Loads preferences into cache and check integrity.
 */
function cachePref(pref) {
	dynamic = pref.dynamic;
	noThemeColour = pref.noThemeColour;
	reservedColour = pref.custom
		? pref.reservedColour
		: {
				"apnews.com": "IGNORE_THEME",
				"developer.mozilla.org": "IGNORE_THEME",
				"www.facebook.com": "UN_IGNORE_THEME",
				"github.com": "IGNORE_THEME",
				"mail.google.com": "QS_div.wl",
				"open.spotify.com": "#000000",
				"www.linkedin.com": "IGNORE_THEME",
				"www.spiegel.de": "IGNORE_THEME",
		  };
	setDynamicUpdate(dynamic);
	return dynamic != null && noThemeColour != null && reservedColour != null;
}

// Initializes response colour
var RESPONSE_COLOUR = rgba([0, 0, 0, 0]);

/**
 * Information to be sent to the popup. "reason" determines the content shown in the popup infobox & text in the button.
 *
 * All possible "reason"s are: protected_page, home_page, text_viewer, image_viewer, pdf_viewer, error_occurred, fallback_colour, colour_picked, addon_default, addon_recom, addon_specify, theme_unignored, theme_missing, theme_ignored, theme_used, using_qs, colour_specified
 */
var RESPONSE_INFO = { reason: "protected_page", additionalInfo: null, action: null };

// Sends colour to background as soon as the page loads
browser.storage.local.get((pref) => {
	if (cachePref(pref)) findAndSendColour();
});

var debouncePrevRun = 0;
var debounceTimeoutID = null;

/**
 * Runs the given function with a maximum rate of 100ms.
 * @param {function} action Fuction without debounce.
 * @returns Function with debounce.
 * @author cloone8 on GitHub.
 */
function addDebounce(action) {
	const timeoutMs = 250;
	return () => {
		const currentTime = Date.now();
		if (debounceTimeoutID) {
			// Clear pending function
			clearTimeout(debounceTimeoutID);
			debounceTimeoutID = null;
		}
		if (currentTime - timeoutMs > debouncePrevRun) {
			// No timeout => call the function right away
			debouncePrevRun = currentTime;
			action();
		} else {
			// Blocked by timeout => delay the function call
			debounceTimeoutID = setTimeout(() => {
				debouncePrevRun = Date.now();
				debounceTimeoutID = null;
				action();
			}, timeoutMs - (currentTime - debouncePrevRun));
		}
	};
}

const findAndSendColour_debounce = addDebounce(findAndSendColour);
const findAndSendColour_animation_debounce = addDebounce(findAndSendColour_animation);

/**
 * Sets up / Turns off dynamic update.
 * @param {boolean} dynamic Dynamic update.
 */
function setDynamicUpdate(dynamic) {
	if (dynamic) {
		document.addEventListener("animationend", findAndSendColour_animation_debounce);
		document.addEventListener("animationcancel", findAndSendColour_animation_debounce);
		document.addEventListener("pageshow", findAndSendColour);
		document.addEventListener("click", findAndSendColour_debounce);
		document.addEventListener("resize", findAndSendColour_debounce);
		document.addEventListener("scroll", findAndSendColour_debounce);
		document.addEventListener("transitionend", findAndSendColour_animation_debounce);
		document.addEventListener("transitioncancel", findAndSendColour_animation_debounce);
		document.addEventListener("visibilitychange", findAndSendColour_debounce);
	} else {
		document.removeEventListener("animationend", findAndSendColour_animation_debounce);
		document.removeEventListener("animationcancel", findAndSendColour_animation_debounce);
		document.removeEventListener("pageshow", findAndSendColour);
		document.removeEventListener("click", findAndSendColour_debounce);
		document.removeEventListener("resize", findAndSendColour_debounce);
		document.removeEventListener("scroll", findAndSendColour_debounce);
		document.removeEventListener("transitionend", findAndSendColour_animation_debounce);
		document.removeEventListener("transitioncancel", findAndSendColour_animation_debounce);
		document.removeEventListener("visibilitychange", findAndSendColour_debounce);
	}
}

// Detects "meta[name=theme-color]" changes
var onThemeColourChange = new MutationObserver(findAndSendColour);
var themeColourMeta = document.querySelector("meta[name=theme-color]");
if (themeColourMeta) onThemeColourChange.observe(themeColourMeta, { attributes: true });

// Detects Dark Reader
var onDarkReaderChange = new MutationObserver(findAndSendColour);
onDarkReaderChange.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["data-darkreader-mode"],
});

// Detects style injections & "meta[name=theme-color]" being added or altered
var onStyleInjection = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "STYLE") findAndSendColour();
		else if (mutation.removedNodes.length > 0 && mutation.removedNodes[0].nodeName == "STYLE") findAndSendColour();
		else if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName == "META" && mutation.addedNodes[0].name == "theme-color")
			onThemeColourChange.observe(document.querySelector("meta[name=theme-color]"), { attributes: true });
	});
});
onStyleInjection.observe(document.documentElement, { childList: true });
onStyleInjection.observe(document.head, { childList: true });

// Fired by update() from background.js
// Loads newly applied settings
browser.runtime.onMessage.addListener((pref, sender, sendResponse) => {
	dynamic = pref.dynamic;
	noThemeColour = pref.noThemeColour;
	reservedColour = pref.reservedColour;
	setDynamicUpdate(dynamic);
	if (pref.reason == "INFO_REQUEST") {
		findColour();
		sendResponse(RESPONSE_INFO);
	} else if (pref.reason == "COLOUR_REQUEST") {
		findAndSendColour();
		// Sends back anything to prove activity
		sendResponse(RESPONSE_COLOUR);
	}
});

/**
 * Finds colour.
 */
function findColour() {
	// Aborts operation if the page is in full screen mode
	if (document.fullscreenElement) return null;
	// Resets RESPONSE_COLOUR
	RESPONSE_COLOUR = rgba([0, 0, 0, 0]);
	// Resets RESPONSE_INFO
	RESPONSE_INFO = { reason: "protected_page", additionalInfo: null, action: null };
	// If there isn't a colour reserved for the website, then find one from it
	if (!findColourReserved()) findColourUnreserved();
	return true;
}

/**
 * Finds colour and send to background.
 */
function findAndSendColour() {
	if (document.visibilityState == "visible" && findColour()) browser.runtime.sendMessage({ reason: "COLOUR_UPDATE", colour: RESPONSE_COLOUR });
}

/**
 * Finds colour and send to background (fix for transitionend event).
 */
function findAndSendColour_animation() {
	if (document.hasFocus()) findAndSendColour();
}

/**
 * Sets RESPONSE_COLOUR with the help of host actions stored in current_reservedColour.
 * @returns True if a meta theme-color or a reserved colour for the webpage can be found.
 */
function findColourReserved() {
	// "host" can be "www.irgendwas.com"
	let domain = document.location.host;
	let domainReservedColour = reservedColour[domain];
	if (
		domainReservedColour == null ||
		(!noThemeColour && domainReservedColour == "UN_IGNORE_THEME") ||
		(noThemeColour && domainReservedColour == "IGNORE_THEME")
	)
		// Picks colour from the website
		return false;
	else if (noThemeColour && domainReservedColour == "UN_IGNORE_THEME") {
		// User prefers igoring theme colour, but sets to use meta theme-color for this host
		if (findThemeColour()) RESPONSE_INFO.reason = "theme_ignored";
		else {
			findComputedColour();
			RESPONSE_INFO.reason = "theme_missing";
		}
		return true;
	} else if (!noThemeColour && domainReservedColour == "IGNORE_THEME") {
		// User sets to ignore the meta theme-color of this host
		if (findThemeColour()) {
			findComputedColour();
			RESPONSE_INFO.reason = "theme_ignored";
		} else findComputedColour();
		return true;
	} else if (domainReservedColour.startsWith("QS_")) {
		let querySelector = domainReservedColour.replace("QS_", "");
		RESPONSE_COLOUR = getColourFromElement(document.querySelector(querySelector));
		RESPONSE_INFO.reason = "using_qs";
		RESPONSE_INFO.additionalInfo = querySelector;
	} else {
		RESPONSE_COLOUR = rgba(domainReservedColour);
		RESPONSE_INFO.reason = "colour_specified";
	}
	// Return ture if reponse colour is legal and can be sent to background.js
	return RESPONSE_COLOUR != null && RESPONSE_COLOUR.a == 1;
}

/**
 * Detects image viewer and text viewer, otherwise looks for theme-color / computed colour.
 */
function findColourUnreserved() {
	if (getComputedStyle(document.documentElement).backgroundImage == `url("chrome://global/skin/media/imagedoc-darknoise.png")`) {
		// Image viewer
		// Firefox chooses imagedoc-darknoise.png as the background of image viewer
		// Doesn't work with images on data:image url, which will be dealt with in background.js
		RESPONSE_COLOUR = "IMAGEVIEWER";
		RESPONSE_INFO.reason = "image_viewer";
	} else if (
		document.getElementsByTagName("link").length > 0 &&
		document.getElementsByTagName("link")[0].href == "resource://content-accessible/plaintext.css"
	) {
		// Plain text viewer
		// Firefox seems to have blocked content script when viewing plain text online
		// Thus this may only works for viewing local text file
		if (getColourFromElement(document.body).a != 1) {
			RESPONSE_COLOUR = "PLAINTEXT";
			RESPONSE_INFO.reason = "text_viewer";
		}
	} else if (noThemeColour) findComputedColour();
	// Or if theme colour can't be found
	else if (!findThemeColour()) findComputedColour();
}

/**
 * Looks for pre-determined theme-color.
 * @returns False if no legal theme-color can be found.
 */
function findThemeColour() {
	let colourScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
	let metaThemeColour = document.querySelector(`meta[name="theme-color"][media="(prefers-color-scheme: ${colourScheme})"]`);
	if (metaThemeColour == null) metaThemeColour = document.querySelector(`meta[name="theme-color"]`);
	if (metaThemeColour != null) {
		RESPONSE_COLOUR = rgba(metaThemeColour.content);
		// Returns true if it is legal (opaque) and can be sent to background.js
		// Otherwise, return false and trigger getComputedColour()
		if (RESPONSE_COLOUR.a == 1) {
			RESPONSE_INFO.reason = "theme_used";
			return true;
		} else return false;
	} else return false;
}

/**
 * Sets REPONSE_COLOUR using web elements.
 * @author emilio on GitHub (modified by easonwong-de).
 */
function findComputedColour() {
	RESPONSE_COLOUR = rgba([0, 0, 0, 0]);
	// Selects the element 3 pixels below the middle point of the top edge of the screen
	let element = document.elementFromPoint(window.innerWidth / 2, 3);
	for (element; element; element = element.parentElement) {
		if (RESPONSE_COLOUR.a == 1) break;
		// Only if the element is wide (90 % of screen) and thick (20 pixels) enough will it be included in the calculation
		if (element.offsetWidth / window.innerWidth >= 0.9 && element.offsetHeight >= 20) {
			let colourBottom = getColourFromElement(element);
			if (colourBottom.a == 0) continue;
			RESPONSE_COLOUR = overlayColour(RESPONSE_COLOUR, colourBottom);
		}
	}
	// If the colour is still not opaque, overlay it over the webpage body
	// If the body is still not opaque, use fallback colour
	if (RESPONSE_COLOUR.a != 1) {
		let body = document.getElementsByTagName("body")[0];
		if (body) {
			let BodyColour = getColourFromElement(body);
			if (BodyColour.a == 1) {
				RESPONSE_COLOUR = overlayColour(RESPONSE_COLOUR, BodyColour);
				RESPONSE_INFO.reason = "colour_picked";
			} else {
				RESPONSE_COLOUR = "FALLBACK";
				RESPONSE_INFO.reason = "fallback_colour";
			}
		} else {
			RESPONSE_COLOUR = "FALLBACK";
			RESPONSE_INFO.reason = "fallback_colour";
		}
	} else RESPONSE_INFO.reason = "colour_picked";
}

/**
 * @param {HTMLElement} element The element to get colour from.
 * @returns The colour of the element in object, transparent if null.
 */
function getColourFromElement(element) {
	if (!element) return rgba([0, 0, 0, 0]);
	let colour = getComputedStyle(element).backgroundColor;
	return colour ? rgba(colour) : rgba([0, 0, 0, 0]);
}

/**
 * Overlays one colour over another.
 * @param {Object} colourTop Colour on top.
 * @param {Object} colourBottom Colour underneath.
 * @returns Result of the addition in object.
 */
function overlayColour(colourTop, colourBottom) {
	let a = (1 - colourTop.a) * colourBottom.a + colourTop.a;
	if (a == 0)
		// Firefox renders transparent background in rgb(236, 236, 236)
		return rgba([236, 236, 236, 0]);
	else
		return {
			r: ((1 - colourTop.a) * colourBottom.a * colourBottom.r + colourTop.a * colourTop.r) / a,
			g: ((1 - colourTop.a) * colourBottom.a * colourBottom.g + colourTop.a * colourTop.g) / a,
			b: ((1 - colourTop.a) * colourBottom.a * colourBottom.b + colourTop.a * colourTop.b) / a,
			a: a,
		};
}

/**
 * Converts any colour to rgba object.
 * @author JayB on Stack Overflow (modified by easonwong-de).
 * @param {string | Number[]} colour Colour to convert.
 * @returns Colour in rgba object. Pure black if invalid.
 */
function rgba(colour) {
	if (typeof colour == "string") {
		if (colour == "DEFAULT" || colour == "IMAGEVIEWER" || colour == "PLAINTEXT" || colour == "HOME" || colour == "FALLBACK") return colour;
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

// Passes colouring info to pop-up
RESPONSE_INFO;
