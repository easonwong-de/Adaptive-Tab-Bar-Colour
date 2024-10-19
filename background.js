/*
 * Definitions of some concepts
 *
 * System colour scheme:
 * The colour scheme of the operating system, usually light or dark.
 *
 * Browser colour scheme / pref.scheme:
 * The "website appearance" settings of Firefox (controlled by ATBC), which can be light, dark, or auto.
 *
 * vars.scheme:
 * The colour scheme derived from both system and browser colour schemes, which can be light or dark.
 * It decides whether the light theme or dark theme is preferred.
 *
 * pref.allowDarkLight:
 * A setting that decides if a light theme is allowed to be used when vars.scheme is dark, or vice versa.
 *
 * theme-color / meta theme colour:
 * A meta tag defined by some websites, usually static.
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
	default_reservedColour,
	reservedColour_aboutPage,
	legacyPrefKey,
	checkVersion,
} from "./shared.js";

import { rgba, dimColour, contrastRatio } from "./colour.js";

// Settings cache: always synced with settings
var pref = {
	scheme: "auto",
	allowDarkLight: false,
	dynamic: true,
	noThemeColour: true,
	tabbar: 0,
	tabSelected: 0.1,
	toolbar: 0,
	toolbarBorderBottom: 0,
	toolbarField: 0.05,
	toolbarFieldOnFocus: 0.05,
	sidebar: 0.05,
	sidebarBorder: 0.05,
	popup: 0.05,
	popupBorder: 0.05,
	minContrast_light: 4.5,
	minContrast_dark: 4.5,
	custom: false,
	homeBackground_light: default_homeBackground_light,
	homeBackground_dark: default_homeBackground_dark,
	fallbackColour_light: default_fallbackColour_light,
	fallbackColour_dark: default_fallbackColour_dark,
	reservedColour: default_reservedColour,
	version: [2, 2],
};

// Variables
var vars = {
	scheme: "light", // only "light" or "dark"
	homeBackground_light: default_homeBackground_light,
	homeBackground_dark: default_homeBackground_dark,
	fallbackColour_light: default_fallbackColour_light,
	fallbackColour_dark: default_fallbackColour_dark,
	reservedColour: default_reservedColour,
};

/**
 * @returns Integrity of pref cache.
 */
function verifyPref() {
	return (
		pref.scheme != null &&
		pref.allowDarkLight != null &&
		pref.dynamic != null &&
		pref.noThemeColour != null &&
		pref.tabbar != null &&
		pref.tabSelected != null &&
		pref.toolbar != null &&
		pref.toolbarBorderBottom != null &&
		pref.toolbarField != null &&
		pref.toolbarFieldOnFocus != null &&
		pref.sidebar != null &&
		pref.sidebarBorder != null &&
		pref.popup != null &&
		pref.popupBorder != null &&
		pref.minContrast_light != null &&
		pref.minContrast_dark != null &&
		pref.custom != null &&
		pref.homeBackground_light != null &&
		pref.homeBackground_dark != null &&
		pref.fallbackColour_light != null &&
		pref.fallbackColour_dark != null &&
		pref.reservedColour != null &&
		pref.version != null
	);
}

/**
 * Sets "vars" values after pref being loaded.
 */
function updateVars() {
	if (pref.custom) {
		vars.homeBackground_light = rgba(pref.homeBackground_light);
		vars.homeBackground_dark = rgba(pref.homeBackground_dark);
		vars.fallbackColour_light = rgba(pref.fallbackColour_light);
		vars.fallbackColour_dark = rgba(pref.fallbackColour_dark);
		vars.reservedColour = pref.reservedColour;
	} else {
		vars.homeBackground_light = rgba(default_homeBackground_light);
		vars.homeBackground_dark = rgba(default_homeBackground_dark);
		vars.fallbackColour_light = rgba(default_fallbackColour_light);
		vars.fallbackColour_dark = rgba(default_fallbackColour_dark);
		vars.reservedColour = default_reservedColour;
	}
	switch (pref.scheme) {
		case "light":
			vars.scheme = "light";
			break;
		case "dark":
			vars.scheme = "dark";
			break;
		case "auto":
			vars.scheme = systemColourScheme();
			break;
	}
}

var adaptive_themes = {
	light: {
		colors: {
			// Tabbar & tab
			frame: "rgb(255, 255, 255)",
			frame_inactive: "rgb(255, 255, 255)",
			tab_selected: "rgba(0, 0, 0, 0.15)",
			ntp_background: "rgb(255, 255, 255)",
			// Toolbar
			toolbar: "rgba(0, 0, 0, 0)",
			toolbar_top_separator: "rgba(0, 0, 0, 0)",
			toolbar_bottom_separator: "rgba(0, 0, 0, 0)",
			// URL bar
			toolbar_field: "rgb(242, 242, 242)",
			toolbar_field_border: "rgba(0, 0, 0, 0)",
			toolbar_field_focus: "rgb(242, 242, 242)",
			toolbar_field_border_focus: "rgb(130, 180, 245)",
			// Sidebar
			sidebar: "rgb(255, 255, 255)",
			sidebar_border: "rgba(0, 0, 0, 0)",
			// Popup
			popup: "rgb(255, 255, 255)",
			popup_border: "rgba(0, 0, 0, 0)",
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
			color_scheme: "light",
			content_color_scheme: "auto",
		},
	},
	dark: {
		colors: {
			// Tabbar & tab
			frame: "rgb(28, 27, 34)",
			frame_inactive: "rgb(28, 27, 34)",
			tab_selected: "rgba(255, 255, 255, 0.15)",
			ntp_background: "rgb(28, 27, 34)",
			// Toolbar
			toolbar: "rgba(0, 0, 0, 0)",
			toolbar_top_separator: "rgba(0, 0, 0, 0)",
			toolbar_bottom_separator: "rgba(255, 255, 255, 0)",
			// URL bar
			toolbar_field: "rgb(39, 38, 45)",
			toolbar_field_border: "rgba(0, 0, 0, 0)",
			toolbar_field_focus: "rgb(39, 38, 45)",
			toolbar_field_border_focus: "rgb(70, 118, 160)",
			// Sidebar
			sidebar: "rgb(28, 27, 34)",
			sidebar_border: "rgba(0, 0, 0, 0)",
			// Popup
			popup: "rgb(28, 27, 34)",
			popup_border: "rgba(0, 0, 0, 0)",
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
			color_scheme: "dark",
			content_color_scheme: "auto",
		},
	},
};

initialise();

/**
 * Initialises the pref and vars.
 * If storedPref.scheme, storedPref.force (legacy), or storedPref.allowDarkLight is missing, opens the option page.
 */
function initialise() {
	browser.storage.local.get((storedPref) => {
		// If the add-on is freshly installed, then the storage will be empty
		let freshInstall = Object.keys(storedPref).length == 0;
		// Version number is recorded starting from v1.3.1, updating from older versions is treated as fresh install
		let noVersionNumber = !("last_version" in storedPref || "version" in storedPref);
		// If the add-on is updated from above v1.3.1, process the existing preferences
		if (!freshInstall || !noVersionNumber) {
			for (let key in storedPref) {
				if (key in pref) pref[key] = storedPref[key];
				else if (key in legacyPrefKey) pref[legacyPrefKey[key]] = storedPref[key];
			}
			// Updating from before v2.2
			if (pref.version < [2, 2]) {
				// Converts "force" to "allowDarkLight"
				pref.allowDarkLight = !pref.allowDarkLight;
				// Converts "system" to "auto"
				if (pref.scheme == "system") pref.scheme = "auto";
			}
			// Updating from before v1.7.5
			// Converts legacy rules to query selector format
			if (pref.version < [1, 7, 5]) {
				for (let domain in pref.reservedColour) {
					let legacyRule = pref.reservedColour[domain];
					if (legacyRule.startsWith("TAG_")) {
						pref.reservedColour[domain] = legacyRule.replace("TAG_", "QS_");
					} else if (legacyRule.startsWith("CLASS_")) {
						pref.reservedColour[domain] = legacyRule.replace("CLASS_", "QS_.");
					} else if (legacyRule.startsWith("ID_")) {
						pref.reservedColour[domain] = legacyRule.replace("ID_", "QS_#");
					} else if (legacyRule.startsWith("NAME_")) {
						pref.reservedColour[domain] = `${legacyRule.replace("NAME_", "QS_[name='")}']`;
					} else if (legacyRule == "") {
						delete pref.reservedColour[domain];
					}
				}
			}
			// Updating from before v1.7.4
			// Clears possible empty reserved colour rules caused by a bug
			if (pref.version < [1, 7, 4]) delete pref.reservedColour[undefined];
			// Updating from before v1.6.4
			// Corrects the dark home page colour, unless the user has set something different
			if (pref.version < [1, 6, 5] && pref.homeBackground_dark.toUpperCase() == "#1C1B22")
				pref.homeBackground_dark = default_homeBackground_dark;
		}
		// If the browser version is below v95, disables allowDarkLight
		if (checkVersion() < 95) pref.allowDarkLight = false;
		setBrowserColourScheme(pref.scheme);
		updateVars();
		update();
		browser.storage.local.set(pref).then(() => {
			// If the add-on is installed for the first time, opens the option page
			if (freshInstall || noVersionNumber) browser.runtime.openOptionsPage();
			return Promise.resolve("Initialisation done");
		});
	});
}

browser.tabs.onUpdated.addListener(update);
browser.tabs.onActivated.addListener(update);
browser.tabs.onAttached.addListener(update);
browser.windows.onFocusChanged.addListener(update);

browser.runtime.onMessage.addListener((message, sender) => {
	switch (message.reason) {
		// When pref is detected corrupted
		case "INIT_REQUEST":
			initialise();
			break;
		// When pref changes
		case "UPDATE_REQUEST":
			loadPrefAndUpdate();
			break;
		// Content script sends a colour
		case "COLOUR_UPDATE":
			sender.tab.active ? setFrameColour(sender.tab.windowId, message.colour) : update();
			break;
	}
});

// Light mode match media, which is supposed to detect the system level colour scheme
// Seems to not work on Firefox Developer Edition
const lightModeDetection = window.matchMedia("(prefers-color-scheme: light)");
if (lightModeDetection)
	// System colour scheme changes
	lightModeDetection.onchange = () => {
		if (pref.scheme == "auto") loadPrefAndUpdate();
	};

/**
 * @returns "light" or "dark" depending on the system's setting.
 * @returns "light" if it cannot be detected.
 */
function systemColourScheme() {
	return lightModeDetection && lightModeDetection.matches ? "light" : "dark";
}

/**
 * Triggers colour change in all windows.
 */
function update() {
	browser.tabs.query({ active: true, status: "complete" }, (tabs) => {
		if (verifyPref()) tabs.forEach(updateEachWindow);
		// If the pref is corrupted, initialises pref
		else initialise().then(() => tabs.forEach(updateEachWindow));
	});
}

/**
 * Updates pref cache and triggers colour change in all windows.
 */
function loadPrefAndUpdate() {
	browser.storage.local.get((storedPref) => {
		pref = storedPref;
		setBrowserColourScheme(pref.scheme);
		updateVars();
		update();
	});
}

/**
 * Converts an URL to a search key for reservedColour.
 * @param {string} url an URL e.g. "about:page/etwas", "etwas://addons.mozilla.org/etwas", "moz-extension://*UUID/etwas".
 * @returns e.g. for about pages: "about:page", for websites: "addons.mozilla.org", for add-on pages "Add-on ID: ATBC@EasonWong".
 */
function getSearchKey(url) {
	if (url.startsWith("about:")) return Promise.resolve(url.split(/\/|\?/)[0]); // e.g. "about:page"
	else if (url.startsWith("moz-extension:")) {
		// Searches for add-on ID
		// Colours for add-on pages are stored with the add-on ID as their keys
		let uuid = url.split(/\/|\?/)[2];
		return new Promise((resolve) => {
			browser.management.getAll().then((addonList) => {
				let foundAddonID = false;
				for (let addon of addonList) {
					if (addon.type != "extension" || !addon.hostPermissions) continue;
					for (let host of addon.hostPermissions) {
						if (!host.startsWith("moz-extension:") || uuid != host.split(/\/|\?/)[2]) continue;
						resolve(`Add-on ID: ${addon.id}`);
						foundAddonID = true;
						break;
					}
					if (foundAddonID) break;
				}
			});
		});
	}
	// In case of a regular website, returns its domain, e.g. "addons.mozilla.org"
	else return Promise.resolve(url.split(/\/|\?/)[2]);
}

/**
 * Updates the colour for a window.
 * @param {tabs.Tab} tab The tab the window is showing.
 */
function updateEachWindow(tab) {
	let url = tab.url;
	let windowId = tab.windowId;
	// Visiting browser's internal files (content script blocked)
	if (url.startsWith("view-source:")) setFrameColour(windowId, "PLAINTEXT");
	// Visiting browser's internal files (content script blocked)
	else if (url.startsWith("chrome:") || url.startsWith("resource:") || url.startsWith("jar:file:")) {
		if (url.endsWith(".txt") || url.endsWith(".css") || url.endsWith(".jsm") || url.endsWith(".js")) setFrameColour(windowId, "PLAINTEXT");
		else if (url.endsWith(".png") || url.endsWith(".jpg")) setFrameColour(windowId, "IMAGEVIEWER");
		else setFrameColour(windowId, "SYSTEM");
	} else {
		// Visiting normal websites, PDF viewer (content script blocked), websites that failed to load, or local files
		// WIP: add support for setting colours for about:pages
		// WIP: add support for regex / wildcard characters
		getSearchKey(url).then((key) => {
			let reversedVarsScheme = vars.scheme == "light" ? "dark" : "light";
			// For preferred scheme there's a reserved colour
			if (reservedColour_aboutPage[vars.scheme][key]) setFrameColour(windowId, rgba(reservedColour_aboutPage[vars.scheme][key]));
			// Site has reserved colour only in the other mode, and it's allowed to change mode
			else if (reservedColour_aboutPage[reversedVarsScheme][key] && pref.allowDarkLight)
				setFrameColour(windowId, rgba(reservedColour_aboutPage[reversedVarsScheme][key]));
			// If changing mode is not allowed
			else if (url.startsWith("about:")) setFrameColour(windowId, "DEFAULT");
			else if (key.startsWith("Add-on ID: ") && vars.reservedColour[key]) setFrameColour(windowId, rgba(vars.reservedColour[key]));
			else if (url.startsWith("moz-extension:")) setFrameColour(windowId, "ADDON");
			else contactTab(tab);
		});
	}
}

/**
 * Sends pref to tab and tests if the content script is responsive. If so, The tab will then send colour back by itself.
 * @param {tabs.Tab} tab the tab to contact.
 */
function contactTab(tab) {
	let url = tab.url;
	let windowId = tab.windowId;
	browser.tabs.sendMessage(
		tab.id,
		{
			reason: "COLOUR_REQUEST",
			dynamic: pref.dynamic,
			noThemeColour: pref.noThemeColour,
			reservedColour: vars.reservedColour,
		},
		(response) => {
			// The colour is successfully returned
			if (response) return null;
			// Viewing an image on data:image (content script is blocked on data:pages)
			else if (url.startsWith("data:image")) setFrameColour(windowId, "IMAGEVIEWER");
			// When viewing a PDF file, Firefox blocks content script
			else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) setFrameColour(windowId, "PDFVIEWER");
			// The page probably failed to load (content script is also blocked on website that failed to load)
			else if (tab.favIconUrl?.startsWith("chrome:")) setFrameColour(windowId, "DEFAULT");
			// When viewing plain text online, Firefox blocks content script
			// In this case, the tab title is the same as the URL
			else if (url.match(new RegExp(`https?:\/\/${tab.title}$`))) setFrameColour(windowId, "PLAINTEXT");
			// Uses fallback colour
			else setFrameColour(windowId, "FALLBACK");
		}
	);
}

function getSuitableColourScheme(colour) {
	let eligibility_dark = contrastRatio(colour, rgba([255, 255, 255, 1])) > pref.minContrast_dark;
	let eligibility_light = contrastRatio(colour, rgba([0, 0, 0, 1])) > pref.minContrast_light;
	if (vars.scheme == "light") {
		if (eligibility_light) return "light";
		if (pref.allowDarkLight && eligibility_dark) return "dark";
	} else {
		if (eligibility_dark) return "dark";
		if (pref.allowDarkLight && eligibility_light) return "light";
	}
	return "fallback";
}

/**
 * Changes tab bar to the appointed colour. If the colour is not eligible, uses fallback colour.
 * @param {number} windowId The ID of the window.
 * @param {object | string} colour The colour to change to (in rgb object) or a command string. If colour is empty, rolls back to default colour. Command strings are: "HOME", "FALLBACK", "IMAGEVIEWER", "PLAINTEXT", "SYSTEM", "ADDON", "PDFVIEWER", and "DEFAULT".
 */
function setFrameColour(windowId, colour) {
	switch (colour) {
		case "HOME":
			// Home page and new tab
			if (darkMode) {
				changeThemePara(vars.homeBackground_dark, "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(vars.homeBackground_light, "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "FALLBACK":
			// Fallback colour
			if (darkMode) {
				changeThemePara(vars.fallbackColour_dark, "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(vars.fallbackColour_light, "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "IMAGEVIEWER":
			// Image viewer
			if (darkMode) {
				changeThemePara(rgba([33, 33, 33, 1]), "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				// Using fallback colour here
				changeThemePara(vars.fallback_light, "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "PLAINTEXT":
			// Plain text viewer
			if (darkMode) {
				changeThemePara(rgba([50, 50, 50, 1]), "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(rgba([236, 236, 236, 1]), "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "SYSTEM":
			// Internal page
			if (darkMode) {
				changeThemePara(rgba([30, 30, 30, 1]), "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(rgba([255, 255, 255, 1]), "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "ADDON":
			// Add-on page
			if (darkMode) {
				changeThemePara(rgba([50, 50, 50, 1]), "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(rgba([236, 236, 236, 1]), "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "PDFVIEWER":
			// PDF viewer
			if (darkMode) {
				changeThemePara(rgba([56, 56, 61, 1]), "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(rgba([249, 249, 250, 1]), "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "DEFAULT":
			// Reset to default colour
			if (darkMode) {
				changeThemePara(rgba([28, 27, 34, 1]), "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(rgba([255, 255, 255, 1]), "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		default:
			if (
				!pref.allowDarkLight ||
				(pref.allowDarkLight && vars.scheme == "dark" && darkMode) ||
				(pref.allowDarkLight && vars.scheme == "light" && !darkMode)
			) {
				/* // Adaptive colouring based on contrast between the colour and the base colour
				let baseColour = vars.scheme == "dark" ? rgba(default_homeBackground_dark) : rgba(default_homeBackground_light);
				// Compute the contrast between the colour and the base colour
				let contrast = contrastFactor(colour, baseColour);
				// Adjust the overlay opacity based on the contrast
				colour.a = contrastAdjustedOverlayOpacity(contrast, pref.overlay_opacity_factor, pref.overlay_opacity_threshold);
				// Compute the overlay colour
				let result = overlayColour(colour, baseColour); */
				if (darkMode) {
					changeThemePara(colour, "dark");
					applyTheme(windowId, adaptive_themes["dark"]);
				} else {
					changeThemePara(colour, "light");
					applyTheme(windowId, adaptive_themes["light"]);
				}
			} else if (!colour || pref.allowDarkLight) {
				// Force colouring (use fallback colour)
				if (vars.scheme == "dark") {
					changeThemePara(vars.fallback_dark, "dark");
					applyTheme(windowId, adaptive_themes["dark"]);
				} else {
					changeThemePara(vars.fallback_light, "light");
					applyTheme(windowId, adaptive_themes["light"]);
				}
			}
			break;
	}
}

/**
 * Adjusts the parameters in adaptive_themes.
 * @param {object} colour Colour of the frame.
 * @param {string} scheme Colour scheme, "dark", "light", or "darknoise".
 */
// WIP: consider using HSL format for quicker transformation
function changeThemePara(colour, scheme) {
	let frameColour,
		tabSelectedColour,
		ntpColour,
		toolbarColour,
		toolbarBottomSeparatorColour,
		toolbarFieldColour,
		toolbarFieldFocusColour,
		sidebarColour,
		sidebarBorderColour,
		popupColour,
		popupBorderColour;
	switch (scheme) {
		case "dark":
			frameColour = dimColour(colour, pref.tabbar);
			tabSelectedColour = dimColour(colour, pref.tabSelected);
			ntpColour = dimColour(colour, 0);
			toolbarColour = dimColour(colour, pref.toolbar);
			toolbarBottomSeparatorColour = dimColour(colour, pref.toolbarBorderBottom + pref.toolbar);
			toolbarFieldColour = dimColour(colour, pref.toolbarField);
			toolbarFieldFocusColour = dimColour(colour, pref.toolbarFieldOnFocus);
			sidebarColour = dimColour(colour, pref.sidebar);
			sidebarBorderColour = dimColour(colour, pref.sidebar + pref.sidebarBorder);
			popupColour = dimColour(colour, pref.popup);
			popupBorderColour = dimColour(colour, pref.popup + pref.popupBorder);
			break;
		case "light":
			frameColour = dimColour(colour, -pref.tabbar * 1.5);
			tabSelectedColour = dimColour(colour, -pref.tabSelected * 1.5);
			ntpColour = dimColour(colour, 0);
			toolbarColour = dimColour(colour, -pref.toolbar * 1.5);
			toolbarBottomSeparatorColour = dimColour(colour, (-pref.toolbarBorderBottom - pref.toolbar) * 1.5);
			toolbarFieldColour = dimColour(colour, -pref.toolbarField * 1.5);
			toolbarFieldFocusColour = dimColour(colour, -pref.toolbarFieldOnFocus * 1.5);
			sidebarColour = dimColour(colour, -pref.sidebar * 1.5);
			sidebarBorderColour = dimColour(colour, (-pref.sidebar - pref.sidebarBorder) * 1.5);
			popupColour = dimColour(colour, -pref.popup * 1.5);
			popupBorderColour = dimColour(colour, (-pref.popup - pref.popupBorder) * 1.5);
			break;
	}
	adaptive_themes[scheme]["colors"]["frame"] = frameColour;
	adaptive_themes[scheme]["colors"]["frame_inactive"] = frameColour;
	adaptive_themes[scheme]["colors"]["tab_selected"] = tabSelectedColour;
	adaptive_themes[scheme]["colors"]["ntp_background"] = ntpColour;
	adaptive_themes[scheme]["colors"]["toolbar"] = toolbarColour;
	adaptive_themes[scheme]["colors"]["toolbar_bottom_separator"] = toolbarBottomSeparatorColour;
	adaptive_themes[scheme]["colors"]["toolbar_field"] = toolbarFieldColour;
	adaptive_themes[scheme]["colors"]["toolbar_field_focus"] = toolbarFieldFocusColour;
	adaptive_themes[scheme]["colors"]["sidebar"] = sidebarColour;
	adaptive_themes[scheme]["colors"]["sidebar_border"] = sidebarBorderColour;
	adaptive_themes[scheme]["colors"]["popup"] = popupColour;
	adaptive_themes[scheme]["colors"]["popup_border"] = popupBorderColour;
}

/**
 * Applies theme to certain window.
 * @param {number} windowId The ID of the target window.
 * @param {object} theme The theme to apply.
 */
function applyTheme(windowId, theme) {
	browser.theme.update(windowId, theme);
}

/**
 * Overrides content colour scheme.
 * @param {string} scheme "light", "dark", or "auto". Converts "auto" to "system" if the browser's version sits below v106.
 */
function setBrowserColourScheme(scheme) {
	let version = checkVersion();
	if (version >= 95)
		browser.browserSettings.overrideContentColorScheme.set({
			value: scheme == "auto" && version < 106 ? "system" : scheme,
		});
}
