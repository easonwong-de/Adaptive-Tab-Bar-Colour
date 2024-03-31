import {
	default_home_light,
	default_home_dark,
	default_fallback_light,
	default_fallback_dark,
	default_reservedColour_cs,
	reservedColour_aboutPage,
	checkVersion,
} from "./shared.js";
import { rgba, dimColour, contrastFactor, contrastAdjustedOverlayOpacity, overlayColour } from "./colour.js";

// Settings cache: always synced with settings page (followed by handles in storage)
var pref_scheme; // scheme
var pref_allow_dark_light; // force
var pref_dynamic; // dynamic
var pref_no_theme_colour; // no_theme_color
var pref_overlay_opacity_factor; // overlay_opacity_factor
var pref_overlay_opacity_threshold; // overlay_opacity_threshold
var pref_tabbar; // tabbar_color
var pref_tab_selected; // tab_selected_color
var pref_toolbar; // toolbar_color
var pref_toolbar_border_bottom; // separator_opacity
var pref_toolbar_field; // toolbar_field_color
var pref_toolbar_field_focus; // toolbar_field_focus_color
var pref_sidebar; // sidebar_color
var pref_sidebar_border; // sidebar_border_color
var pref_popup; // popup_color
var pref_popup_border; // popup_border_color
var pref_custom; // custom
var pref_home_light; // light_color
var pref_home_dark; // dark_color
var pref_fallback_light; // light_fallback_color
var pref_fallback_dark; // dark_fallback_color
var pref_reservedColour_cs; // reservedColor_cs
var pref_last_version; // last_version

// Controlled by prefs
var current_scheme;
var current_home_light;
var current_home_dark;
var current_fallback_light;
var current_fallback_dark;
var current_reservedColour_cs;

/**
 * Caches pref into local variables.
 */
function cachePref(pref) {
	pref_scheme = pref.scheme;
	pref_allow_dark_light = pref.force;
	pref_dynamic = pref.dynamic;
	pref_no_theme_colour = pref.no_theme_color;
	pref_overlay_opacity_factor = pref.overlay_opacity_factor;
	pref_overlay_opacity_threshold = pref.overlay_opacity_threshold;
	pref_tabbar = pref.tabbar_color;
	pref_tab_selected = pref.tab_selected_color;
	pref_toolbar = pref.toolbar_color;
	pref_toolbar_border_bottom = pref.separator_opacity;
	pref_toolbar_field = pref.toolbar_field_color;
	pref_toolbar_field_focus = pref.toolbar_field_focus_color;
	pref_sidebar = pref.sidebar_color;
	pref_sidebar_border = pref.sidebar_border_color;
	pref_popup = pref.popup_color;
	pref_popup_border = pref.popup_border_color;
	pref_custom = pref.custom;
	pref_home_light = pref.light_color;
	pref_home_dark = pref.dark_color;
	pref_fallback_light = pref.light_fallback_color;
	pref_fallback_dark = pref.dark_fallback_color;
	pref_reservedColour_cs = pref.reservedColor_cs;
	pref_last_version = pref.last_version;
}

/**
 * @returns Integrity of pref cache.
 */
function verifyPref() {
	return (
		pref_scheme != null &&
		pref_allow_dark_light != null &&
		pref_dynamic != null &&
		pref_no_theme_colour != null &&
		pref_tabbar != null &&
		pref_tab_selected != null &&
		pref_toolbar != null &&
		pref_toolbar_border_bottom != null &&
		pref_toolbar_field != null &&
		pref_toolbar_field_focus != null &&
		pref_sidebar != null &&
		pref_sidebar_border != null &&
		pref_popup != null &&
		pref_popup_border != null &&
		pref_custom != null &&
		pref_home_light != null &&
		pref_home_dark != null &&
		pref_fallback_light != null &&
		pref_fallback_dark != null &&
		pref_reservedColour_cs != null
	);
}

/**
 * Sets current_xxx values after pref being loaded.
 */
function setCurrent() {
	if (pref_custom) {
		current_home_light = rgba(pref_home_light);
		current_home_dark = rgba(pref_home_dark);
		current_fallback_light = rgba(pref_fallback_light);
		current_fallback_dark = rgba(pref_fallback_dark);
		current_reservedColour_cs = pref_reservedColour_cs;
	} else {
		current_home_light = rgba(default_home_light);
		current_home_dark = rgba(default_home_dark);
		current_fallback_light = rgba(default_fallback_light);
		current_fallback_dark = rgba(default_fallback_dark);
		current_reservedColour_cs = default_reservedColour_cs;
	}
	switch (pref_scheme) {
		case "light":
			current_scheme = "light";
			break;
		case "dark":
			current_scheme = "dark";
			break;
		case "system":
			current_scheme = lightModeDetected() ? "light" : "dark";
			break;
		default:
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
	darknoise: {
		// For image viewer
		colors: {
			// Tabbar & tab
			frame: "rgb(33, 33, 33)",
			frame_inactive: "rgb(33, 33, 33)",
			tab_selected: "rgba(255, 255, 255, 0.15)",
			ntp_background: "rgb(33, 33, 33)",
			// Toolbar
			toolbar: "rgba(0, 0, 0, 0)",
			toolbar_top_separator: "rgba(0, 0, 0, 0)",
			toolbar_bottom_separator: "rgba(255, 255, 255, 0)",
			// URL bar
			toolbar_field: "rgb(44, 44, 44)",
			toolbar_field_border: "rgba(0, 0, 0, 0)",
			toolbar_field_focus: "rgb(44, 44, 44)",
			toolbar_field_border_focus: "rgb(70, 118, 160)",
			// Sidebar
			sidebar: "rgb(44, 44, 44)",
			sidebar_border: "rgba(0, 0, 0, 0)",
			// Popup
			popup: "rgb(44, 44, 44)",
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
			button_background_hover: "rgba(255, 255, 255, 0.10)",
			button_background_active: "rgba(255, 255, 255, 0.15)",
			icons: "rgb(225, 225, 225)",
		},
		images: {
			additional_backgrounds: ["images/imagedoc-darknoise.png"],
		},
		properties: {
			additional_backgrounds_alignment: ["left bottom"],
			additional_backgrounds_tiling: ["repeat"],
			color_scheme: "dark",
			content_color_scheme: "auto",
		},
	},
};

initialize();

/**
 * Initializes / restores the settings.
 * If pref_scheme or pref_allow_dark_light is missing, opens the option page.
 */
function initialize() {
	browser.storage.local.get((pref) => {
		cachePref(pref);
		let pending_scheme = pref_scheme;
		let pending_force = pref_allow_dark_light;
		let pending_dynamic = pref_dynamic;
		let pending_no_theme_colour = pref_no_theme_colour;
		let pending_overlay_opacity_factor = pref_overlay_opacity_factor;
		let pending_overlay_opacity_threshold = pref_overlay_opacity_threshold;
		let pending_tabbar = pref_tabbar;
		let pending_tab_selected = pref_tab_selected;
		let pending_toolbar = pref_toolbar;
		let pending_toolbar_border_bottom = pref_toolbar_border_bottom;
		let pending_toolbar_field = pref_toolbar_field;
		let pending_toolbar_field_focus = pref_toolbar_field_focus;
		let pending_sidebar = pref_sidebar;
		let pending_sidebar_border = pref_sidebar_border;
		let pending_popup = pref_popup;
		let pending_popup_border = pref_popup_border;
		let pending_custom = pref_custom;
		let pending_home_light = pref_home_light;
		let pending_home_dark = pref_home_dark;
		let pending_fallback_light = pref_fallback_light;
		let pending_fallback_dark = pref_fallback_dark;
		let pending_reservedColour_cs = pref_reservedColour_cs;
		let pending_last_version = [2, 2];
		// updates from v2.3 or earlier
		if (pref_overlay_opacity_factor == null || pref_overlay_opacity_threshold == null) {
			pending_overlay_opacity_factor = 0.25;
			pending_overlay_opacity_threshold = 0.25;
		}
		// updates from v1.7.5 or earlier
		if (pref_tab_selected == null || pref_toolbar_field == null || pref_toolbar_field_focus == null || pref_popup_border == null) {
			pending_tab_selected = 0.1;
			pending_toolbar_field = 0.05;
			pending_toolbar_field_focus = 0.05;
			pending_popup_border = 0.05;
		}
		// updates from v1.7.4 or earlier
		// Converts legacy rules to query selector format
		if (pref_last_version <= [1, 7, 4] && pref_reservedColour_cs) {
			Object.keys(pending_reservedColour_cs).forEach((domain) => {
				let temp = pref_reservedColour_cs[domain];
				if (temp.startsWith("TAG_")) {
					pending_reservedColour_cs[domain] = temp.replace("TAG_", "QS_");
				} else if (temp.startsWith("CLASS_")) {
					pending_reservedColour_cs[domain] = temp.replace("CLASS_", "QS_.");
				} else if (temp.startsWith("ID_")) {
					pending_reservedColour_cs[domain] = temp.replace("ID_", "QS_#");
				} else if (temp.startsWith("NAME_")) {
					pending_reservedColour_cs[domain] = `${temp.replace("NAME_", "QS_[name='")}']`;
				} else if (temp === "") {
					delete pending_reservedColour_cs[domain];
				}
			});
		}
		// updates from v1.7.3 or earlier
		if (pref_reservedColour_cs) delete pending_reservedColour_cs[undefined];
		// updates from v1.7 or earlier
		if (pref_fallback_light == null || pref_fallback_dark == null) {
			pending_fallback_light = default_fallback_light;
			pending_fallback_dark = default_fallback_dark;
		}
		// updates from v1.6.16 or earlier
		if (pref_no_theme_colour == null) {
			pending_no_theme_colour = false;
		}
		// updates from v1.6.13 or earlier
		if (pref_sidebar == null || pref_sidebar_border == null) {
			pending_sidebar = 0.05;
			pending_sidebar_border = 0.05;
		}
		// updates from v1.6.5 or earlier
		if (pref_toolbar_border_bottom == null) {
			pending_toolbar_border_bottom = 0;
		}
		// updates from v1.6.4 or earlier
		if (pref_last_version <= [1, 6, 4] && pref_home_dark && pref_home_dark.toUpperCase() == "#1C1B22") {
			pending_home_dark = default_home_dark;
		}
		// updates from v1.6.3 or earlier
		if (pref_toolbar == null) {
			pending_toolbar = 0;
		}
		// updates from v1.6.2 or earlier
		if (pref_tabbar == null || pref_popup == null) {
			pending_tabbar = 0;
			pending_popup = 0.05;
		}
		// updates from v1.5.7 or earlier
		if (pref_reservedColour_cs == null) {
			pending_reservedColour_cs = default_reservedColour_cs;
		}
		// updates from v1.5.3 or earlier
		if (pref_dynamic == null) {
			pending_dynamic = false;
		}
		// updates from v1.3.1 or earlier
		if (pref_last_version == null) {
			pending_force = false;
		}
		// updates from v1.3 or earlier
		if (pref_custom == null || pref_home_light == null || pref_home_dark == null) {
			pending_custom = false;
			pending_home_light = default_home_light;
			pending_home_dark = default_home_dark;
		}
		let firstTime = false;
		// first time install
		if (pref_scheme == null || pref_allow_dark_light == null) {
			firstTime = true;
			pending_force = true;
			pending_scheme = lightModeDetected() ? "light" : "dark";
			setBrowserColourScheme(pending_scheme);
		}
		if (checkVersion() < 95) pending_force = true;
		browser.storage.local
			.set({
				scheme: pending_scheme,
				force: pending_force,
				dynamic: pending_dynamic,
				no_theme_color: pending_no_theme_colour,
				overlay_opacity_factor: pending_overlay_opacity_factor,
				overlay_opacity_threshold: pending_overlay_opacity_threshold,
				tabbar_color: pending_tabbar,
				tab_selected_color: pending_tab_selected,
				toolbar_color: pending_toolbar,
				separator_opacity: pending_toolbar_border_bottom,
				toolbar_field_color: pending_toolbar_field,
				toolbar_field_focus_color: pending_toolbar_field_focus,
				sidebar_color: pending_sidebar,
				sidebar_border_color: pending_sidebar_border,
				popup_color: pending_popup,
				popup_border_color: pending_popup_border,
				custom: pending_custom,
				light_color: pending_home_light,
				dark_color: pending_home_dark,
				light_fallback_color: pending_fallback_light,
				dark_fallback_color: pending_fallback_dark,
				reservedColor_cs: pending_reservedColour_cs,
				last_version: pending_last_version,
			})
			.then(() => {
				loadPrefAndUpdate();
				if (firstTime) browser.runtime.openOptionsPage();
				return Promise.resolve("Initialization done");
			});
	});
}

browser.tabs.onUpdated.addListener(update); // When new tab is opened / reloaded
browser.tabs.onActivated.addListener(update); // When switch tabs
browser.tabs.onAttached.addListener(update); // When a tab is attatched to a window
browser.windows.onFocusChanged.addListener(update); // When a new window is opened
browser.runtime.onMessage.addListener((message, sender) => {
	switch (message.reason) {
		case "INIT_REQUEST": // When pref is corupted
			initialize();
			break;
		case "UPDATE_REQUEST": // When pref changed
			loadPrefAndUpdate();
			break;
		case "COLOUR_UPDATE":
			sender.tab.active ? setFrameColour(sender.tab.windowId, message.colour) : update();
			break;
		default:
			break;
	}
});

// Light Mode Match Media
const lightModeDetection = window.matchMedia("(prefers-color-scheme: light)");
if (lightModeDetection)
	lightModeDetection.onchange = () => {
		if (pref_scheme == "system") loadPrefAndUpdate();
	};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect.
 */
function lightModeDetected() {
	return lightModeDetection && lightModeDetection.matches;
}

/**
 * Triggers colour change in all windows.
 */
function update() {
	browser.tabs.query({ active: true, status: "complete" }, (tabs) => {
		if (verifyPref()) {
			tabs.forEach(updateEachWindow);
		} else {
			// If the pref is corupted, initialzes pref
			initialize().then(() => {
				setCurrent();
				setBrowserColourScheme(pref_scheme);
				tabs.forEach(updateEachWindow);
			});
		}
	});
}

/**
 * Updates pref cache and triggers colour change in all windows.
 */
function loadPrefAndUpdate() {
	browser.storage.local.get((pref) => {
		cachePref(pref);
		setCurrent();
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
		// When visiting internal files (content script blocked)
		setFrameColour(windowId, "PLAINTEXT");
	} else if (url.startsWith("chrome:") || url.startsWith("resource:") || url.startsWith("jar:file:")) {
		// When visiting internal files (content script blocked)
		if (url.endsWith(".txt") || url.endsWith(".css") || url.endsWith(".jsm") || url.endsWith(".js")) {
			setFrameColour(windowId, "PLAINTEXT");
		} else if (url.endsWith(".png") || url.endsWith(".jpg")) {
			setFrameColour(windowId, "DARKNOISE");
		} else {
			setFrameColour(windowId, "SYSTEM");
		}
	} else {
		// When visiting normal websites, pdf viewer (content script blocked), website failed to load, or local files
		getSearchKey(url).then((key) => {
			let reversed_scheme = current_scheme == "light" ? "dark" : "light";
			if (reservedColour_aboutPage[current_scheme][key]) {
				// For prefered scheme there's a reserved colour
				setFrameColour(windowId, rgba(reservedColour_aboutPage[current_scheme][key]), current_scheme == "dark");
			} else if (reservedColour_aboutPage[reversed_scheme][key]) {
				// Site has reserved colour in the other mode
				setFrameColour(windowId, rgba(reservedColour_aboutPage[reversed_scheme][key]), reversed_scheme == "dark");
			} else if (url.startsWith("about:")) {
				setFrameColour(windowId, "DEFAULT");
			} else if (key.startsWith("Add-on ID: ") && current_reservedColour_cs[key]) {
				let frameColour = rgba(current_reservedColour_cs[key]);
				setFrameColour(windowId, frameColour);
			} else if (url.startsWith("moz-extension:")) {
				setFrameColour(windowId, "ADDON");
			} else {
				// Sends pref to content script and tests if the script is responsive
				// The content script sends colour back by themselves via a port
				browser.tabs.sendMessage(
					tab.id,
					{
						reason: "COLOUR_REQUEST",
						dynamic: pref_dynamic,
						no_theme_color: pref_no_theme_colour,
						reservedColor_cs: current_reservedColour_cs,
					},
					(response) => {
						if (!response) {
							if (url.startsWith("data:image")) {
								// Content script is blocked on data:pages
								// Viewing an image on data:image
								console.log(url + "\nMight be image viewer.");
								setFrameColour(windowId, "DARKNOISE");
							} else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
								// When viewing a pdf file, Firefox blocks content script
								console.log(url + "\nMight be pdf viewer.");
								setFrameColour(windowId, "PDFVIEWER");
							} else if (tab.favIconUrl && tab.favIconUrl.startsWith("chrome:")) {
								// Content script is also blocked on website that failed to load
								console.log(url + "\nTab failed to load.");
								setFrameColour(windowId, "DEFAULT");
							} else if (url.endsWith("http://" + tab.title) || url.endsWith("https://" + tab.title)) {
								// When viewing plain text online, Firefox blocks content script
								console.log(url + "\nMight be plain text viewer.");
								setFrameColour(windowId, "PLAINTEXT");
							} else {
								console.error(url + "\nNo connection to content script.");
								setFrameColour(windowId, "FALLBACK");
							}
						}
					}
				);
			}
		});
	}
}

/**
 * Gets the search key for reservedColour (_cs).
 * @param {string} url an URL e.g. "about:page/etwas", "etwas://addons.mozilla.org/etwas", "moz-extension://*UUID/etwas".
 * @returns e.g. "about:page", "addons.mozilla.org", "Add-on ID: ATBC@EasonWong".
 */
function getSearchKey(url) {
	if (url.startsWith("about:")) {
		return Promise.resolve(url.split(/\/|\?/)[0]); // e.g. "about:page"
	} else if (url.startsWith("moz-extension:")) {
		let uuid = url.split(/\/|\?/)[2];
		return new Promise((resolve) => {
			browser.management.getAll().then((addonList) => {
				let breakLoop = false;
				for (let addon of addonList) {
					// bugs for some reason
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
		return Promise.resolve(url.split(/\/|\?/)[2]); // e.g. "addons.mozilla.org"
	}
}

/**
 * Changes tab bar to the appointed colour (with windowId).
 *
 * "force" and "scheme" come from preferences.
 *
 * force: false => normal;
 * force: true, scheme: dark, darkMode: true => normal;
 * force: true, scheme: light, darkMode: false => normal;
 * force: true, scheme: dark, darkMode: false => dark;
 * force: true, scheme: light, darkMode: true => light;
 *
 * if colour is empty, then roll back to default colour.
 *
 * @param {number} windowId The ID of the window.
 * @param {object | string} colour The colour to change to in rgb object or command string.
 * Command strings are: "DEFAULT", "DARKNOISE", and "PLAINTEXT"
 * @param {boolean} darkMode Decides text colour. Leaves "null" to let add-on prefs decide.
 */
function setFrameColour(windowId, colour, darkMode) {
	// dark_mode is null means the colour is not bright nor dark
	// Then set dark_colour following the setting
	// dark_colour decides text colour
	if (darkMode == null) darkMode = current_scheme == "dark";
	switch (colour) {
		case "HOME":
			// Home page and new tab
			if (darkMode) {
				changeThemePara(current_home_dark, "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(current_home_light, "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "FALLBACK":
			// Fallback colour
			if (darkMode) {
				changeThemePara(current_fallback_dark, "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(current_fallback_light, "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "DARKNOISE":
			// Image viewer
			changeThemePara(rgba([33, 33, 33, 1]), "darknoise");
			applyTheme(windowId, adaptive_themes["darknoise"]);
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
				!pref_allow_dark_light ||
				(pref_allow_dark_light && current_scheme == "dark" && darkMode) ||
				(pref_allow_dark_light && current_scheme == "light" && !darkMode)
			) {
				// Adaptive colouring based on contrast between the colour and the base colour
				let baseColour = current_scheme == "dark" ? rgba(default_home_dark) : rgba(default_home_light);
				// Compute the contrast between the colour and the base colour
				let contrast = contrastFactor(colour, baseColour);
				// Adjust the overlay opacity based on the contrast
				colour.a = contrastAdjustedOverlayOpacity(contrast, pref_overlay_opacity_factor, pref_overlay_opacity_threshold);
				// Compute the overlay colour
				let result = overlayColour(colour, baseColour);

				if (darkMode) {
					changeThemePara(result, "dark");
					applyTheme(windowId, adaptive_themes["dark"]);
				} else {
					changeThemePara(result, "light");
					applyTheme(windowId, adaptive_themes["light"]);
				}
			} else if (!colour || pref_allow_dark_light) {
				// Force colouring (use fallback colour)
				if (current_scheme == "dark") {
					changeThemePara(current_fallback_dark, "dark");
					applyTheme(windowId, adaptive_themes["dark"]);
				} else {
					changeThemePara(current_fallback_light, "light");
					applyTheme(windowId, adaptive_themes["light"]);
				}
			}
			break;
	}
}

/**
 * Adjusts the parameters in adaptive_themes.
 * @param {object} colour Colour of the frame.
 * @param {string} colourScheme Colour scheme, "dark", "light", or "darknoise".
 */
function changeThemePara(colour, colourScheme) {
	let tabbar, tab_selected, ntp, toolbar, toolbar_border_bottom, toolbar_field, toolbar_field_focus, sidebar, sidebar_border, popup, popup_border;
	switch (colourScheme) {
		case "dark":
			tabbar = dimColour(colour, pref_tabbar);
			tab_selected = dimColour(colour, pref_tab_selected);
			ntp = dimColour(colour, 0);
			toolbar = pref_toolbar == pref_tabbar ? "rgba(0, 0, 0, 0)" : dimColour(colour, pref_toolbar);
			toolbar_border_bottom = dimColour(colour, pref_toolbar_border_bottom + pref_toolbar);
			toolbar_field = pref_toolbar == pref_toolbar_field ? "rgba(0, 0, 0, 0)" : dimColour(colour, pref_toolbar_field);
			toolbar_field_focus = dimColour(colour, pref_toolbar_field_focus);
			sidebar = dimColour(colour, pref_sidebar);
			sidebar_border = dimColour(colour, pref_sidebar + pref_sidebar_border);
			popup = dimColour(colour, pref_popup);
			popup_border = dimColour(colour, pref_popup + pref_popup_border);
			break;
		case "light":
			tabbar = dimColour(colour, -pref_tabbar * 1.5);
			tab_selected = dimColour(colour, -pref_tab_selected * 1.5);
			ntp = dimColour(colour, 0);
			toolbar = pref_toolbar == pref_tabbar ? "rgba(0, 0, 0, 0)" : dimColour(colour, -pref_toolbar * 1.5);
			toolbar_border_bottom = dimColour(colour, (-pref_toolbar_border_bottom - pref_toolbar) * 1.5);
			toolbar_field = pref_toolbar == pref_toolbar_field ? "rgba(0, 0, 0, 0)" : dimColour(colour, -pref_toolbar_field * 1.5);
			toolbar_field_focus = dimColour(colour, -pref_toolbar_field_focus * 1.5);
			sidebar = dimColour(colour, -pref_sidebar * 1.5);
			sidebar_border = dimColour(colour, (-pref_sidebar - pref_sidebar_border) * 1.5);
			popup = dimColour(colour, -pref_popup * 1.5);
			popup_border = dimColour(colour, (-pref_popup - pref_popup_border) * 1.5);
			break;
		case "darknoise":
			tabbar = "rgb(33, 33, 33)";
			tab_selected = dimColour(colour, pref_tab_selected);
			ntp = dimColour(colour, 0);
			toolbar = pref_toolbar == pref_tabbar ? "rgba(0, 0, 0, 0)" : dimColour(colour, pref_toolbar);
			toolbar_border_bottom = dimColour(colour, pref_toolbar_border_bottom + pref_toolbar);
			toolbar_field = pref_toolbar == pref_toolbar_field ? "rgba(0, 0, 0, 0)" : dimColour(colour, pref_toolbar_field);
			toolbar_field_focus = dimColour(colour, pref_toolbar_field_focus);
			sidebar = dimColour(colour, pref_sidebar);
			sidebar_border = dimColour(colour, pref_sidebar + pref_sidebar_border);
			popup = dimColour(colour, pref_popup);
			popup_border = dimColour(colour, pref_popup + pref_popup_border);
			break;
	}
	adaptive_themes[colourScheme]["colors"]["frame"] = tabbar;
	adaptive_themes[colourScheme]["colors"]["frame_inactive"] = tabbar;
	adaptive_themes[colourScheme]["colors"]["tab_selected"] = tab_selected;
	adaptive_themes[colourScheme]["colors"]["ntp_background"] = ntp;
	adaptive_themes[colourScheme]["colors"]["toolbar"] = toolbar;
	adaptive_themes[colourScheme]["colors"]["toolbar_bottom_separator"] = toolbar_border_bottom;
	adaptive_themes[colourScheme]["colors"]["toolbar_field"] = toolbar_field;
	adaptive_themes[colourScheme]["colors"]["toolbar_field_focus"] = toolbar_field_focus;
	adaptive_themes[colourScheme]["colors"]["sidebar"] = sidebar;
	adaptive_themes[colourScheme]["colors"]["sidebar_border"] = sidebar_border;
	adaptive_themes[colourScheme]["colors"]["popup"] = popup;
	adaptive_themes[colourScheme]["colors"]["popup_border"] = popup_border;
	//adaptive_themes[colourScheme]["properties"]["color_scheme"] = pref_scheme;
}

/**
 * Applies theme to certain window.
 * @param {number} windowId The ID of the target window.
 * @param {object} theme The theme to apply.
 */
function applyTheme(windowId, theme) {
	browser.theme.update(windowId, theme);
	browser.runtime.sendMessage("OHTP@EasonWong", "TPOH_UPDATE").catch((e) => {
		if (e.message != "Could not establish connection. Receiving end does not exist.") console.error(e);
	});
}

/**
 * Overrides content colour scheme.
 * @param {string} scheme "light", "dark", or "system". Converts "system" to "auto" if above v106.
 */
function setBrowserColourScheme(pending_scheme) {
	let version = checkVersion();
	if (version >= 95)
		browser.browserSettings.overrideContentColorScheme.set({
			value: pending_scheme === "system" && version >= 106 ? "auto" : pending_scheme,
		});
}
