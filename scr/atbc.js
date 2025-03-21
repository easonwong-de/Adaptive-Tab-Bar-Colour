"use strict";

/*
 * Workflow of content script
 *
 * On load:
 * 		notifies background -> background sends back configurations -> sends colours
 *
 * After load:
 * 		1. pref is changed, background sends configurations -> sends colour;
 * 		2. (dynamic colour is on) sends colour automaticaly
 */

/** Configurations of the content script */
const conf = {
	dynamic: true,
	noThemeColour: true,
	policy: undefined,
};

/**
 * Information to be sent to the background / popup.
 *
 * `reason` determines the content shown in the popup infobox & text in the button.
 *
 * `reason` can be: `PROTECTED_PAGE`, `HOME_PAGE`, `TEXT_VIEWER`, `IMAGE_VIEWER`, `PDF_VIEWER`, `ERROR_OCCURRED`, `FALLBACK_COLOUR`, `COLOUR_PICKED`, `ADDON_SPECIFIED`, `ADDON_RECOM`, `ADDON_DEFAULT`, `THEME_UNIGNORED`, `THEME_MISSING`, `THEME_IGNORED`, `THEME_USED`, `QS_USED`, `QS_FAILED`, `QS_ERROR`, `COLOUR_SPECIFIED`.
 */
const response = {
	reason: null,
	additionalInfo: null,
	colour: rgba([0, 0, 0, 0]),
};

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
		if (debounceTimeoutId) {
			// Clear pending function
			clearTimeout(debounceTimeoutId);
			debounceTimeoutId = null;
		}
		if (currentTime - timeoutMs > debouncePrevRun) {
			// No timeout => call the function right away
			debouncePrevRun = currentTime;
			action();
		} else {
			// Blocked by timeout => delay the function call
			debounceTimeoutId = setTimeout(() => {
				debouncePrevRun = Date.now();
				debounceTimeoutId = null;
				action();
			}, timeoutMs - (currentTime - debouncePrevRun));
		}
	};
}

var debouncePrevRun = 0;
var debounceTimeoutId = null;
const findAndSendColour_debounce = addDebounce(findAndSendColour);
const findAndSendColour_animation_debounce = addDebounce(findAndSendColour_animation);

/**
 * Sets up / turns off dynamic update.
 */
function setDynamicUpdate() {
	if (conf.dynamic) {
		document.addEventListener("click", findAndSendColour_debounce);
		document.addEventListener("resize", findAndSendColour_debounce);
		document.addEventListener("scroll", findAndSendColour_debounce);
		document.addEventListener("visibilitychange", findAndSendColour_debounce);
		document.addEventListener("transitionend", findAndSendColour_animation_debounce);
		document.addEventListener("transitioncancel", findAndSendColour_animation_debounce);
		document.addEventListener("animationend", findAndSendColour_animation_debounce);
		document.addEventListener("animationcancel", findAndSendColour_animation_debounce);
	} else {
		document.removeEventListener("click", findAndSendColour_debounce);
		document.removeEventListener("resize", findAndSendColour_debounce);
		document.removeEventListener("scroll", findAndSendColour_debounce);
		document.removeEventListener("visibilitychange", findAndSendColour_debounce);
		document.removeEventListener("transitionend", findAndSendColour_animation_debounce);
		document.removeEventListener("transitioncancel", findAndSendColour_animation_debounce);
		document.removeEventListener("animationend", findAndSendColour_animation_debounce);
		document.removeEventListener("animationcancel", findAndSendColour_animation_debounce);
	}
}

// Detects `meta[name=theme-color]` changes
const onThemeColourChange = new MutationObserver(findAndSendColour);
const themeColourMetaTag = document.querySelector("meta[name=theme-color]");
if (themeColourMetaTag) onThemeColourChange.observe(themeColourMetaTag, { attributes: true });

// Detects Dark Reader
const onDarkReaderChange = new MutationObserver(findAndSendColour);
onDarkReaderChange.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["data-darkreader-mode"],
});

// Detects style injections & `meta[name=theme-color]` being added or altered
const onStyleInjection = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.addedNodes.length > 0 && mutation.addedNodes[0].nodeName === "STYLE") {
			findAndSendColour();
		} else if (mutation.removedNodes.length > 0 && mutation.removedNodes[0].nodeName === "STYLE") {
			findAndSendColour();
		} else if (
			mutation.addedNodes.length > 0 &&
			mutation.addedNodes[0].nodeName === "META" &&
			mutation.addedNodes[0].name === "theme-color"
		) {
			onThemeColourChange.observe(mutation.addedNodes[0], { attributes: true });
		}
	});
});
onStyleInjection.observe(document.documentElement, { childList: true });
onStyleInjection.observe(document.head, { childList: true });

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.header === "COLOUR_REQUEST") {
		conf.dynamic = message.conf.dynamic;
		conf.noThemeColour = message.conf.noThemeColour;
		conf.policy = message.conf.policy;
		setDynamicUpdate();
	}
	findColour();
	sendResponse(response);
});

/**
 * Finds colour.
 */
function findColour() {
	if (document.fullscreenElement) return false;
	response.reason = null;
	response.additionalInfo = null;
	response.colour = rgba([0, 0, 0, 0]);
	if (!findColour_policy()) findColour_noPolicy();
	return true;
}

/**
 * Finds colour and send to background.
 */
function findAndSendColour() {
	if (document.visibilityState === "visible" && findColour())
		browser.runtime.sendMessage({ header: "COLOUR_UPDATE", response: response });
}

/**
 * Finds colour and send to background (fix for transitionend event).
 */
function findAndSendColour_animation() {
	if (document.hasFocus()) findAndSendColour();
}

/**
 * Sets `response.colour` with the help of the custom rule.
 *
 * @returns True if a meta `theme-color` or a custom for the web page can be found.
 */
function findColour_policy() {
	if (
		!conf.policy ||
		(!conf.noThemeColour && conf.policy.type === "THEME_COLOUR" && conf.policy.value === true) ||
		(conf.noThemeColour && conf.policy.type === "THEME_COLOUR" && conf.policy.value === false)
	) {
		// Picks colour from the website
		return false;
	} else if (conf.noThemeColour && conf.policy.type === "THEME_COLOUR" && conf.policy.value === true) {
		// User prefers igoring theme colour, but sets to use meta theme-color for this host
		if (findThemeColour()) {
			response.reason = "THEME_UNIGNORED";
		} else {
			findComputedColour();
			response.reason = "THEME_MISSING";
		}
		return true;
	} else if (!conf.noThemeColour && conf.policy.type === "THEME_COLOUR" && conf.policy.value === false) {
		// User sets to ignore the meta theme-color of this host
		if (findThemeColour()) {
			findComputedColour();
			response.reason = "THEME_IGNORED";
		} else {
			findComputedColour();
		}
		return true;
	} else if (conf.policy.type === "QUERY_SELECTOR") {
		const querySelector = conf.policy.value;
		if (querySelector === "") {
			findComputedColour();
			response.additionalInfo = "nothing";
			response.reason = "QS_ERROR";
		} else {
			try {
				const element = document.querySelector(querySelector);
				response.additionalInfo = querySelector;
				if (element) {
					response.colour = getColourFromElement(element);
					response.reason = "QS_USED";
				} else {
					findComputedColour();
					response.reason = "QS_FAILED";
				}
			} catch (error) {
				findComputedColour();
				response.reason = "QS_ERROR";
			}
		}
	} else {
		response.reason = "COLOUR_SPECIFIED";
		response.additionalInfo = null;
		response.colour = rgba(conf.policy.value);
	}
	// Returns ture if reponse colour is legal and can be sent to background.js
	return response.colour?.a === 1;
}

/**
 * Detects image viewer and text viewer, otherwise looks for meta `theme-color` / computed colour.
 */
function findColour_noPolicy() {
	if (
		getComputedStyle(document.documentElement).backgroundImage ==
		`url("chrome://global/skin/media/imagedoc-darknoise.png")`
	) {
		// Image viewer
		// Firefox chooses imagedoc-darknoise.png as the background of image viewer
		// Doesn't work with images on data:image url, which will be dealt with in background.js
		response.reason = "IMAGE_VIEWER";
		response.colour = "IMAGEVIEWER";
	} else if (
		document.getElementsByTagName("link")[0]?.href === "resource://content-accessible/plaintext.css" &&
		getColourFromElement(document.body).a !== 1
	) {
		// Plain text viewer
		// Firefox seems to have blocked content script when viewing plain text online
		// Thus this may only works for viewing local text file
		response.reason = "TEXT_VIEWER";
		response.colour = "PLAINTEXT";
	} else if (findThemeColour()) {
		if (conf.noThemeColour) {
			findComputedColour();
			response.reason = "THEME_IGNORED";
		}
	} else {
		findComputedColour();
	}
}

/**
 * Looks for pre-determined meta `theme-color`.
 * @returns Returns `false` if no legal `theme-color` can be found.
 */
function findThemeColour() {
	const colourScheme = window.matchMedia("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
	const metaThemeColourWithScheme = document.querySelector(
		`meta[name="theme-color"][media="(prefers-color-scheme: ${colourScheme})"]`
	);
	const metaThemeColour = document.querySelector(`meta[name="theme-color"]`);
	if (metaThemeColourWithScheme) {
		response.colour = rgba(metaThemeColourWithScheme.content);
	} else if (metaThemeColour) {
		response.colour = rgba(metaThemeColour.content);
	} else {
		return false;
	}
	// Returns true if it is legal (opaque) and can be sent to background.js
	// Otherwise, return false and trigger getComputedColour()
	if (response.colour.a === 1) {
		response.reason = "THEME_USED";
		return true;
	} else {
		return false;
	}
}

/**
 * Sets `response.colour` using web elements.
 *
 * If no legal colour can be found, fallback colour will be used.
 */
function findComputedColour() {
	response.colour = rgba([0, 0, 0, 0]);
	// Selects all the elements 3 pixels below the middle point of the top edge of the viewport
	// It's a shame that `elementsFromPoint()` doesn't work with elements with `pointer-events: none`
	for (const element of document.elementsFromPoint(window.innerWidth / 2, 3)) {
		// Only if the element is wide (90 % of screen) and thick (20 pixels) enough will it be included in the calculation
		if (element.offsetWidth / window.innerWidth >= 0.9 && element.offsetHeight >= 20) {
			let elementColour = getColourFromElement(element);
			if (elementColour.a === 0) continue;
			response.colour = overlayColour(response.colour, elementColour);
		}
		if (response.colour.a === 1) {
			response.reason = "COLOUR_PICKED";
			return true;
		}
	}
	// Colour is still not opaque, overlay it over the document body
	const body = document.body;
	if (body) {
		const bodyColour = getColourFromElement(body);
		if (bodyColour.a === 1) {
			response.colour = overlayColour(response.colour, bodyColour);
			response.reason = "COLOUR_PICKED";
			return true;
		}
	}
	response.colour = "FALLBACK";
	response.reason = "FALLBACK_COLOUR";
	return true;
}

/**
 * @param {HTMLElement} element The element to get colour from.
 * @returns Returns the colour of the element in object, transparent if it can't be found.
 */
function getColourFromElement(element) {
	if (!element) return rgba([0, 0, 0, 0]);
	let colour = getComputedStyle(element).backgroundColor;
	return colour ? rgba(colour) : rgba([0, 0, 0, 0]);
}

/**
 * Overlays one colour over another.
 *
 * @param {Object} colourTop Colour on top.
 * @param {Object} colourBottom Colour underneath.
 * @returns Result of the addition in object.
 */
function overlayColour(colourTop, colourBottom) {
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
 * Converts any colour to a rgba object.
 *
 * @author JayB on Stack Overflow (modified by easonwong-de).
 * @param {string | Number[]} colour Colour to convert or a colour code.
 * @returns Returns the colour in rgba object. Pure black if invalid.
 * @returns Returns the same colour code if the input is a colour code.
 */
function rgba(colour) {
	if (typeof colour === "string") {
		if (colour in ["DEFAULT", "IMAGEVIEWER", "PLAINTEXT", "HOME", "FALLBACK"]) return colour;
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
	} else if (typeof colour === "object" && colour?.length === 4) {
		return { r: colour[0], g: colour[1], b: colour[2], a: colour[3] };
	} else {
		return null;
	}
}

// Sends colour to background as soon as the page loads
browser.runtime.sendMessage({ header: "SCRIPT_LOADED" });
