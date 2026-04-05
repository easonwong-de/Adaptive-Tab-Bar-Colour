import type {
	MessageForBackground,
	MessageForTab,
	TabColourData,
	TabElementColourData,
	TabThemeColourData,
} from "@/utils/types.js";
import { sendMessageToBackground } from "@/utils/utility";

let query: string | undefined;

/**
 * Handles incoming runtime messages from the background script.
 *
 * @param {MessageForTab} message - Runtime message payload.
 * @param {Browser.runtime.MessageSender} _ - Message sender metadata.
 * @param {(response?: unknown) => void} sendResponse - Callback used to return
 *   a response to the sender.
 */
function handleMessage(
	message: MessageForTab,
	_: Browser.runtime.MessageSender,
	sendResponse: (response?: unknown) => void,
): void {
	switch (message.header) {
		case "GET_COLOUR":
			query = message.query;
			message.dynamic ? enableDynamic() : disableDynamic();
			sendResponse(getColour());
			break;
		case "SET_THEME_COLOUR":
			setThemeColour(message.colour);
			break;
		default:
			break;
	}
}

/**
 * Retrieves the colour data from the current page.
 *
 * @returns {TabColourData} The colour data object.
 */
function getColour(): TabColourData {
	return {
		theme: getThemeColour(),
		page: getPageColour(),
		query: getQueryColour(),
		image: isImageViewer(),
	};
}

/**
 * Extracts the theme colour from meta tags.
 *
 * @returns {TabThemeColourData} The extracted theme colours.
 */
function getThemeColour(): TabThemeColourData {
	const metaThemeColour = document.querySelector<HTMLMetaElement>(
		`meta[name="theme-color"]:not([media])`,
	);
	const metaThemeColourLight =
		document.querySelector<HTMLMetaElement>(
			`meta[name="theme-color"][media="(prefers-color-scheme: light)"]`,
		) ?? metaThemeColour;
	const metaThemeColourDark =
		document.querySelector<HTMLMetaElement>(
			`meta[name="theme-color"][media="(prefers-color-scheme: dark)"]`,
		) ?? metaThemeColour;
	return {
		light: metaThemeColourLight?.content,
		dark: metaThemeColourDark?.content,
	};
}

/**
 * Extracts visible element colours from the top of the viewport.
 *
 * @returns {TabElementColourData[]} List of element colour objects.
 */
function getPageColour(): TabElementColourData[] {
	return document
		.elementsFromPoint(window.innerWidth / 2, 3)
		.filter(
			(element) =>
				element instanceof HTMLElement &&
				element.offsetWidth >= window.innerWidth * 0.9 &&
				element.offsetHeight >= 20,
		)
		.map((element) => getElementColour(element))
		.concat(
			getElementColour(document.body),
			getElementColour(document.documentElement),
		)
		.filter((colour) => colour !== undefined);
}

/**
 * Extracts colour from an element matching the query.
 *
 * @returns {TabElementColourData | undefined} Element colour object.
 */
function getQueryColour(): TabElementColourData | undefined {
	try {
		return query
			? getElementColour(document.querySelector(query))
			: undefined;
	} catch (error) {
		return undefined;
	}
}

function isImageViewer(): boolean {
	return (
		getComputedStyle(document.documentElement).backgroundImage ===
		'url("chrome://global/skin/media/imagedoc-darknoise.png")'
	);
}

/**
 * Extracts style properties from an element.
 *
 * @param {Element | null} element - The target element.
 * @returns {TabElementColourData | undefined} The extracted styles.
 */
function getElementColour(
	element: Element | null,
): TabElementColourData | undefined {
	if (element instanceof Element) {
		const style = getComputedStyle(element);
		const backgroundColor = style.backgroundColor;
		const opacity = style.opacity;
		if (backgroundColor !== "rgba(0, 0, 0, 0)" && opacity !== "0")
			return {
				colour: backgroundColor,
				opacity: opacity,
				filter: style.filter,
			};
	}
}

const darkReaderObserver = new MutationObserver(sendColour);
const metaThemeColourObserver = new MutationObserver(sendColour);
const metaTagObserver = new MutationObserver((mutationList) =>
	mutationList.forEach((mutation) => {
		mutation.addedNodes.forEach((node) => {
			if (
				node instanceof HTMLMetaElement &&
				node.name === "theme-color"
			) {
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
function enableDynamic(): void {
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
	if (document.head)
		metaTagObserver.observe(document.head, { childList: true });
	styleTagObserver.observe(document.documentElement, { childList: true });
	if (document.head)
		styleTagObserver.observe(document.head, { childList: true });
}

/** Disables dynamic colour monitoring. */
function disableDynamic(): void {
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
function setThemeColour(colour: string): void {
	const metaThemeColourList = document.querySelectorAll(
		`meta[name="theme-color"]`,
	);
	const newMetaThemeColour = document.createElement("meta");
	newMetaThemeColour.name = "theme-color";
	newMetaThemeColour.content = colour;
	(document.head || document.documentElement).appendChild(newMetaThemeColour);
	metaThemeColourList.forEach((metaThemeColour) => metaThemeColour.remove());
}

let dispatchTimeout: ReturnType<typeof setTimeout> | undefined;
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
		try {
			await browser.runtime.sendMessage({
				header: "UPDATE_COLOUR",
				colour: getColour(),
			});
		} catch (error) {
			console.warn("Failed to send colour to ATBC background.");
		}
	};
	remaining <= 0
		? await dispatch()
		: (dispatchTimeout = setTimeout(() => {
				void dispatch();
			}, remaining));
}

/**
 * Sends colour update if the document has focus.
 *
 * @async
 */
async function sendColourRequiresFocus() {
	if (document.hasFocus()) await sendColour();
}

export default defineContentScript({
	matches: ["<all_urls>"],
	main() {
		addMessageListener(handleMessage);
		(async function sendMessageOnLoad(attempt = 0) {
			try {
				await sendMessageToBackground({ header: "SCRIPT_READY" });
			} catch {
				if (attempt < 10) {
					console.warn("Failed to connect to ATBC background.");
					setTimeout(() => sendMessageOnLoad(++attempt), 1000);
				} else {
					console.error("Could not connect to ATBC background.");
				}
			}
		})();
	},
});
