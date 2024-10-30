"use strict";

/*
 * Definitions of some concepts
 *
 * System colour scheme:
 * The colour scheme of the operating system, usually light or dark.
 *
 * Browser colour scheme:
 * The "website appearance" settings of Firefox, which can be light, dark, or auto.
 *
 * current.scheme:
 * Derived from System and Browser colour scheme and decides whether the light theme or dark theme is preferred.
 *
 * pref.allowDarkLight:
 * A setting that decides if a light theme is allowed to be used when current.scheme is dark, or vice versa.
 *
 * theme-color / meta theme colour:
 * A colour defined with a meta tag by some websites, usually static.
 * It is often more related to the branding than the appearance of the website.
 *
 * Theme:
 * An object that defines the appearance of the Firefox chrome.
 */

import {
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_customRule_aboutPage,
} from "./default_values.js";
import preference from "./preference.js";
import { rgba, dimColour, contrastRatio } from "./colour.js";

/** Preference */
const pref = new preference();

/** Lookup table for codified colours */
const colourCode = {
	light: {
		get HOME() {
			return current.homeBackground_light;
		},
		get FALLBACK() {
			return current.fallbackColour_light;
		},
		get IMAGEVIEWER() {
			return current.fallbackColour_light;
		},
		PLAINTEXT: rgba([236, 236, 236, 1]),
		SYSTEM: rgba([255, 255, 255, 1]),
		ADDON: rgba([236, 236, 236, 1]),
		PDFVIEWER: rgba([249, 249, 250, 1]),
		DEFAULT: rgba([255, 255, 255, 1]),
	},
	dark: {
		get HOME() {
			return current.homeBackground_dark;
		},
		get FALLBACK() {
			return current.fallbackColour_dark;
		},
		get IMAGEVIEWER() {
			return current.fallbackColour_dark;
		},
		PLAINTEXT: rgba([50, 50, 50, 1]),
		SYSTEM: rgba([30, 30, 30, 1]),
		ADDON: rgba([50, 50, 50, 1]),
		PDFVIEWER: rgba([56, 56, 61, 1]),
		DEFAULT: rgba([28, 27, 34, 1]),
	},
};

/** Variables */
const current = {
	scheme: "light", // "light" or "dark"
	homeBackground_light: rgba(default_homeBackground_light),
	homeBackground_dark: rgba(default_homeBackground_dark),
	fallbackColour_light: rgba(default_fallbackColour_light),
	fallbackColour_dark: rgba(default_fallbackColour_dark),
	customRule_webPage: {},
	async update() {
		if (pref.custom) {
			this.homeBackground_light = rgba(pref.homeBackground_light);
			this.homeBackground_dark = rgba(pref.homeBackground_dark);
			this.fallbackColour_light = rgba(pref.fallbackColour_light);
			this.fallbackColour_dark = rgba(pref.fallbackColour_dark);
			this.customRule_webPage = pref.customRule_webPage;
		} else {
			this.homeBackground_light = rgba(default_homeBackground_light);
			this.homeBackground_dark = rgba(default_homeBackground_dark);
			this.fallbackColour_light = rgba(default_fallbackColour_light);
			this.fallbackColour_dark = rgba(default_fallbackColour_dark);
			this.customRule_webPage = {};
		}
		this.scheme = await getCurrentScheme();
	},
};

const darkModeDetection = window.matchMedia("(prefers-color-scheme: dark)");

async function getCurrentScheme() {
	const webAppearanceSetting = await browser.browserSettings.overrideContentColorScheme.get({});
	const scheme = webAppearanceSetting.value;
	if (scheme === "light" || scheme === "dark") {
		return scheme;
	} else {
		console.log("darkModeDetection: ", darkModeDetection.matches);
		return darkModeDetection?.matches ? "dark" : "light";
	}
}

/**
 * Initialises the pref and current.
 */
async function initialise() {
	await pref.normalise();
	await current.update();
	update();
}

/**
 * Triggers colour change in all windows.
 */
async function update() {
	const tabs = await browser.tabs.query({ active: true, status: "complete" });
	if (!pref.valid()) await initialise();
	tabs.forEach(updateTab);
}

/**
 * Updates pref cache and triggers colour change in all windows.
 */
async function prefUpdate() {
	await pref.load();
	await current.update();
	update();
}

/**
 * Handles incoming messages based on their `reason` codes.
 *
 * @param {object} message The message object containing the `reason` and any additional data.
 * @param {runtime.MessageSender} sender Information about the message sender.
 */
function handleMessage(message, sender) {
	const tab = sender.tab;
	const actions = {
		INIT_REQUEST: initialise,
		UPDATE_REQUEST: prefUpdate,
		SCRIPT_LOADED: () => requireWebpageColour(tab),
		COLOUR_UPDATE: () => setFrameColour(tab.windowId, message.colour),
	};
	if (tab?.active && message?.reason in actions) {
		actions[message.reason]();
	} else {
		update();
	}
}

// WIP: Change to reverved colour manager
/**
 * Converts an URL to a search key for customRule.
 * @param {string} url an URL e.g. "about:page/etwas", "etwas://addons.mozilla.org/etwas", "moz-extension://*UUID/etwas".
 * @returns e.g. for about pages: "about:page", for websites: "addons.mozilla.org", for add-on pages "Add-on ID: ATBC@EasonWong".
 */
async function getSearchKey(url) {
	if (url.startsWith("about:")) {
		// e.g. "about:page"
		return url.split(/\/|\?/)[0];
	} else if (url.startsWith("moz-extension:")) {
		// Searches for add-on ID
		// Colours for add-on pages are stored with the add-on ID as their keys
		const uuid = url.split(/\/|\?/)[2];
		const addonList = await browser.management.getAll();
		for (const addon of addonList) {
			if (addon.type !== "extension" || !addon.hostPermissions) continue;
			for (const host of addon.hostPermissions) {
				if (!host.startsWith("moz-extension:") || uuid !== host.split(/\/|\?/)[2]) continue;
				return `Add-on ID: ${addon.id}`;
			}
		}
	} else {
		// In case of a regular website, returns its domain, e.g. "addons.mozilla.org"
		return url.split(/\/|\?/)[2];
	}
}

/**
 * Updates the colour for a window.
 * @param {tabs.Tab} tab The tab the window is showing.
 */
async function updateTab(tab) {
	const url = tab.url;
	const windowId = tab.windowId;
	// Visiting browser's internal files (content script blocked)
	if (url.startsWith("view-source:")) {
		setFrameColour(windowId, "PLAINTEXT");
	}
	// Visiting browser's internal files (content script blocked)
	else if (url.startsWith("chrome:") || url.startsWith("resource:") || url.startsWith("jar:file:")) {
		if (url.endsWith(".txt") || url.endsWith(".css") || url.endsWith(".jsm") || url.endsWith(".js")) {
			setFrameColour(windowId, "PLAINTEXT");
		} else if (url.endsWith(".png") || url.endsWith(".jpg")) {
			setFrameColour(windowId, "IMAGEVIEWER");
		} else {
			setFrameColour(windowId, "SYSTEM");
		}
	} else {
		// Visiting normal websites, PDF viewer (content script blocked), websites that failed to load, or local files
		// WIP: add support for setting colours for about:pages
		// WIP: add support for regex / wildcard characters
		const searchKey = await getSearchKey(url);
		const reversedCurrentScheme = current.scheme === "light" ? "dark" : "light";
		if (default_customRule_aboutPage[current.scheme][searchKey]) {
			// For preferred scheme there's a reserved colour
			setFrameColour(windowId, rgba(default_customRule_aboutPage[current.scheme][searchKey]));
		} else if (default_customRule_aboutPage[reversedCurrentScheme][searchKey] && pref.allowDarkLight) {
			// Site has reserved colour only in the other mode, and it's allowed to change mode
			setFrameColour(windowId, rgba(default_customRule_aboutPage[reversedCurrentScheme][searchKey]));
		} else if (url.startsWith("about:")) {
			// If changing mode is otherwise not allowed
			setFrameColour(windowId, "DEFAULT");
		} else if (searchKey.startsWith("Add-on ID: ") && current.customRule_webPage[searchKey]) {
			setFrameColour(windowId, rgba(current.customRule_webPage[searchKey]));
		} else if (url.startsWith("moz-extension:")) {
			setFrameColour(windowId, "ADDON");
		} else {
			requireWebpageColour(tab, current.customRule_webPage[searchKey]);
		}
	}
}

/**
 * Configures the content script and uses its colour to apply theme.
 *
 * @param {tabs.Tab} tab the tab to contact.
 * @param {string} customRule the custom rule for the tab.
 */
function requireWebpageColour(tab, customRule = null) {
	const url = tab.url;
	browser.tabs.sendMessage(
		tab.id,
		{
			reason: "COLOUR_REQUEST",
			conf: {
				dynamic: pref.dynamic,
				noThemeColour: pref.noThemeColour,
				customRule: customRule,
			},
		},
		(response) => {
			const windowId = tab.windowId;
			if (response) {
				// The colour is successfully returned
				setFrameColour(windowId, response.colour);
			} else if (url.startsWith("data:image")) {
				// Viewing an image on data:image (content script is blocked on data:pages)
				setFrameColour(windowId, "IMAGEVIEWER");
			} else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
				// When viewing a PDF file, Firefox blocks content script
				setFrameColour(windowId, "PDFVIEWER");
			} else if (tab.favIconUrl?.startsWith("chrome:")) {
				// The page probably failed to load (content script is also blocked on website that failed to load)
				setFrameColour(windowId, "DEFAULT");
			} else if (url.match(new RegExp(`https?:\/\/${tab.title}$`))) {
				// When viewing plain text online, Firefox blocks content script
				// In this case, the tab title is the same as the URL
				setFrameColour(windowId, "PLAINTEXT");
			} else {
				// Uses fallback colour
				setFrameColour(windowId, "FALLBACK");
			}
		}
	);
}

function getSuitableColourScheme(colour) {
	let eligibility_dark = contrastRatio(colour, rgba([255, 255, 255, 1])) > pref.minContrast_dark;
	let eligibility_light = contrastRatio(colour, rgba([0, 0, 0, 1])) > pref.minContrast_light;
	if (current.scheme === "light") {
		if (eligibility_light) return "light";
		if (pref.allowDarkLight && eligibility_dark) return "dark";
	} else {
		if (eligibility_dark) return "dark";
		if (pref.allowDarkLight && eligibility_light) return "light";
	}
	return false;
}

/**
 * Changes tab bar to the appointed colour. If the colour is not eligible, uses fallback colour.
 * @param {number} windowId The ID of the window.
 * @param {object | string} colour The colour to change to (in rgb object) or a colour code. Colour codes are: "HOME", "FALLBACK", "IMAGEVIEWER", "PLAINTEXT", "SYSTEM", "ADDON", "PDFVIEWER", and "DEFAULT".
 */
function setFrameColour(windowId, colour) {
	if (typeof colour === "string") {
		applyTheme(windowId, colourCode[current.scheme][colour], current.scheme);
	} else {
		let suitableColourScheme = getSuitableColourScheme(colour);
		if (suitableColourScheme) {
			applyTheme(windowId, colour, suitableColourScheme);
		} else {
			setFrameColour(windowId, "FALLBACK");
		}
	}
}

/**
 * Constructs and applies a theme to a given window.
 * @param {number} windowId The ID of the window.
 * @param {object} colour Colour of the frame, in rgba object.
 * @param {string} colourScheme "light" or "dark".
 */
function applyTheme(windowId, colour, colourScheme) {
	if (colourScheme === "light") {
		let theme = {
			colors: {
				// Tabbar & tab
				frame: dimColour(colour, -pref.tabbar * 1.5),
				frame_inactive: dimColour(colour, -pref.tabbar * 1.5),
				tab_selected: dimColour(colour, -pref.tabSelected * 1.5),
				ntp_background: dimColour(colour, 0),
				// Toolbar
				toolbar: dimColour(colour, -pref.toolbar * 1.5),
				toolbar_top_separator: "rgba(0, 0, 0, 0)",
				toolbar_bottom_separator: dimColour(colour, (-pref.toolbarBorder - pref.toolbar) * 1.5),
				// URL bar
				toolbar_field: dimColour(colour, -pref.toolbarField * 1.5),
				toolbar_field_border: "rgba(0, 0, 0, 0)",
				toolbar_field_focus: dimColour(colour, -pref.toolbarFieldOnFocus * 1.5),
				toolbar_field_border_focus: "rgb(130, 180, 245)",
				// Sidebar & popup
				sidebar: dimColour(colour, -pref.sidebar * 1.5),
				sidebar_border: dimColour(colour, (-pref.sidebar - pref.sidebarBorder) * 1.5),
				popup: dimColour(colour, -pref.popup * 1.5),
				popup_border: dimColour(colour, (-pref.popup - pref.popupBorder) * 1.5),
				// Static
				tab_background_text: "rgb(30, 30, 30)",
				tab_loading: "rgba(0, 0, 0, 0)",
				tab_line: "rgba(0, 0, 0, 0)",
				ntp_text: "rgb(0, 0, 0)",
				toolbar_text: "rgb(0, 0, 0)",
				toolbar_field_text: "rgba(0, 0, 0)",
				popup_text: "rgb(0, 0, 0)",
				sidebar_text: "rgb(0, 0, 0)",
				button_background_hover: "rgba(0, 0, 0, 0.10)",
				button_background_active: "rgba(0, 0, 0, 0.15)",
				icons: "rgb(30, 30, 30)",
			},
			properties: {
				color_scheme: "auto",
				content_color_scheme: "auto",
			},
		};
		browser.theme.update(windowId, theme);
	}
	if (colourScheme === "dark") {
		let theme = {
			colors: {
				// Tabbar & tab
				frame: dimColour(colour, pref.tabbar),
				frame_inactive: dimColour(colour, pref.tabbar),
				tab_selected: dimColour(colour, pref.tabSelected),
				ntp_background: dimColour(colour, 0),
				// Toolbar
				toolbar: dimColour(colour, pref.toolbar),
				toolbar_top_separator: "rgba(0, 0, 0, 0)",
				toolbar_bottom_separator: dimColour(colour, pref.toolbarBorder + pref.toolbar),
				// URL bar
				toolbar_field: dimColour(colour, pref.toolbarField),
				toolbar_field_border: dimColour(colour, pref.toolbarFieldBorder),
				toolbar_field_focus: dimColour(colour, pref.toolbarFieldOnFocus),
				toolbar_field_border_focus: "rgb(70, 118, 160)",
				// Sidebar
				sidebar: dimColour(colour, pref.sidebar),
				sidebar_border: dimColour(colour, pref.sidebar + pref.sidebarBorder),
				popup: dimColour(colour, pref.popup),
				popup_border: dimColour(colour, pref.popup + pref.popupBorder),
				// Static
				tab_background_text: "rgb(225, 225, 225)",
				tab_loading: "rgba(0, 0, 0, 0)",
				tab_line: "rgba(0, 0, 0, 0)",
				ntp_text: "rgb(255, 255, 255)",
				toolbar_text: "rgb(255, 255, 255)",
				toolbar_field_text: "rgb(255, 255, 255)",
				popup_text: "rgb(225, 225, 225)",
				sidebar_text: "rgb(225, 225, 225)",
				button_background_active: "rgba(255, 255, 255, 0.15)",
				button_background_hover: "rgba(255, 255, 255, 0.10)",
				icons: "rgb(225, 225, 225)",
			},
			properties: {
				color_scheme: "auto",
				content_color_scheme: "auto",
			},
		};
		browser.theme.update(windowId, theme);
	}
}

(async () => {
	await initialise();
	browser.tabs.onUpdated.addListener(update);
	browser.tabs.onActivated.addListener(update);
	browser.tabs.onAttached.addListener(update);
	browser.windows.onFocusChanged.addListener(update);
	browser.runtime.onMessage.addListener(handleMessage);
	// doesn't work
	browser.browserSettings.overrideContentColorScheme.onChange.addListener(prefUpdate);
	darkModeDetection?.addEventListener("change", prefUpdate);
})();
