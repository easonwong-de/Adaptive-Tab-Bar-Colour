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

import { default_aboutPageColour, default_protectedPageColour } from "./default_values.js";
import preference from "./preference.js";
import { rgba, dimColourToString, contrastCorrection } from "./colour.js";
import { onSchemeChanged, getCurrentScheme } from "./utility.js";

/** Preference */
const pref = new preference();

/** Lookup table for codified colours */
const colourCode = {
	HOME: {
		get light() {
			return rgba(pref.homeBackground_light);
		},
		get dark() {
			return rgba(pref.homeBackground_dark);
		},
	},
	FALLBACK: {
		get light() {
			return rgba(pref.fallbackColour_light);
		},
		get dark() {
			return rgba(pref.fallbackColour_dark);
		},
	},
	PLAINTEXT: { light: rgba([255, 255, 255, 1]), dark: rgba([28, 27, 34, 1]) },
	SYSTEM: { light: rgba([255, 255, 255, 1]), dark: rgba([30, 30, 30, 1]) },
	ADDON: { light: rgba([236, 236, 236, 1]), dark: rgba([50, 50, 50, 1]) },
	PDFVIEWER: { light: rgba([249, 249, 250, 1]), dark: rgba([56, 56, 61, 1]) },
	IMAGEVIEWER: { light: undefined, dark: rgba([33, 33, 33, 1]) },
	DEFAULT: { light: rgba([255, 255, 255, 1]), dark: rgba([28, 27, 34, 1]) },
};

/** Variables */
const current = {
	scheme: "light", // "light" or "dark"
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	async update() {
		this.scheme = await getCurrentScheme();
	},
};

/**
 * Initialises the pref and current.
 */
async function initialise() {
	await pref.normalise();
	await update();
}

/**
 * Updates pref cache and triggers colour change in all windows.
 */
async function prefUpdate() {
	await pref.load();
	await update();
}

/**
 * Triggers colour change in all windows.
 */
async function update() {
	await current.update();
	if (!pref.valid()) await initialise();
	const activeTabs = await browser.tabs.query({ active: true, status: "complete" });
	activeTabs.forEach(updateTab);
}

/**
 * Handles incoming messages based on their `reason` codes.
 *
 * @param {object} message The message object containing the `reason` and any additional data.
 * @param {runtime.MessageSender} sender Information about the message sender.
 */
async function handleMessage(message, sender) {
	const tab = sender.tab;
	const header = message?.header;
	switch (header) {
		case "INIT_REQUEST":
			return await initialise();
		case "PREF_CHANGED":
			return await prefUpdate();
		case "SCRIPT_LOADED":
			return setFrameColour(tab, await getWebPageColour(tab));
		case "COLOUR_UPDATE":
			return setFrameColour(tab, message.response.colour);
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		default:
			return update();
	}
}

/**
 * @param {string} pathname
 */
function getAboutPageColour(pathname) {
	if (default_aboutPageColour[pathname]?.[current.scheme]) {
		return rgba(default_aboutPageColour[pathname][current.scheme]);
	} else if (default_aboutPageColour[pathname]?.[current.reversedScheme]) {
		return rgba(default_aboutPageColour[pathname][current.reversedScheme]);
	} else {
		return "DEFAULT";
	}
}

/**
 * @param {string} hostname
 */
function getProtectedPageColour(hostname) {
	if (default_protectedPageColour[hostname]?.[current.scheme]) {
		return rgba(default_protectedPageColour[hostname][current.scheme]);
	} else if (default_protectedPageColour[hostname]?.[current.reversedScheme]) {
		return rgba(default_protectedPageColour[hostname][current.reversedScheme]);
	} else {
		return "FALLBACK";
	}
}

/**
 * @param {string} url
 */
async function getAddonPageColour(url) {
	const uuid = url.split(/\/|\?/)[2];
	const addonList = await browser.management.getAll();
	for (const addon of addonList) {
		if (!(addon.type === "extension" && addon.hostPermissions)) continue;
		for (const host of addon.hostPermissions) {
			if (host.startsWith("moz-extension:") && uuid === host.split(/\/|\?/)[2]) {
				const colour = pref.getPolicy(addon.id, "ADDON_ID");
				if (colour) {
					return rgba(colour.value);
				} else continue;
			} else continue;
		}
	}
	return "ADDON";
}

/**
 * Configures the content script and uses the tab's colour to apply theme.
 *
 * @param {tabs.Tab} tab The tab to contact.
 */
async function getWebPageColour(tab) {
	const url = tab.url;
	try {
		const response = await browser.tabs.sendMessage(tab.id, {
			header: "COLOUR_REQUEST",
			conf: {
				dynamic: pref.dynamic,
				noThemeColour: pref.noThemeColour,
				policy: pref.getPolicy(url),
			},
		});
		return response.colour;
	} catch (error) {
		if (url.startsWith("data:image")) {
			// Viewing an image on data:image (content script is blocked on data:pages)
			return "IMAGEVIEWER";
		} else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
			// When viewing a PDF file, Firefox blocks content script
			return "PDFVIEWER";
		} else if (tab.favIconUrl?.startsWith("chrome:")) {
			// The page probably failed to load (content script is also blocked on website that failed to load)
			return "DEFAULT";
		} else if (url.match(new RegExp(`https?:\/\/${tab.title}$`))) {
			// When viewing plain text online, Firefox blocks content script
			// In this case, the tab title is the same as the URL
			return "PLAINTEXT";
		} else {
			return "FALLBACK";
		}
	}
}

/**
 * Updates the colour for an active tab of a window.
 *
 * @param {tabs.Tab} tab The active tab.
 */
async function updateTab(tab) {
	const url = new URL(tab.url);
	if (url.protocol === "view-source:") {
		setFrameColour(tab, "PLAINTEXT");
	} else if (url.protocol === "chrome:" || url.protocol === "resource:" || url.protocol === "jar:file:") {
		if (
			url.href.endsWith(".txt") ||
			url.href.endsWith(".css") ||
			url.href.endsWith(".jsm") ||
			url.href.endsWith(".js")
		) {
			setFrameColour(tab, "PLAINTEXT");
		} else if (url.href.endsWith(".png") || url.href.endsWith(".jpg")) {
			setFrameColour(tab, "IMAGEVIEWER");
		} else {
			setFrameColour(tab, "SYSTEM");
		}
	} else if (url.protocol === "about:") {
		setFrameColour(tab, getAboutPageColour(url.pathname));
	} else if (url.hostname in default_protectedPageColour) {
		setFrameColour(tab, getProtectedPageColour(url.hostname));
	} else if (url.protocol === "moz-extension:") {
		setFrameColour(tab, await getAddonPageColour(url.href));
	} else {
		// To-do: unify site lists for about / protected pages with those for normal web pages
		setFrameColour(tab, await getWebPageColour(tab));
	}
}

/**
 * Applies given colour to the browser chrome.
 *
 * If the tab is inactive, nothing will be done. Colour will be adjusted if the contrast ratio is not adequate.
 *
 * @param {tabs.Tab} tab The tab in a window, whose frame is being changed.
 * @param {object | string} colour The colour to change to (in rgb object) or a colour code. Colour codes are: `HOME`, `FALLBACK`, `IMAGEVIEWER` (dark only), `PLAINTEXT`, `SYSTEM`, `ADDON`, `PDFVIEWER`, and `DEFAULT`.
 */
function setFrameColour(tab, colour) {
	if (!tab?.active) return;
	const windowId = tab.windowId;
	if (typeof colour === "string") {
		if (colourCode[colour][current.scheme]) {
			applyTheme(windowId, colourCode[colour][current.scheme], current.scheme);
		} else if (colourCode[colour][current.reversedScheme] && pref.allowDarkLight) {
			applyTheme(windowId, colourCode[colour][current.reversedScheme], current.reversedScheme);
		} else {
			const correctionResult = contrastCorrection(
				colourCode[colour][current.reversedScheme],
				current.scheme,
				pref.allowDarkLight,
				pref.minContrast_light,
				pref.minContrast_dark
			);
			applyTheme(windowId, correctionResult.colour, correctionResult.scheme);
		}
	} else {
		const correctionResult = contrastCorrection(
			colour,
			current.scheme,
			pref.allowDarkLight,
			pref.minContrast_light,
			pref.minContrast_dark
		);
		applyTheme(windowId, correctionResult.colour, correctionResult.scheme);
	}
}

/**
 * Constructs a theme and applies it to a given window.
 *
 * @param {number} windowId The ID of the window.
 * @param {object} colour Colour of the frame, in rgba object.
 * @param {string} colourScheme `light` or `dark`.
 */
function applyTheme(windowId, colour, colourScheme) {
	if (colourScheme === "light") {
		const theme = {
			colors: {
				// Tabbar & tab
				frame: dimColourToString(colour, -pref.tabbar * 1.5),
				frame_inactive: dimColourToString(colour, -pref.tabbar * 1.5),
				tab_selected: dimColourToString(colour, -pref.tabSelected * 1.5),
				tab_line: dimColourToString(colour, (-pref.tabSelectedBorder - pref.tabSelected) * 1.5),
				ntp_background: dimColourToString(colour, 0),
				// Toolbar
				toolbar: dimColourToString(colour, -pref.toolbar * 1.5),
				toolbar_top_separator: dimColourToString(colour, (-pref.tabbarBorder - pref.tabbar) * 1.5),
				toolbar_bottom_separator: dimColourToString(colour, (-pref.toolbarBorder - pref.toolbar) * 1.5),
				// URL bar
				toolbar_field: dimColourToString(colour, -pref.toolbarField * 1.5),
				toolbar_field_border: dimColourToString(colour, (-pref.toolbarFieldBorder - pref.toolbarField) * 1.5),
				toolbar_field_focus: dimColourToString(colour, -pref.toolbarFieldOnFocus * 1.5),
				toolbar_field_border_focus: "rgb(130, 180, 245)",
				// Sidebar & popup
				sidebar: dimColourToString(colour, -pref.sidebar * 1.5),
				sidebar_border: dimColourToString(colour, (-pref.sidebar - pref.sidebarBorder) * 1.5),
				popup: dimColourToString(colour, -pref.popup * 1.5),
				popup_border: dimColourToString(colour, (-pref.popup - pref.popupBorder) * 1.5),
				// Static
				tab_background_text: "rgb(30, 30, 30)",
				tab_loading: "rgba(0, 0, 0, 0)",
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
				// More on: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/theme#properties
				color_scheme: "system",
				content_color_scheme: "system",
			},
		};
		browser.theme.update(windowId, theme);
	}
	if (colourScheme === "dark") {
		const theme = {
			colors: {
				// Tabbar & tab
				frame: dimColourToString(colour, pref.tabbar),
				frame_inactive: dimColourToString(colour, pref.tabbar),
				tab_selected: dimColourToString(colour, pref.tabSelected),
				tab_line: dimColourToString(colour, pref.tabSelectedBorder + pref.tabSelected),
				ntp_background: dimColourToString(colour, 0),
				// Toolbar
				toolbar: dimColourToString(colour, pref.toolbar),
				toolbar_top_separator: dimColourToString(colour, pref.tabbarBorder + pref.tabbar),
				toolbar_bottom_separator: dimColourToString(colour, pref.toolbarBorder + pref.toolbar),
				// URL bar
				toolbar_field: dimColourToString(colour, pref.toolbarField),
				toolbar_field_border: dimColourToString(colour, pref.toolbarFieldBorder + pref.toolbarField),
				toolbar_field_focus: dimColourToString(colour, pref.toolbarFieldOnFocus),
				toolbar_field_border_focus: "rgb(70, 118, 160)",
				// Sidebar
				sidebar: dimColourToString(colour, pref.sidebar),
				sidebar_border: dimColourToString(colour, pref.sidebar + pref.sidebarBorder),
				popup: dimColourToString(colour, pref.popup),
				popup_border: dimColourToString(colour, pref.popup + pref.popupBorder),
				// Static
				tab_background_text: "rgb(225, 225, 225)",
				tab_loading: "rgba(0, 0, 0, 0)",
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
				color_scheme: "system",
				content_color_scheme: "system",
			},
		};
		browser.theme.update(windowId, theme);
	}
}

(async () => {
	await initialise();
	onSchemeChanged(update);
	browser.tabs.onUpdated.addListener(update);
	browser.tabs.onActivated.addListener(update);
	browser.tabs.onAttached.addListener(update);
	browser.windows.onFocusChanged.addListener(update);
	browser.browserSettings.overrideContentColorScheme.onChange.addListener(update);
	browser.runtime.onMessage.addListener(handleMessage);
})();
