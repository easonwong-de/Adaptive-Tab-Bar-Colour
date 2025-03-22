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

import { aboutPageColour, restrictedSiteColour } from "./default_values.js";
import preference from "./preference.js";
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
	/** windowId: { reason, additionalInfo, corrected } */
	windowInfo: {},
	get reversedScheme() {
		return this.scheme === "light" ? "dark" : "light";
	},
	async update() {
		this.scheme = await getCurrentScheme();
		this.windowInfo = {};
	},
};

/**
 * Initialises the pref and current.
 */
async function initialise() {
	await pref.load();
	await pref.normalise();
	await pref.save();
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
		case "INFO_REQUEST":
			return current.windowInfo[message.windowId];
		default:
			return update();
	}
}

/**
 * Updates the colour for an active tab of a window.
 *
 * @param {tabs.Tab} tab The active tab.
 */
async function updateTab(tab) {
	const url = new URL(tab.url);
	const policy = pref.getPolicy(url);
	if (policy?.type === "COLOUR") {
		setFrameColour(tab, policy.value, "COLOUR_SPECIFIED");
	} else {
		setFrameColour(...(await getProtectedPageColour(tab, url)));
	}
}

async function getProtectedPageColour(tab, url) {
	if (url.protocol === "view-source:") {
		setFrameColour(tab, "PLAINTEXT", "TEXT_VIEWER");
	} else if (url.protocol === "chrome:" || url.protocol === "resource:" || url.protocol === "jar:file:") {
		if (
			url.href.endsWith(".txt") ||
			url.href.endsWith(".css") ||
			url.href.endsWith(".jsm") ||
			url.href.endsWith(".js")
		) {
			setFrameColour(tab, "PLAINTEXT", "TEXT_VIEWER");
		} else if (url.href.endsWith(".png") || url.href.endsWith(".jpg")) {
			setFrameColour(tab, "IMAGEVIEWER");
		} else {
			setFrameColour(tab, "SYSTEM");
		}
	} else if (url.protocol === "about:") {
		setFrameColour(tab, getAboutPageColour(url.pathname));
	} else if (url.hostname in restrictedSiteColour) {
		setFrameColour(tab, getRestrictedSiteColour(url.hostname));
	} else if (url.protocol === "moz-extension:") {
		setFrameColour(tab, await getAddonPageColour(url.href));
	} else {
		// To-do: unify site lists for about / protected pages with those for normal web pages
		setFrameColour(tab, await getWebPageColour(tab));
	}
}

/**
 * @param {string} pathname
 */
function getAboutPageColour(pathname) {
	if (aboutPageColour[pathname]?.[current.scheme]) {
		return rgba(aboutPageColour[pathname][current.scheme]);
	} else if (aboutPageColour[pathname]?.[current.reversedScheme]) {
		return rgba(aboutPageColour[pathname][current.reversedScheme]);
	} else {
		return "DEFAULT";
	}
}

/**
 * @param {string} hostname
 */
function getRestrictedSiteColour(hostname) {
	if (restrictedSiteColour[hostname]?.[current.scheme]) {
		return rgba(restrictedSiteColour[hostname][current.scheme]);
	} else if (restrictedSiteColour[hostname]?.[current.reversedScheme]) {
		return rgba(restrictedSiteColour[hostname][current.reversedScheme]);
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
async function getWebPageColour(tab, policy = undefined) {
	const url = tab.url;
	try {
		const response = await browser.tabs.sendMessage(tab.id, {
			header: "COLOUR_REQUEST",
			conf: {
				dynamic: pref.dynamic,
				noThemeColour: pref.noThemeColour,
				policy: policy,
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
			current.windowInfo[windowId].corrected = correctionResult.corrected;
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
		current.windowInfo[windowId].corrected = correctionResult.corrected;
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
				ntp_card_background: "rgba(0, 0, 0, 0.11)",
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
		console.log(dimColourString(colour, pref.toolbarField));

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
				ntp_card_background: "rgba(255, 255, 255, 0.11)",
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
