"use strict";

/*
 * Workflow of content script:
 *
 * On load:
 * notifies background -> background sends back configurations -> sends colours;
 *
 * After load:
 * 1. pref is changed, background sends configurations -> sends colour;
 * 2. (dynamic colour is on) sends colour automaticaly;
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
 * `reason` can be: `PROTECTED_PAGE`, `HOME_PAGE`, `TEXT_VIEWER`, `IMAGE_VIEWER`, `PDF_VIEWER`, `JSON_VIEWER`, `ERROR_OCCURRED`, `FALLBACK_COLOUR`, `COLOUR_PICKED`, `ADDON` (only for `popup.js`, in which case, `additionalInfo` stores the window's ID), `ADDON_SPECIFIED`, `ADDON_RECOM`, `ADDON_DEFAULT`, `THEME_UNIGNORED`, `THEME_MISSING`, `THEME_IGNORED`, `THEME_USED`, `QS_USED`, `QS_FAILED`, `QS_ERROR`, `COLOUR_SPECIFIED`.
 */
const response = {
	reason: null,
	additionalInfo: null,
	colour: { r: 0, g: 0, b: 0, a: 0 },
};

/**
 * Finds colour and send to background.
 *
 * Maximum frequency is 4 Hz.
 */
const findAndSendColour = (() => {
	let timeout;
	let lastCall = 0;
	const limitMs = 250;
	const action = async () => {
		if (document.visibilityState === "visible" && findColour())
			browser.runtime.sendMessage({
				header: "UPDATE_COLOUR",
				response: response,
			});
	};
	return async () => {
		const now = Date.now();
		clearTimeout(timeout);
		if (now - lastCall >= limitMs) {
			lastCall = now;
			await action();
		} else {
			timeout = setTimeout(
				async () => {
					lastCall = Date.now();
					await action();
				},
				limitMs - (now - lastCall),
			);
		}
	};
})();

/**
 * Finds colour and send to background but requires focus in document.
 *
 * This fits transition / animation events better.
 */
function findAndSendColour_focus() {
	if (document.hasFocus()) findAndSendColour();
}

/**
 * Finds colour.
 */
function findColour() {
	if (document.fullscreenElement) return false;
	response.reason = null;
	response.additionalInfo = null;
	response.colour = { r: 0, g: 0, b: 0, a: 0 };
	if (!findColour_policy()) findColour_noPolicy();
	return true;
}

/**
 * Sets `response.colour` with the help of the custom rule.
 *
 * @returns True if a meta `theme-color` or a custom for the web page can be found.
 */
function findColour_policy() {
	if (
		!conf.policy ||
		(!conf.noThemeColour &&
			conf.policy.type === "THEME_COLOUR" &&
			conf.policy.value === true) ||
		(conf.noThemeColour &&
			conf.policy.type === "THEME_COLOUR" &&
			conf.policy.value === false)
	) {
		return false;
	} else if (conf.policy.type === "COLOUR") {
		return findColour_policy_colour();
	} else if (conf.policy.type === "THEME_COLOUR") {
		return findColour_policy_themeColour();
	} else if (conf.policy.type === "QUERY_SELECTOR") {
		return findColour_policy_querySelector();
	} else {
		return false;
	}
}

/**
 * Handles COLOUR policy.
 */
function findColour_policy_colour() {
	response.reason = "COLOUR_SPECIFIED";
	response.additionalInfo = null;
	response.colour = parseColour(conf.policy.value);
	return response.colour?.a === 1;
}

/**
 * Handles THEME_COLOUR policy.
 */
function findColour_policy_themeColour() {
	if (conf.noThemeColour && conf.policy.value === true) {
		if (findColour_theme()) {
			response.reason = "THEME_UNIGNORED";
		} else {
			findColour_webpage();
			response.reason = "THEME_MISSING";
		}
		return true;
	} else if (!conf.noThemeColour && conf.policy.value === false) {
		if (findColour_theme()) {
			findColour_webpage();
			response.reason = "THEME_IGNORED";
		} else {
			findColour_webpage();
		}
		return true;
	}
	return false;
}

/**
 * Handles QUERY_SELECTOR policy.
 */
function findColour_policy_querySelector() {
	const querySelector = conf.policy.value;
	if (querySelector === "") {
		findColour_webpage();
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
				findColour_webpage();
				response.reason = "QS_FAILED";
			}
		} catch (error) {
			findColour_webpage();
			response.reason = "QS_ERROR";
		}
	}
	return response.colour?.a === 1;
}

/**
 * Detects image viewer and text viewer, otherwise looks for meta `theme-color` / computed colour.
 */
function findColour_noPolicy() {
	if (
		getComputedStyle(document.documentElement).backgroundImage ===
		`url("chrome://global/skin/media/imagedoc-darknoise.png")`
	) {
		// Firefox chooses `imagedoc-darknoise.png` as the background of image viewer
		// Doesn't work with images on `data:image` url, which will be dealt with in `background.js`
		response.reason = "IMAGE_VIEWER";
		response.colour = "IMAGEVIEWER";
	} else if (
		document.getElementsByTagName("link")[0]?.href ===
			"resource://content-accessible/plaintext.css" &&
		getColourFromElement(document.body).a !== 1
	) {
		// Firefox seems to have blocked content script when viewing plain text online
		// Thus this may only works for viewing local text file
		response.reason = "TEXT_VIEWER";
		response.colour = "PLAINTEXT";
	} else if (findColour_theme()) {
		if (conf.noThemeColour) {
			findColour_webpage();
			response.reason = "THEME_IGNORED";
		}
	} else {
		findColour_webpage();
	}
}

/**
 * Looks for pre-determined meta `theme-color`.
 *
 * @returns Returns `false` if no legal `theme-color` can be found.
 */
function findColour_theme() {
	const colourScheme = window.matchMedia("(prefers-color-scheme: dark)")
		?.matches
		? "dark"
		: "light";
	const metaThemeColour =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: ${colourScheme})"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	if (metaThemeColour) {
		response.colour = parseColour(metaThemeColour.content);
	} else {
		return false;
	}
	// Return `true` if `theme-color` is opaque and can be sent to `background.js`
	// Otherwise, return false and trigger `getComputedColour()`
	if (response.colour.a === 1) {
		response.reason = "THEME_USED";
		return true;
	} else {
		return false;
	}
}

/**
 * Looks for `response.colour` from the web page elements.
 *
 * If no legal colour can be found, fallback colour will be used.
 */
function findColour_webpage() {
	response.colour = { r: 0, g: 0, b: 0, a: 0 };
	// Selects all the elements 3 pixels below the middle point of the top edge of the viewport
	// It's a shame that `elementsFromPoint()` doesn't work with elements with `pointer-events: none`
	for (const element of document.elementsFromPoint(
		window.innerWidth / 2,
		3,
	)) {
		// Only if the element is wide (90 % of screen) and thick (20 pixels) enough will it be included in the calculation
		if (
			element.offsetWidth / window.innerWidth >= 0.9 &&
			element.offsetHeight >= 20
		) {
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
 * Gets the computed background color of an element as an RGBA object.
 *
 * @param {HTMLElement} element - The element to extract the background color from.
 * @returns The RGBA color object, or transparent if unavailable.
 */
function getColourFromElement(element) {
	if (!element) return { r: 0, g: 0, b: 0, a: 0 };
	const style = getComputedStyle(element);
	const backgroundColour = style.backgroundColor;
	if (!backgroundColour) return { r: 0, g: 0, b: 0, a: 0 };
	const rgba = parseColour(backgroundColour);
	const opacity = parseFloat(style.opacity);
	if (!isNaN(opacity) && opacity < 1) rgba.a *= opacity;
	return rgba;
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
		return { r: 236, g: 236, b: 236, a: 0 };
	} else {
		return {
			r:
				((1 - colourTop.a) * colourBottom.a * colourBottom.r +
					colourTop.a * colourTop.r) /
				a,
			g:
				((1 - colourTop.a) * colourBottom.a * colourBottom.g +
					colourTop.a * colourTop.g) /
				a,
			b:
				((1 - colourTop.a) * colourBottom.a * colourBottom.b +
					colourTop.a * colourTop.b) /
				a,
			a: a,
		};
	}
}

const canvasContext = document.createElement("canvas").getContext("2d");

/**
 * Parses a CSS color string and returns its RGBA components.
 *
 * @param {string} colour - The CSS color string to parse (e.g., "#RRGGBB", "rgb(...)", "rgba(...)", or named colors).
 * @returns An RGBA object.
 */
function parseColour(colour) {
	if (typeof colour !== "string") return { r: 0, g: 0, b: 0, a: 0 };
	canvasContext.fillStyle = colour;
	const parsedColour = canvasContext.fillStyle;
	if (parsedColour.startsWith("#")) {
		return {
			r: parseInt(parsedColour.slice(1, 3), 16),
			g: parseInt(parsedColour.slice(3, 5), 16),
			b: parseInt(parsedColour.slice(5, 7), 16),
			a: 1,
		};
	} else {
		const [r, g, b, a] = parsedColour.match(/[.?\d]+/g).map(Number);
		return { r, g, b, a };
	}
}

// Receives configurations and sends back colour
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	switch (message.header) {
		case "GET_COLOUR":
			conf.dynamic = message.dynamic;
			conf.noThemeColour = message.noThemeColour;
			conf.policy = message.policy;
			setDynamicUpdate();
			findColour();
			sendResponse(response);
			break;
		case "SET_THEME_COLOUR":
			setThemeColourMeta(message.colour);
			break;
		default:
			break;
	}
});

/**
 * Sets theme-color meta tag.
 *
 * @param {string} colour - RGBA color string.
 */
function setThemeColourMeta(colour) {
	if (!conf.noThemeColour) return;
	const existingMetaTag = document.querySelectorAll(
		`meta[name="theme-color"]`,
	);
	if (existingMetaTag.length === 0) {
		const metaTag = document.createElement("meta");
		metaTag.name = "theme-color";
		metaTag.content = colour;
		document.head.appendChild(metaTag);
	} else {
		existingMetaTag.forEach((meta) => (meta.content = colour));
	}
}

/**
 * Sets up / turns off dynamic update.
 */
function setDynamicUpdate() {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) => {
		document.removeEventListener(event, findAndSendColour);
		if (conf.dynamic) document.addEventListener(event, findAndSendColour);
	});
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transition) => {
		document.removeEventListener(transition, findAndSendColour_focus);
		if (conf.dynamic)
			document.addEventListener(transition, findAndSendColour_focus);
	});
}

// Detects `meta[name=theme-color]` changes
const onThemeColourChange = new MutationObserver(findAndSendColour);
const themeColourMetaTag = document.querySelector("meta[name=theme-color]");
if (themeColourMetaTag)
	onThemeColourChange.observe(themeColourMetaTag, { attributes: true });

// Detects Dark Reader
const onDarkReaderChange = new MutationObserver(findAndSendColour);
onDarkReaderChange.observe(document.documentElement, {
	attributes: true,
	attributeFilter: ["data-darkreader-mode"],
});

// Detects style injections & `meta[name=theme-color]` being added or altered
const onStyleInjection = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (
			mutation.addedNodes.length > 0 &&
			mutation.addedNodes[0].nodeName === "STYLE"
		) {
			findAndSendColour();
		} else if (
			mutation.removedNodes.length > 0 &&
			mutation.removedNodes[0].nodeName === "STYLE"
		) {
			findAndSendColour();
		} else if (
			mutation.addedNodes.length > 0 &&
			mutation.addedNodes[0].nodeName === "META" &&
			mutation.addedNodes[0].name === "theme-color"
		) {
			onThemeColourChange.observe(mutation.addedNodes[0], {
				attributes: true,
			});
		}
	});
});
onStyleInjection.observe(document.documentElement, { childList: true });
onStyleInjection.observe(document.head, { childList: true });

/**
 * Sends colour to background as soon as the page loads
 */
function sendMessageOnLoad(nthTry = 0) {
	try {
		browser.runtime.sendMessage({ header: "SCRIPT_LOADED" });
	} catch (error) {
		if (nthTry > 3) {
			console.error("Could not connect to ATBC background.");
		} else {
			console.warn("Failed to connect to ATBC background.");
			setTimeout(() => sendMessageOnLoad(++nthTry), 50);
		}
	}
}

sendMessageOnLoad();
