import {
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_reservedColour_webPage,
	recommendedColour_addon,
	protectedDomain,
	checkVersion,
} from "./shared.js";

// Localisation
document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll("[data-text]").forEach((element) => (element.textContent = msg(element.dataset.text)));
	document.querySelectorAll("[data-title]").forEach((element) => (element.title = msg(element.dataset.title)));
});

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

// Current colour lookup table
var reservedColour_webPage;

/**
 * Caches pref into local variables and checks integrity.
 */
function cachePref(storedPref) {
	pref = storedPref;
	reservedColour_webPage = pref.custom ? pref.reservedColour_webPage : default_reservedColour_webPage;
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

let body = document.getElementsByTagName("body")[0];
let loading = document.getElementById("loading");
let settings = document.getElementById("settings");
let colourSchemeLight = document.getElementById("colour_scheme_light");
let colourSchemeDark = document.getElementById("colour_scheme_dark");
let colourSchemeAuto = document.getElementById("colour_scheme_auto");
let allowDarkLightCheckbox = document.getElementById("allow_dark_light");
let allowDarkLightCheckboxText = document.getElementById("force_mode_caption");
let dynamicCheckbox = document.getElementById("dynamic");
let noThemeColourCheckbox = document.getElementById("no_theme_color");
let moreCustomButton = document.getElementById("custom_popup");
let infoDisplay = document.getElementById("info_display");
let infoAction = document.getElementById("info_action");

settings.hidden = true;
loading.hidden = false;

load();

browser.theme.onUpdated.addListener(autoPageColour);
// Load prefs when popup is opened
document.addEventListener("pageshow", load);
// Sync prefs on popup
browser.storage.onChanged.addListener(applySettings);

/**
 * Loads all prefs.
 */
function load() {
	browser.storage.local.get((storedPref) => {
		if (cachePref(storedPref)) {
			colourSchemeDark.checked = pref.scheme === "dark";
			colourSchemeLight.checked = pref.scheme === "light";
			colourSchemeAuto.checked = pref.scheme === "auto";
			allowDarkLightCheckbox.checked = pref.allowDarkLight;
			dynamicCheckbox.checked = pref.dynamic;
			noThemeColourCheckbox.checked = pref.noThemeColour;
			autoPageColour();
			loading.hidden = true;
			settings.hidden = false;
		} else {
			browser.runtime.sendMessage({ reason: "INIT_REQUEST" });
		}
	});
}

colourSchemeDark.addEventListener("input", () => {
	if (colourSchemeDark.checked) {
		colourSchemeLight.checked = false;
		colourSchemeAuto.checked = false;
		changeColourScheme("dark");
	}
});

colourSchemeLight.addEventListener("input", () => {
	if (colourSchemeLight.checked) {
		colourSchemeDark.checked = false;
		colourSchemeAuto.checked = false;
		changeColourScheme("light");
	}
});

colourSchemeAuto.addEventListener("input", () => {
	if (colourSchemeAuto.checked) {
		colourSchemeDark.checked = false;
		colourSchemeLight.checked = false;
		changeColourScheme("system");
	}
});

/**
 * Sets the colour scheme, and updates appearance of option page.
 * @param {string} scheme "light", "dark", or "system".
 */
function changeColourScheme(scheme) {
	pref.scheme = scheme;
	browser.storage.local.set({ scheme: scheme }).then(applySettings);
	autoPageColour();
}

// If it's below v95.0, grey out "allow..." option
if (checkVersion() < 95) {
	allowDarkLightCheckbox.checked = false;
	allowDarkLightCheckbox.disabled = true;
} else {
	allowDarkLightCheckbox.onclick = () => {
		pref.allowDarkLight = allowDarkLightCheckbox.checked;
		browser.storage.local.set({ allowDarkLight: allowDarkLightCheckbox.checked }).then(applySettings);
	};
}

dynamicCheckbox.onclick = () => {
	pref.dynamic = dynamicCheckbox.checked;
	browser.storage.local.set({ dynamic: dynamicCheckbox.checked }).then(applySettings);
};

noThemeColourCheckbox.onclick = () => {
	pref.noThemeColour = noThemeColourCheckbox.checked;
	browser.storage.local.set({ noThemeColour: noThemeColourCheckbox.checked }).then(applySettings);
};

moreCustomButton.onclick = () => browser.runtime.openOptionsPage();

/**
 * Triggers colour update.
 */
function applySettings() {
	browser.runtime.sendMessage({ reason: "UPDATE_REQUEST" });
}

/**
 * Updates popup's colour depends on tab bar colour.
 */
function autoPageColour() {
	// Sets text in info box
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let url = tabs[0].url;
		let domain = url.split(/\/|\?/)[2];
		let id = tabs[0].id;
		if (((url.startsWith("http:") || url.startsWith("https:")) && protectedDomain[domain] != "PROTECTED") || url.startsWith("file:")) {
			browser.tabs.sendMessage(
				id,
				{
					reason: "INFO_REQUEST",
					dynamic: pref.dynamic,
					noThemeColour: pref.noThemeColour,
					reservedColor_webPage: reservedColour_webPage,
				},
				(RESPONSE_INFO) => {
					if (RESPONSE_INFO) {
						infoDisplay.innerText = RESPONSE_INFO.display;

						if (infoAction) {
							infoAction.onclick = () => {
								pref.reservedColour_webPage[domain] = infoAction.dataset.action;
								reservedColour_webPage = pref.reservedColour_webPage;
								browser.storage.local.set({
									custom: true,
									reservedColor_webPage: pref.reservedColour_webPage,
								});
								load();
							};
						}
					} else if (url.endsWith(".pdf") || tabs[0].title.endsWith(".pdf")) {
						infoDisplay.innerText = msg("colourForPDFViewer");
					} else if (tabs[0].favIconUrl && tabs[0].favIconUrl.startsWith("chrome:")) {
						infoDisplay.innerText = msg("pageIsProtected");
					} else if (url.endsWith("http://" + tabs[0].title) || url.endsWith("https://" + tabs[0].title)) {
						infoDisplay.innerText = msg("colourForPlainTextViewer");
					} else {
						infoDisplay.innerText = msg("errorOccured");
					}
				}
			);
		} else if (url.startsWith("about:firefoxview") || url.startsWith("about:home") || url.startsWith("about:newtab")) {
			infoDisplay.innerText = msg("colourForHomePage");
		} else if (url.startsWith("moz-extension:")) {
			let uuid = url.split(/\/|\?/)[2];
			browser.management.getAll().then((addon_list) => {
				let breakLoop = false;
				for (let addon of addon_list) {
					if (addon.type === "extension" && addon.hostPermissions) {
						for (let host of addon.hostPermissions) {
							if (host.startsWith("moz-extension:") && uuid === host.split(/\/|\?/)[2]) {
								if (reservedColour_webPage[`Add-on ID: ${addon.id}`]) {
									infoDisplay.innerHTML = msg("useDefaultColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										delete pref.reservedColour_webPage[`Add-on ID: ${addon.id}`];
										reservedColour_webPage = pref.reservedColour_webPage;
										browser.storage.local.set({
											custom: true,
											reservedColor_webPage: pref.reservedColour_webPage,
										});
									};
								} else if (recommendedColour_addon[addon.id]) {
									infoDisplay.innerHTML = msg("useRecommendedColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										pref.reservedColour_webPage[`Add-on ID: ${addon.id}`] = recommendedColour_addon[addon.id];
										reservedColour_webPage = pref.reservedColour_webPage;
										browser.storage.local.set({
											custom: true,
											reservedColor_webPage: pref.reservedColour_webPage,
										});
									};
								} else {
									infoDisplay.innerHTML = msg("specifyColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										pref.reservedColour_webPage[`Add-on ID: ${addon.id}`] = "#333333";
										reservedColour_webPage = pref.reservedColour_webPage;
										browser.storage.local
											.set({
												custom: true,
												reservedColor_webPage: pref.reservedColour_webPage,
											})
											.then(() => browser.runtime.openOptionsPage());
									};
								}
								breakLoop = true;
								break;
							}
						}
					}
					if (breakLoop) break;
				}
			});
		} else {
			infoDisplay.innerHTML = msg("pageIsProtected");
		}
	});
	browser.theme.getCurrent().then((currentTheme) => {
		body.style.backgroundColor = currentTheme["colors"]["popup"];
		body.style.color = currentTheme["colors"]["popup_text"];
		if (currentTheme["colors"]["popup_text"] === "rgb(0, 0, 0)") body.classList.replace("dark", "light");
		else body.classList.replace("light", "dark");
	});
	if (pref.scheme === "light" || (pref.scheme === "system" && lightModeDetected())) {
		allowDarkLightCheckboxText.innerHTML = msg("allowDarkTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_dark");
	} else {
		allowDarkLightCheckboxText.innerHTML = msg("allowLightTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_bright");
	}
}

// Light Mode Match Media on option page
const lightModeDetection_p = window.matchMedia("(prefers-color-scheme: light)");
if (lightModeDetection_p)
	lightModeDetection_p.onchange = () => {
		if (colourSchemeAuto.checked) autoOptionsColour();
	};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect.
 */
function lightModeDetected() {
	return lightModeDetection_p && lightModeDetection_p.matches;
}

/**
 * Inquires localised messages.
 * @param {string} key handle in _locales.
 */
function msg(key, placeholder) {
	return browser.i18n.getMessage(key, placeholder);
}
