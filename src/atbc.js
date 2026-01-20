const conf = {
	active: false,
	dynamic: false,
	query: null,
};

browser.runtime.onMessage.addListener((message, _, sendResponse) => {
	switch (message.header) {
		case "GET_COLOUR":
			conf.active = message.active;
			conf.dynamic = message.dynamic;
			conf.query = message.query;
			conf.active && conf.dynamic ? enableDynamic() : disableDynamic();
			if (conf.active) sendResponse(getColour());
			break;
		case "SET_THEME_COLOUR":
			setThemeColour(message.colour);
			break;
		default:
			break;
	}
});

/**
 * Retrieves the colour data from the current page.
 *
 * @returns {object} The colour data object.
 */
function getColour() {
	return {
		theme: getThemeColour(),
		page: getPageColour(),
		query: getQueryColour(),
	};
}

/**
 * Extracts the theme colour from meta tags.
 *
 * @returns {{ light?: string; dark?: string }} The extracted theme colours.
 */
function getThemeColour() {
	const metaThemeColourLight =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: light)"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	const metaThemeColourDark =
		document.querySelector(
			`meta[name="theme-color"][media="(prefers-color-scheme: dark)"]`,
		) ?? document.querySelector(`meta[name="theme-color"]`);
	return {
		light: metaThemeColourLight?.content,
		dark: metaThemeColourDark?.content,
	};
}

/**
 * Extracts visible element colours from the top of the viewport.
 *
 * @returns {object[]} List of element colour objects.
 */
function getPageColour() {
	return document
		.elementsFromPoint(window.innerWidth / 2, 3)
		.filter(
			(element) =>
				element.offsetWidth >= window.innerWidth * 0.9 &&
				element.offsetHeight >= 20,
		)
		.map((element) => getElementColour(element))
		.filter((colour) => colour !== undefined);
}

/**
 * Extracts colour from an element matching the query.
 *
 * @param {string} query - The CSS selector.
 * @returns {object | undefined} Element colour object.
 */
function getQueryColour(query) {
	try {
		return conf.query
			? getElementColour(document.querySelector(query))
			: undefined;
	} catch (error) {
		return undefined;
	}
}

/**
 * Extracts style properties from an element.
 *
 * @param {Element} element - The target element.
 * @returns {{ colour: string; opacity: string; filter: string } | undefined}
 *   The extracted styles.
 */
function getElementColour(element) {
	if (element instanceof Element) {
		const style = getComputedStyle(element);
		return {
			colour: style.backgroundColor,
			opacity: style.opacity,
			filter: style.filter,
		};
	}
}

const darkReaderObserver = new MutationObserver(sendColour);
const metaThemeColourObserver = new MutationObserver(sendColour);
const metaTagObserver = new MutationObserver((mutationList) =>
	mutationList.forEach((mutation) => {
		mutation.addedNodes.forEach((node) => {
			if (node.nodeName === "META" && node.name === "theme-color") {
				sendColour();
				metaThemeColourObserver.observe(node, {
					attributes: true,
				});
			}
		});
	}),
);
const styleTagObserver = new MutationObserver((mutationList) => {
	if (
		mutationList.some((mutation) =>
			[...mutation.addedNodes, ...mutation.removedNodes].some(
				(node) => node.nodeName === "STYLE",
			),
		)
	) {
		sendColour();
	}
});

/** Enables dynamic colour monitoring using event listeners and observers. */
function enableDynamic() {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) =>
		document.addEventListener(event, sendColour),
	);
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transitionEvent) =>
		document.addEventListener(transitionEvent, sendColourRequiresFocus),
	);
	darkReaderObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["data-darkreader-mode"],
	});
	document
		.querySelectorAll("meta[name=theme-color]")
		.forEach((metaTag) =>
			metaThemeColourObserver.observe(metaTag, { attributes: true }),
		);
	metaTagObserver.observe(document.head, { childList: true });
	styleTagObserver.observe(document.documentElement, { childList: true });
	styleTagObserver.observe(document.head, { childList: true });
}

/** Disables dynamic colour monitoring. */
function disableDynamic() {
	["click", "resize", "scroll", "visibilitychange"].forEach((event) =>
		document.removeEventListener(event, sendColour),
	);
	[
		"transitionend",
		"transitioncancel",
		"animationend",
		"animationcancel",
	].forEach((transitionEvent) =>
		document.removeEventListener(transitionEvent, sendColourRequiresFocus),
	);
	darkReaderObserver.disconnect();
	metaThemeColourObserver.disconnect();
	metaTagObserver.disconnect();
	styleTagObserver.disconnect();
}

/**
 * Sets the theme colour by adding a meta tag.
 *
 * @param {string} colour - The colour string.
 */
function setThemeColour(colour) {
	const metaThemeColourList = document.querySelectorAll(
		`meta[name="theme-color"]`,
	);
	const newMetaThemeColour = document.createElement("meta");
	newMetaThemeColour.name = "theme-color";
	newMetaThemeColour.content = colour;
	document.head.appendChild(newMetaThemeColour);
	metaThemeColourList.forEach((metaThemeColour) => metaThemeColour.remove());
}

let dispatchTimeout;
let lastSentAt = 0;
const throttleIntervalMs = 250;

/**
 * Sends the current page colour to the background script with throttling.
 *
 * @async
 */
async function sendColour() {
	clearTimeout(dispatchTimeout);
	const remaining = throttleIntervalMs + lastSentAt - Date.now();
	const dispatch = async () => {
		if (document.visibilityState !== "visible") return;
		lastSentAt = Date.now();
		await browser.runtime.sendMessage({
			header: "UPDATE_COLOUR",
			colour: getColour(),
		});
	};
	remaining <= 0
		? await dispatch()
		: (dispatchTimeout = setTimeout(dispatch, remaining));
}

/**
 * Sends colour update if the document has focus.
 *
 * @async
 */
async function sendColourRequiresFocus() {
	if (document.hasFocus()) await sendColour();
}

(async function sendMessageOnLoad(attempt = 0) {
	try {
		await browser.runtime.sendMessage({ header: "SCRIPT_READY" });
	} catch {
		attempt >= 3
			? console.error("Could not connect to ATBC background.")
			: console.warn("Failed to connect to ATBC background.");
		setTimeout(() => sendMessageOnLoad(++attempt), 50);
	}
})();
