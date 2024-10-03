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
	contrastAdjustedOverlayOpacity, */
	overlayColour,
} from "./colour.js";

// Settings cache: always synced with settings page (followed by handles in storage)
/* var pref.scheme; // scheme
var pref.allow_dark_light; // force
var pref.dynamic; // dynamic
var pref.no_theme_colour; // no_theme_color

var pref.overlay_opacity_factor; // overlay_opacity_factor
var pref.overlay_opacity_threshold; // overlay_opacity_threshold

var pref.tabbar; // tabbar_color
var pref.tab_selected; // tab_selected_color
var pref.toolbar; // toolbar_color
var pref.toolbar_border_bottom; // separator_opacity
var pref.toolbar_field; // toolbar_field_color
var pref.toolbar_field_focus; // toolbar_field_focus_color
var pref.sidebar; // sidebar_color
var pref.sidebar_border; // sidebar_border_color
var pref.popup; // popup_color
var pref.popup_border; // popup_border_color
var pref.custom; // custom
var pref.home_light; // light_color
var pref.home_dark; // dark_color
var pref.fallback_light; // light_fallback_color
var pref.fallback_dark; // dark_fallback_color
var pref.reservedColour_webPage; // reservedColor_webPage
var pref.last_version; // last_version */

var pref = {
	scheme: systemDisplayMode(),
	allowDarkLight: true,
	dynamic: false,
	noThemeColour: false,
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
	last_version: [2, 2],
};

var vars = {
	scheme,
	home_light,
	home_dark,
	fallback_light,
	fallback_dark,
	reservedColour_webPage,
};

// Controlled by prefs
/* var vars.scheme;
var vars.home_light;
var vars.home_dark;
var vars.fallback_light;
var vars.fallback_dark;
var vars.reservedColour_webPage; */

/**
 * Caches pref into local variables.
 */
/* function cachePref(pref) {
	pref.scheme = pref.scheme;
	pref.allow_dark_light = pref.force;
	pref.dynamic = pref.dynamic;
	pref.no_theme_colour = pref.no_theme_color;
	pref.overlay_opacity_factor = pref.overlay_opacity_factor;
	pref.overlay_opacity_threshold = pref.overlay_opacity_threshold;
	pref.tabbar = pref.tabbar_color;
	pref.tab_selected = pref.tab_selected_color;
	pref.toolbar = pref.toolbar_color;
	pref.toolbar_border_bottom = pref.separator_opacity;
	pref.toolbar_field = pref.toolbar_field_color;
	pref.toolbar_field_focus = pref.toolbar_field_focus_color;
	pref.sidebar = pref.sidebar_color;
	pref.sidebar_border = pref.sidebar_border_color;
	pref.popup = pref.popup_color;
	pref.popup_border = pref.popup_border_color;
	pref.custom = pref.custom;
	pref.home_light = pref.light_color;
	pref.home_dark = pref.dark_color;
	pref.fallback_light = pref.light_fallback_color;
	pref.fallback_dark = pref.dark_fallback_color;
	pref.reservedColour_webPage = pref.reservedColor_webPage;
	pref.last_version = pref.last_version;
} */

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
		pref.reservedColour_webPage != null
	);
}

/**
 * Sets "vars" values after pref being loaded.
 */
function updateVars() {
	if (pref.custom) {
		vars.home_light = rgba(pref.homeBackground_light);
		vars.home_dark = rgba(pref.homeBackground_dark);
		vars.fallback_light = rgba(pref.fallbackColour_light);
		vars.fallback_dark = rgba(pref.fallbackColour_dark);
		vars.reservedColour_webPage = pref.reservedColour_webPage;
	} else {
		vars.home_light = rgba(default_homeBackground_light);
		vars.home_dark = rgba(default_homeBackground_dark);
		vars.fallback_light = rgba(default_fallbackColour_light);
		vars.fallback_dark = rgba(default_fallbackColour_dark);
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
			vars.scheme = systemDisplayMode();
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

initialise();

/**
 * Initializes / restores the settings.
 * If pref.scheme or pref.allow_dark_light is missing, opens the option page.
 */
function initialise() {
	browser.storage.local.get((storedPref) => {
		Object.keys(storedPref).forEach((key) => {
			if (key in pref) {
				pref[key] = storedPref[key];
			} else {
				switch (key) {
					case "force":
						pref["allowDarkLight"] = storedPref[key];
						break;
					case "tabbar_color":
						pref["tabbar"] = storedPref[key];
					default:
						break;
				}
			}
		});
		//pref = storedPref;
		/* let storedPref.scheme = storedPref.scheme;
		let storedPref.allow_dark_light = storedPref.allow_dark_light;
		let storedPref.dynamic = storedPref.dynamic;
		let storedPref.no_theme_colour = storedPref.no_theme_colour; */
		/* let storedPref.overlay_opacity_factor = pref.overlay_opacity_factor;
		let storedPref.overlay_opacity_threshold = pref.overlay_opacity_threshold; */
		/* let storedPref.tabbar = storedPref.tabbar;
		let storedPref.tab_selected = storedPref.tab_selected;
		let storedPref.toolbar = storedPref.toolbar;
		let storedPref.toolbar_border_bottom = storedPref.toolbar_border_bottom;
		let storedPref.toolbar_field = storedPref.toolbar_field;
		let storedPref.toolbar_field_focus = storedPref.toolbar_field_focus;
		let storedPref.sidebar = storedPref.sidebar;
		let storedPref.sidebar_border = storedPref.sidebar_border;
		let storedPref.popup = storedPref.popup;
		let storedPref.popup_border = storedPref.popup_border;
		let storedPref.custom = storedPref.custom;
		let storedPref.home_light = storedPref.home_light;
		let storedPref.home_dark = storedPref.home_dark;
		let storedPref.fallback_light = storedPref.fallback_light;
		let storedPref.fallback_dark = storedPref.fallback_dark;
		let storedPref.reservedColour_webPage = storedPref.reservedColour_webPage;
		let storedPref.last_version = [2, 2]; */
		// updates from v2.1 or earlier
		/* if (pref.overlay_opacity_factor == null || pref.overlay_opacity_threshold == null) {
			storedPref.overlay_opacity_factor = 0.2;
			storedPref.overlay_opacity_threshold = 0.1;
		} */
		// updates from v1.7.5 or earlier
		/* if (
			storedPref.tab_selected == null ||
			storedPref.toolbar_field == null ||
			storedPref.toolbar_field_focus == null ||
			storedPref.popup_border == null
		) {
			storedPref.tab_selected = 0.1;
			storedPref.toolbar_field = 0.05;
			storedPref.toolbar_field_focus = 0.05;
			storedPref.popup_border = 0.05;
		} */
		// updates from v1.7.4 or earlier
		// Converts legacy rules to query selector format
		if (storedPref.last_version <= [1, 7, 4] && storedPref.reservedColour_webPage) {
			Object.keys(storedPref.reservedColour_webPage).forEach((domain) => {
				let legacySyntax = storedPref.reservedColour_webPage[domain];
				if (legacySyntax.startsWith("TAG_")) {
					storedPref.reservedColour_webPage[domain] = legacySyntax.replace("TAG_", "QS_");
				} else if (legacySyntax.startsWith("CLASS_")) {
					storedPref.reservedColour_webPage[domain] = legacySyntax.replace("CLASS_", "QS_.");
				} else if (legacySyntax.startsWith("ID_")) {
					storedPref.reservedColour_webPage[domain] = legacySyntax.replace("ID_", "QS_#");
				} else if (legacySyntax.startsWith("NAME_")) {
					storedPref.reservedColour_webPage[domain] = `${legacySyntax.replace("NAME_", "QS_[name='")}']`;
				} else if (legacySyntax === "") {
					delete storedPref.reservedColour_webPage[domain];
				}
			});
		}
		// updates from v1.7.3 or earlier
		if (storedPref.reservedColour_webPage) delete storedPref.reservedColour_webPage[undefined];
		// updates from v1.7 or earlier
		/* if (storedPref.fallback_light == null || storedPref.fallback_dark == null) {
			storedPref.fallback_light = default_fallback_light;
			storedPref.fallback_dark = default_fallback_dark;
		} */
		// updates from v1.6.16 or earlier
		/* if (storedPref.no_theme_colour == null) {
			storedPref.no_theme_colour = false;
		} */
		// updates from v1.6.13 or earlier
		/* if (storedPref.sidebar == null || storedPref.sidebar_border == null) {
			storedPref.sidebar = 0.05;
			storedPref.sidebar_border = 0.05;
		} */
		// updates from v1.6.5 or earlier
		/* if (storedPref.toolbar_border_bottom == null) {
			storedPref.toolbar_border_bottom = 0;
		} */
		// updates from v1.6.4 or earlier
		if (storedPref.last_version <= [1, 6, 4] && storedPref.home_dark && storedPref.home_dark.toUpperCase() == "#1C1B22") {
			storedPref.home_dark = default_homeBackground_dark;
		}
		// updates from v1.6.3 or earlier
		/* if (storedPref.toolbar == null) {
			storedPref.toolbar = 0;
		} */
		// updates from v1.6.2 or earlier
		/* if (storedPref.tabbar == null || storedPref.popup == null) {
			storedPref.tabbar = 0;
			storedPref.popup = 0.05;
		} */
		// updates from v1.5.7 or earlier
		/* if (storedPref.reservedColour_webPage == null) {
			storedPref.reservedColour_webPage = default_reservedColour_webPage;
		} */
		// updates from v1.5.3 or earlier
		/* if (storedPref.dynamic == null) {
			storedPref.dynamic = false;
		} */
		// updates from v1.3.1 or earlier
		/* if (storedPref.last_version == null) {
			storedPref.allow_dark_light = false;
		} */
		// updates from v1.3 or earlier
		/* if (storedPref.custom == null || storedPref.home_light == null || storedPref.home_dark == null) {
			storedPref.custom = false;
			storedPref.home_light = default_home_light;
			storedPref.home_dark = default_home_dark;
		} */
		let firstTimeInstall = false;
		// first time install
		if (storedPref.scheme == null || storedPref.allow_dark_light == null) {
			firstTimeInstall = true;
			storedPref.allow_dark_light = true;
			storedPref.scheme = systemDisplayMode();
			setBrowserColourScheme(storedPref.scheme);
		}
		if (checkVersion() < 95) storedPref.allow_dark_light = true;
		browser.storage.local
			.set(
				pref /* {
				scheme: storedPref.scheme,
				force: storedPref.allow_dark_light,
				dynamic: storedPref.dynamic,
				no_theme_color: storedPref.no_theme_colour,
				overlay_opacity_factor: storedPref.overlay_opacity_factor,
				overlay_opacity_threshold: storedPref.overlay_opacity_threshold,
				tabbar_color: storedPref.tabbar,
				tab_selected_color: storedPref.tab_selected,
				toolbar_color: storedPref.toolbar,
				separator_opacity: storedPref.toolbar_border_bottom,
				toolbar_field_color: storedPref.toolbar_field,
				toolbar_field_focus_color: storedPref.toolbar_field_focus,
				sidebar_color: storedPref.sidebar,
				sidebar_border_color: storedPref.sidebar_border,
				popup_color: storedPref.popup,
				popup_border_color: storedPref.popup_border,
				custom: storedPref.custom,
				light_color: storedPref.home_light,
				dark_color: storedPref.home_dark,
				light_fallback_color: storedPref.fallback_light,
				dark_fallback_color: storedPref.fallback_dark,
				reservedColor_webPage: storedPref.reservedColour_webPage,
				last_version: storedPref.last_version,
			} */
			)
			.then(() => {
				loadPrefAndUpdate();
				if (firstTimeInstall) browser.runtime.openOptionsPage();
				return Promise.resolve("Initialisation done");
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
			initialise();
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
		if (pref.scheme == "system") loadPrefAndUpdate();
	};

/**
 * @returns "light" or "dark" depending on the system's setting.
 * @returns "light" if it cannot be detected.
 */
function systemDisplayMode() {
	return lightModeDetection && lightModeDetection.matches ? "light" : "dark";
}

/**
 * Triggers colour change in all windows.
 */
function update() {
	browser.tabs.query({ active: true, status: "complete" }, (tabs) => {
		if (verifyPref()) {
			tabs.forEach(updateEachWindow);
		} else {
			// If the pref is corrupted, initialises pref
			initialise().then(() => {
				updateVars();
				setBrowserColourScheme(pref.scheme);
				tabs.forEach(updateEachWindow);
			});
		}
	});
}

/**
 * Updates pref cache and triggers colour change in all windows.
 */
function loadPrefAndUpdate() {
	browser.storage.local.get((storedPref) => {
		pref = storedPref;
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
		// When visiting normal websites, pdf viewer (content script blocked), failed-to-load website, or local files
		getSearchKey(url).then((key) => {
			let reversed_scheme = vars.scheme == "light" ? "dark" : "light";
			if (reservedColour_aboutPage[vars.scheme][key]) {
				// For prefered scheme there's a reserved colour
				setFrameColour(windowId, rgba(reservedColour_aboutPage[vars.scheme][key]), vars.scheme == "dark");
			} else if (reservedColour_aboutPage[reversed_scheme][key]) {
				// Site has reserved colour in the other mode
				setFrameColour(windowId, rgba(reservedColour_aboutPage[reversed_scheme][key]), reversed_scheme == "dark");
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
						no_theme_color: pref.noThemeColour,
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
							setFrameColour(windowId, "DARKNOISE");
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
					// What bugs? Please elaborate
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
	if (darkMode == null) darkMode = vars.scheme == "dark";
	switch (colour) {
		case "HOME":
			// Home page and new tab
			if (darkMode) {
				changeThemePara(vars.home_dark, "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(vars.home_light, "light");
				applyTheme(windowId, adaptive_themes["light"]);
			}
			break;
		case "FALLBACK":
			// Fallback colour
			if (darkMode) {
				changeThemePara(vars.fallback_dark, "dark");
				applyTheme(windowId, adaptive_themes["dark"]);
			} else {
				changeThemePara(vars.fallback_light, "light");
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
				!pref.allowDarkLight ||
				(pref.allowDarkLight && vars.scheme == "dark" && darkMode) ||
				(pref.allowDarkLight && vars.scheme == "light" && !darkMode)
			) {
				// Adaptive colouring based on contrast between the colour and the base colour
				let baseColour = vars.scheme == "dark" ? rgba(default_homeBackground_dark) : rgba(default_homeBackground_light);
				// Compute the contrast between the colour and the base colour
				let contrast = contrastFactor(colour, baseColour);
				// Adjust the overlay opacity based on the contrast
				colour.a = contrastAdjustedOverlayOpacity(contrast, pref.overlay_opacity_factor, pref.overlay_opacity_threshold);
				// Compute the overlay colour
				let result = overlayColour(colour, baseColour);

				if (darkMode) {
					changeThemePara(result, "dark");
					applyTheme(windowId, adaptive_themes["dark"]);
				} else {
					changeThemePara(result, "light");
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
 * @param {string} colourScheme Colour scheme, "dark", "light", or "darknoise".
 */
function changeThemePara(colour, colourScheme) {
	let tabbar, tab_selected, ntp, toolbar, toolbar_border_bottom, toolbar_field, toolbar_field_focus, sidebar, sidebar_border, popup, popup_border;
	switch (colourScheme) {
		case "dark":
			tabbar = dimColour(colour, pref.tabbar);
			tab_selected = dimColour(colour, pref.tabSelected);
			ntp = dimColour(colour, 0);
			toolbar = dimColour(colour, pref.toolbar);
			toolbar_border_bottom = dimColour(colour, pref.toolbarBorderBottom + pref.toolbar);
			toolbar_field = dimColour(colour, pref.toolbarField);
			toolbar_field_focus = dimColour(colour, pref.toolbarFieldOnFocus);
			sidebar = dimColour(colour, pref.sidebar);
			sidebar_border = dimColour(colour, pref.sidebar + pref.sidebarBorder);
			popup = dimColour(colour, pref.popup);
			popup_border = dimColour(colour, pref.popup + pref.popupBorder);
			break;
		case "light":
			tabbar = dimColour(colour, -pref.tabbar * 1.5);
			tab_selected = dimColour(colour, -pref.tabSelected * 1.5);
			ntp = dimColour(colour, 0);
			toolbar = dimColour(colour, -pref.toolbar * 1.5);
			toolbar_border_bottom = dimColour(colour, (-pref.toolbarBorderBottom - pref.toolbar) * 1.5);
			toolbar_field = dimColour(colour, -pref.toolbarField * 1.5);
			toolbar_field_focus = dimColour(colour, -pref.toolbarFieldOnFocus * 1.5);
			sidebar = dimColour(colour, -pref.sidebar * 1.5);
			sidebar_border = dimColour(colour, (-pref.sidebar - pref.sidebarBorder) * 1.5);
			popup = dimColour(colour, -pref.popup * 1.5);
			popup_border = dimColour(colour, (-pref.popup - pref.popupBorder) * 1.5);
			break;
		case "darknoise":
			tabbar = "rgb(33, 33, 33)";
			tab_selected = dimColour(colour, pref.tabSelected);
			ntp = dimColour(colour, 0);
			toolbar = dimColour(colour, pref.toolbar);
			toolbar_border_bottom = dimColour(colour, pref.toolbarBorderBottom + pref.toolbar);
			toolbar_field = dimColour(colour, pref.toolbarField);
			toolbar_field_focus = dimColour(colour, pref.toolbarFieldOnFocus);
			sidebar = dimColour(colour, pref.sidebar);
			sidebar_border = dimColour(colour, pref.sidebar + pref.sidebarBorder);
			popup = dimColour(colour, pref.popup);
			popup_border = dimColour(colour, pref.popup + pref.popupBorder);
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
	// adaptive_themes[colourScheme]["properties"]["color_scheme"] = pref.scheme;
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
 * @param {string} scheme "light", "dark", or "auto". Converts "auto" to "system" if the brouser's version sits below v106.
 */
function setBrowserColourScheme(scheme) {
	let version = checkVersion();
	if (version >= 95)
		browser.browserSettings.overrideContentColorScheme.set({
			value: scheme === "auto" && version < 106 ? "system" : scheme,
		});
}
