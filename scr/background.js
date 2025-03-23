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

import preference from "./preference.js";
import { aboutPageColour, restrictedSiteColour } from "./default_values.js";
import { rgba, dimColourString, contrastCorrection } from "./colour.js";
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
	/** `light` or `dark` */
	scheme: "light",
	/** windowId: { colour?, reason, additionalInfo?, corrected? } */
	info: {},
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	async update() {
		this.scheme = await getCurrentScheme();
		this.info = {};
	},
};

/**
 * Triggers colour change in all windows.
 */
async function update() {
	if (!pref.valid()) await initialise();
	const activeTabs = await browser.tabs.query({ active: true, status: "complete" });
	await current.update();
	activeTabs.forEach(updateTab);
}

/**
 * Initialises `pref` and `current`.
 */
async function initialise() {
	await pref.load();
	await pref.normalise();
	await pref.save();
	await update();
}

/**
 * Updates `pref` and triggers colour change in all windows.
 */
async function prefUpdate() {
	await pref.load();
	await update();
}

/**
 * Handles incoming messages based on their `header`.
 *
 * @param {object} message The message object containing the `header` and any additional data.
 * @param {runtime.MessageSender} sender The message sender.
 */
async function handleMessage(message, sender) {
	const tab = sender.tab;
	const header = message.header;
	switch (header) {
		case "INIT_REQUEST":
			await initialise();
			break;
		case "PREF_CHANGED":
			await prefUpdate();
			break;
		case "SCRIPT_LOADED":
			updateTab(tab);
			break;
		case "UPDATE_COLOUR":
			current.info[tab.windowId] = message.response;
			setFrameColour(tab, message.response.colour);
			break;
		case "SCHEME_REQUEST":
			return await getCurrentScheme();
		case "INFO_REQUEST":
			return current.info[message.windowId];
		default:
			update();
	}
	return true;
}

/**
 * Updates the colour for a tab.
 *
 * @param {tabs.Tab} tab The tab.
 */
async function updateTab(tab) {
	const windowId = tab.windowId;
	const tabColour = await getTabColour(tab);
	current.info[windowId] = tabColour;
	setFrameColour(tab, tabColour.colour);
}

/**
 * Determines the colour for a tab.
 *
 * If an `URL:COLOUR` policy is set, returns the colour value.
 *
 * Otherwise, sends a message to the tab to get the colour.
 *
 * If the message fails, returns the result of `getProtectedPageColour`.
 *
 * Returns the colour as an RGBA object or a colour code.
 *
 * @param {tabs.Tab} tab The tab.
 */
async function getTabColour(tab) {
	const policy = pref.getPolicy(tab.url);
	if (policy?.headerType === "URL" && policy?.type === "COLOUR") {
		return { colour: rgba(policy.value), reason: "COLOUR_SPECIFIED" };
	} else {
		try {
			return await browser.tabs.sendMessage(tab.id, {
				dynamic: pref.dynamic,
				noThemeColour: pref.noThemeColour,
				policy: policy,
			});
		} catch (error) {
			return await getProtectedPageColour(tab);
		}
	}
}

/**
 * Determines the colour for a protected page.
 *
 * @param {tabs.Tab} tab The tab.
 */
async function getProtectedPageColour(tab) {
	const url = new URL(tab.url);
	if (["about:firefoxview", "about:home", "about:newtab"].some((href) => url.href.startsWith(href))) {
		return { colour: "HOME", reason: "HOME_PAGE" };
	} else if (url.href === "about:blank" && tab.title.startsWith("about:") && tab.title.endsWith("profile")) {
		return getAboutPageColour(tab.title.slice(6));
	} else if (url.protocol === "about:") {
		return getAboutPageColour(url.pathname);
	} else if (url.protocol === "view-source:") {
		return { colour: "PLAINTEXT", reason: "PROTECTED_PAGE" };
	} else if (["chrome:", "resource:", "jar:file:"].includes(url.protocol)) {
		if ([".txt", ".css", ".jsm", ".js"].some((extention) => url.href.endsWith(extention))) {
			return { colour: "PLAINTEXT", reason: "PROTECTED_PAGE" };
		} else if ([".png", ".jpg"].some((extention) => url.href.endsWith(extention))) {
			return { colour: "IMAGEVIEWER", reason: "PROTECTED_PAGE" };
		} else {
			return { colour: "SYSTEM", reason: "PROTECTED_PAGE" };
		}
	} else if (url.protocol === "moz-extension:") {
		return await getAddonPageColour(url.href);
	} else if (url.hostname in restrictedSiteColour) {
		return getRestrictedSiteColour(url.hostname);
	} else if (url.href.startsWith("data:image")) {
		return { colour: "IMAGEVIEWER", reason: "IMAGE_VIEWER" };
	} else if (url.href.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
		return { colour: "PDFVIEWER", reason: "PDF_VIEWER" };
	} else if (tab.favIconUrl?.startsWith("chrome:")) {
		return { colour: "DEFAULT", reason: "PROTECTED_PAGE" };
	} else if (url.href.match(new RegExp(`https?:\/\/${tab.title}$`))) {
		return { colour: "PLAINTEXT", reason: "TEXT_VIEWER" };
	} else {
		return { colour: "FALLBACK", reason: "FALLBACK_COLOUR" };
	}
}

/**
 * @param {string} pathname
 */
function getAboutPageColour(pathname) {
	if (aboutPageColour[pathname]?.[current.scheme]) {
		return { colour: rgba(aboutPageColour[pathname][current.scheme]), reason: "PROTECTED_PAGE" };
	} else if (aboutPageColour[pathname]?.[current.reversedScheme]) {
		return { colour: rgba(aboutPageColour[pathname][current.reversedScheme]), reason: "PROTECTED_PAGE" };
	} else {
		return { colour: "DEFAULT", reason: "PROTECTED_PAGE" };
	}
}

/**
 * @param {string} hostname
 */
function getRestrictedSiteColour(hostname) {
	if (restrictedSiteColour[hostname]?.[current.scheme]) {
		return { colour: rgba(restrictedSiteColour[hostname][current.scheme]), reason: "PROTECTED_PAGE" };
	} else if (restrictedSiteColour[hostname]?.[current.reversedScheme]) {
		return { colour: rgba(restrictedSiteColour[hostname][current.reversedScheme]), reason: "PROTECTED_PAGE" };
	} else {
		return { colour: "FALLBACK", reason: "PROTECTED_PAGE" };
	}
}

/**
 * @param {string} url
 */
async function getAddonPageColour(url) {
	const uuid = url.split(/\/|\?/)[2];
	const addonList = await browser.management.getAll();
	let addonId = null;
	for (const addon of addonList) {
		if (addon.type !== "extension" || !addon.hostPermissions) continue;
		if (addonId) break;
		for (const host of addon.hostPermissions) {
			if (host.startsWith("moz-extension:") && uuid === host.split(/\/|\?/)[2]) {
				addonId = addon.id;
				break;
			}
		}
	}
	if (!addonId) return { colour: "ADDON", reason: "ADDON" };
	const policy = pref.getPolicy(addonId, "ADDON_ID");
	return policy
		? { colour: rgba(policy.value), reason: "ADDON", additionalInfo: addonId }
		: { colour: "ADDON", reason: "ADDON", additionalInfo: addonId };
}

/**
 * Applies given colour to the browser frame of a tab.
 *
 * Colour will be adjusted until the contrast ratio is adequate, and it will be stored in `current.info`.
 *
 * @param {tabs.Tab} tab The tab in a window, whose frame is being changed.
 * @param {object | string} colour An RGBA object or a colour code.
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
			current.info[windowId].corrected = correctionResult.corrected;
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
		current.info[windowId].corrected = correctionResult.corrected;
	}
}

/**
 * Constructs a theme and applies it to a given window.
 *
 * @param {number} windowId The ID of the window.
 * @param {object} colour Colour of the frame, in RGBA object.
 * @param {string} colourScheme `light` or `dark`.
 */
function applyTheme(windowId, colour, colourScheme) {
	if (colourScheme === "light") {
		const theme = {
			colors: {
				// active
				button_background_active: dimColourString(colour, -1.5 * pref.tabSelected),
				frame: dimColourString(colour, -1.5 * pref.tabbar),
				frame_inactive: dimColourString(colour, -1.5 * pref.tabbar),
				ntp_background: dimColourString(colourCode.HOME[current.scheme], 0),
				popup: dimColourString(colour, -1.5 * pref.popup),
				popup_border: dimColourString(colour, -1.5 * (pref.popup + pref.popupBorder)),
				sidebar: dimColourString(colour, -1.5 * pref.sidebar),
				sidebar_border: dimColourString(colour, -1.5 * (pref.sidebar + pref.sidebarBorder)),
				tab_line: dimColourString(colour, -1.5 * (pref.tabSelectedBorder + pref.tabSelected)),
				tab_selected: dimColourString(colour, -1.5 * pref.tabSelected),
				toolbar: dimColourString(colour, -1.5 * pref.toolbar),
				toolbar_bottom_separator: dimColourString(colour, -1.5 * (pref.toolbarBorder + pref.toolbar)),
				toolbar_field: dimColourString(colour, -1.5 * pref.toolbarField),
				toolbar_field_border: dimColourString(colour, -1.5 * (pref.toolbarFieldBorder + pref.toolbarField)),
				toolbar_field_focus: dimColourString(colour, -1.5 * pref.toolbarFieldOnFocus),
				toolbar_top_separator: dimColourString(colour, -1.5 * (pref.tabbarBorder + pref.tabbar)),
				// static
				icons: "rgb(0, 0, 0)",
				ntp_text: "rgb(0, 0, 0)",
				popup_text: "rgb(0, 0, 0)",
				sidebar_text: "rgb(0, 0, 0)",
				tab_background_text: "rgb(0, 0, 0)",
				tab_text: "rgb(0, 0, 0)",
				toolbar_field_text: "rgb(0, 0, 0)",
				toolbar_text: "rgb(0, 0, 0)",
				button_background_hover: "rgba(0, 0, 0, 0.11)",
				toolbar_vertical_separator: "rgba(0, 0, 0, 0.11)",
				toolbar_field_border_focus: null,
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
				// active
				button_background_active: dimColourString(colour, pref.tabSelected),
				frame: dimColourString(colour, pref.tabbar),
				frame_inactive: dimColourString(colour, pref.tabbar),
				ntp_background: dimColourString(colourCode.HOME[current.scheme], 0),
				popup: dimColourString(colour, pref.popup),
				popup_border: dimColourString(colour, pref.popup + pref.popupBorder),
				sidebar: dimColourString(colour, pref.sidebar),
				sidebar_border: dimColourString(colour, pref.sidebar + pref.sidebarBorder),
				tab_line: dimColourString(colour, pref.tabSelectedBorder + pref.tabSelected),
				tab_selected: dimColourString(colour, pref.tabSelected),
				toolbar: dimColourString(colour, pref.toolbar),
				toolbar_bottom_separator: dimColourString(colour, pref.toolbarBorder + pref.toolbar),
				toolbar_field: dimColourString(colour, pref.toolbarField),
				toolbar_field_border: dimColourString(colour, pref.toolbarFieldBorder + pref.toolbarField),
				toolbar_field_focus: dimColourString(colour, pref.toolbarFieldOnFocus),
				toolbar_top_separator: dimColourString(colour, pref.tabbarBorder + pref.tabbar),
				// static
				icons: "rgb(255, 255, 255)",
				ntp_text: "rgb(255, 255, 255)",
				popup_text: "rgb(255, 255, 255)",
				sidebar_text: "rgb(255, 255, 255)",
				tab_background_text: "rgb(255, 255, 255)",
				tab_text: "rgb(255, 255, 255)",
				toolbar_field_text: "rgb(255, 255, 255)",
				toolbar_text: "rgb(255, 255, 255)",
				button_background_hover: "rgba(255, 255, 255, 0.11)",
				toolbar_vertical_separator: "rgba(255, 255, 255, 0.11)",
				toolbar_field_border_focus: null,
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
