import {
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_reservedColour_webPage,
	reservedColour_aboutPage,
	legacyPrefKey,
	checkVersion,
} from "./shared.js";

import {
	rgba,
	dimColour,
	/* contrastFactor,
	contrastAdjustedOverlayOpacity,
	overlayColour, */
} from "./colour.js";

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
	custom: false,
	homeBackground_light: default_homeBackground_light,
	homeBackground_dark: default_homeBackground_dark,
	fallbackColour_light: default_fallbackColour_light,
	fallbackColour_dark: default_fallbackColour_dark,
	reservedColour_webPage: default_reservedColour_webPage,
	version: [2, 2],
};

// Variables
var vars = {
	scheme: "light", // "light" or "dark"
	homeBackground_light: default_homeBackground_light,
	homeBackground_dark: default_homeBackground_dark,
	fallbackColour_light: default_fallbackColour_light,
	fallbackColour_dark: default_fallbackColour_dark,
	reservedColour_webPage: default_reservedColour_webPage,
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
		pref.custom != null &&
		pref.homeBackground_light != null &&
		pref.homeBackground_dark != null &&
		pref.fallbackColour_light != null &&
		pref.fallbackColour_dark != null &&
		pref.reservedColour_webPage != null &&
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
		vars.reservedColour_webPage = pref.reservedColour_webPage;
	} else {
		vars.homeBackground_light = rgba(default_homeBackground_light);
		vars.homeBackground_dark = rgba(default_homeBackground_dark);
		vars.fallbackColour_light = rgba(default_fallbackColour_light);
		vars.fallbackColour_dark = rgba(default_fallbackColour_dark);
		vars.reservedColour_webPage = default_reservedColour_webPage;
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
 * Initialise the script.
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
				if (pref.scheme === "system") pref.scheme = "auto";
			}
			// Updating from before v1.7.5
			// Converts legacy rules to query selector format
			if (pref.version <= [1, 7, 5]) {
				for (let domain in pref.reservedColour_webPage) {
					let legacyRule = pref.reservedColour_webPage[domain];
					if (legacyRule.startsWith("TAG_")) {
						pref.reservedColour_webPage[domain] = legacyRule.replace("TAG_", "QS_");
					} else if (legacyRule.startsWith("CLASS_")) {
						pref.reservedColour_webPage[domain] = legacyRule.replace("CLASS_", "QS_.");
					} else if (legacyRule.startsWith("ID_")) {
						pref.reservedColour_webPage[domain] = legacyRule.replace("ID_", "QS_#");
					} else if (legacyRule.startsWith("NAME_")) {
						pref.reservedColour_webPage[domain] = `${legacyRule.replace("NAME_", "QS_[name='")}']`;
					} else if (legacyRule === "") {
						delete pref.reservedColour_webPage[domain];
					}
				}
			}
			// Updating from before v1.7.4
			// Clears possible empty reserved colour rules caused by a bug
			if (pref.version < [1, 7, 4]) delete pref.reservedColour_webPage[undefined];
			// Updating from before v1.6.4
			// Corrects the dark home page colour, unless the user has set something different
			if (pref.version < [1, 6, 5] && pref.homeBackground_dark.toUpperCase() === "#1C1B22")
				pref.homeBackground_dark = default_homeBackground_dark;
		}
		// If the brouser version is below v95, disables allowDarkLight
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

// When new tab is opened / reloaded
browser.tabs.onUpdated.addListener(update);
// When switching tabs
browser.tabs.onActivated.addListener(update);
// When a tab is attatched to another window
browser.tabs.onAttached.addListener(update);
// When a new window is opened
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
 * Updates the colour for a window.
 * @param {tabs.Tab} tab The tab the window is showing.
 */
function updateEachWindow(tab) {
	let url = tab.url;
	let windowId = tab.windowId;
	if (url.startsWith("view-source:")) {
		// Visiting brouser's internal files (content script blocked)
		setFrameColour(windowId, "PLAINTEXT");
	} else if (url.startsWith("chrome:") || url.startsWith("resource:") || url.startsWith("jar:file:")) {
		// Visiting brouser's internal files (content script blocked)
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
		getSearchKey(url).then((key) => {
			let reversedVarsScheme = vars.scheme == "light" ? "dark" : "light";
			if (reservedColour_aboutPage[vars.scheme][key]) {
				// For prefered scheme there's a reserved colour
				setFrameColour(windowId, rgba(reservedColour_aboutPage[vars.scheme][key]), vars.scheme == "dark");
			} else if (reservedColour_aboutPage[reversedVarsScheme][key]) {
				// Site has reserved colour in the other mode
				setFrameColour(windowId, rgba(reservedColour_aboutPage[reversedVarsScheme][key]), reversedVarsScheme == "dark");
			} else if (url.startsWith("about:")) {
				setFrameColour(windowId, "DEFAULT");
			} else if (key.startsWith("Add-on ID: ") && vars.reservedColour_webPage[key]) {
				let frameColour = rgba(vars.reservedColour_webPage[key]);
				setFrameColour(windowId, frameColour);
			} else if (url.startsWith("moz-extension:")) {
				setFrameColour(windowId, "ADDON");
			} else {
				// Sends pref to content script and tests if the script is responsive
				// The content script sends colour back by themselves
				browser.tabs.sendMessage(
					tab.id,
					{
						reason: "COLOUR_REQUEST",
						dynamic: pref.dynamic,
						noThemeColour: pref.noThemeColour,
						reservedColor_webPage: vars.reservedColour_webPage,
					},
					(response) => {
						if (response) {
							// The colour is successfully returned
							return null;
						} else if (url.startsWith("data:image")) {
							// Content script is blocked on data:pages
							// Viewing an image on data:image
							console.log(url + "\nMight be image viewer.");
							setFrameColour(windowId, "IMAGEVIEWER");
						} else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
							// When viewing a pdf file, Firefox blocks content script
							console.log(url + "\nMight be pdf viewer.");
							setFrameColour(windowId, "PDFVIEWER");
						} else if (tab.favIconUrl && tab.favIconUrl.startsWith("chrome:")) {
							// The page probably failed to load
							// Content script is also blocked on website that failed to load
							console.log(url + "\nTab failed to load.");
							setFrameColour(windowId, "DEFAULT");
						} else if (url.endsWith("http://" + tab.title) || url.endsWith("https://" + tab.title)) {
							// When viewing plain text online, Firefox blocks content script
							// In this case, the tab title is the same as the URL
							console.log(url + "\nMight be plain text viewer.");
							setFrameColour(windowId, "PLAINTEXT");
						} else {
							console.error(url + "\nNo connection to content script.");
							setFrameColour(windowId, "FALLBACK");
						}
					}
				);
			}
		});
	}
}

/**
 * Gets the search key for reservedColour (_webPage).
 * @param {string} url an URL e.g. "about:page/etwas", "etwas://addons.mozilla.org/etwas", "moz-extension://*UUID/etwas".
 * @returns e.g. for about pages: "about:page", for websites: "addons.mozilla.org", for add-on pages "Add-on ID: ATBC@EasonWong".
 */
function getSearchKey(url) {
	if (url.startsWith("about:")) {
		return Promise.resolve(url.split(/\/|\?/)[0]); // e.g. "about:page"
	} else if (url.startsWith("moz-extension:")) {
		// Searches for add-on ID
		// Colours for add-on pages are stored with the add-on ID as their keys
		let uuid = url.split(/\/|\?/)[2];
		return new Promise((resolve) => {
			browser.management.getAll().then((addonList) => {
				let breakLoop = false;
				for (let addon of addonList) {
					if (addon.type === "extension" && addon.hostPermissions) {
						for (let host of addon.hostPermissions) {
							if (host.startsWith("moz-extension:") && uuid === host.split(/\/|\?/)[2]) {
								resolve(`Add-on ID: ${addon.id}`);
								breakLoop = true;
								break;
							}
						}
					}
					if (breakLoop) break;
				}
			});
		});
	} else {
		// In case of a regular website, returns its domain, e.g. "addons.mozilla.org"
		return Promise.resolve(url.split(/\/|\?/)[2]);
	}
}

/**
 * Changes tab bar to the appointed colour (with windowId).
 *
 * allowDarkLight: true => normal;
 *
 * allowDarkLight: false, scheme: dark, darkMode: true => normal;
 *
 * allowDarkLight: false, scheme: light, darkMode: false => normal;
 *
 * allowDarkLight: false, scheme: dark, darkMode: false => dark;
 *
 * allowDarkLight: false, scheme: light, darkMode: true => light;
 *
 * if colour is empty, then roll back to default colour.
 *
 * @param {number} windowId The ID of the window.
 * @param {object | string} colour The colour to change to (in rgb object) or a command string.
 * Command strings are: "HOME", "FALLBACK", "IMAGEVIEWER", "PLAINTEXT", "SYSTEM", "ADDON", "PDFVIEWER", and "DEFAULT"
 * @param {boolean} darkMode Decides text colour. Leaves "null" to let add-on prefs decide.
 */
function setFrameColour(windowId, colour, darkMode) {
	// "darkMode" being null means the colour is not light or dark. If so, set "darkMode" following the settings
	// "darkMode" decides the text colour
	if (darkMode == null) darkMode = vars.scheme === "dark";
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
 * @param {string} scheme "light", "dark", or "auto". Converts "auto" to "system" if the brouser's version sits below v106.
 */
function setBrowserColourScheme(scheme) {
	let version = checkVersion();
	if (version >= 95)
		browser.browserSettings.overrideContentColorScheme.set({
			value: scheme === "auto" && version < 106 ? "system" : scheme,
		});
}
