import {
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_reservedColour,
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

// Current colour lookup table
var reservedColour;

/**
 * Caches pref into local variables and checks integrity.
 */
function cachePref(storedPref) {
	pref = storedPref;
	reservedColour = Object.assign({}, pref.custom ? pref.reservedColour : default_reservedColour);
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

let body = document.getElementsByTagName("body")[0];
let loading = document.getElementById("loading_wrapper");
let settings = document.getElementById("settings");
let colourSchemeLight = document.getElementById("colour_scheme_light");
let colourSchemeDark = document.getElementById("colour_scheme_dark");
let colourSchemeAuto = document.getElementById("colour_scheme_auto");
let allowDarkLightCheckbox = document.getElementById("allow_dark_light");
let allowDarkLightCheckboxText = document.getElementById("force_mode_caption");
let dynamicCheckbox = document.getElementById("dynamic");
let noThemeColourCheckbox = document.getElementById("no_theme_color");
let moreCustomButton = document.getElementById("custom_popup");
let infoDisplay = document.getElementById("info_display_wrapper");
let infoAction = document.getElementById("info_action");

settings.hidden = true;
loading.hidden = false;

load();

// Updates popup's colour upon theme updates
browser.theme.onUpdated.addListener(updatePopupColour);
// Loads prefs when popup is opened
document.addEventListener("pageshow", load);
// Syncs prefs on popup
browser.storage.onChanged.addListener(applySettings);

/**
 * Loads all prefs.
 */
function load() {
	browser.storage.local.get((storedPref) => {
		if (cachePref(storedPref)) {
			colourSchemeDark.checked = pref.scheme == "dark";
			colourSchemeLight.checked = pref.scheme == "light";
			colourSchemeAuto.checked = pref.scheme == "auto";
			allowDarkLightCheckbox.checked = pref.allowDarkLight;
			dynamicCheckbox.checked = pref.dynamic;
			noThemeColourCheckbox.checked = pref.noThemeColour;
			updatePopupColour();
			loading.hidden = true;
			settings.hidden = false;
		} else browser.runtime.sendMessage({ reason: "INIT_REQUEST" });
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
		changeColourScheme("auto");
	}
});

/**
 * Sets the colour scheme, and updates appearance of option page.
 * @param {string} scheme "light", "dark", or "system".
 */
function changeColourScheme(scheme) {
	pref.scheme = scheme;
	browser.storage.local.set({ scheme: scheme }).then(applySettings);
	updatePopupColour();
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
 * Updates infobox's content and popup's text and background colour.
 */
function updatePopupColour() {
	// Sets text in info box
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let url = tabs[0].url;
		let domain = url.split(/\/|\?/)[2];
		if (domain in protectedDomain) setInfoDisplay("protected_page");
		else if (url.startsWith("http:") || url.startsWith("https:") || url.startsWith("file:")) loadInfoForWebpage(tabs[0]);
		else if (url.startsWith("moz-extension:")) loadInfoForAddonPage(tabs[0]);
		else if (url.startsWith("about:firefoxview") || url.startsWith("about:home") || url.startsWith("about:newtab")) setInfoDisplay("home_page");
		else setInfoDisplay("protected_page");
	});
	// Sets text and background colour for the popup
	browser.theme.getCurrent().then((currentTheme) => {
		body.style.backgroundColor = currentTheme["colors"]["popup"];
		body.style.color = currentTheme["colors"]["popup_text"];
		if (currentTheme["colors"]["popup_text"] == "rgb(0, 0, 0)") body.classList.replace("dark", "light");
		else body.classList.replace("light", "dark");
	});
	// Changes the text of the allow dark/light tab bar button
	if (pref.scheme == "light" || (pref.scheme == "auto" && lightModeDetected())) {
		allowDarkLightCheckboxText.textContent = msg("allowDarkTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_dark");
	} else {
		allowDarkLightCheckboxText.textContent = msg("allowLightTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_bright");
	}
}

function setInfoDisplay(reason, additionalInfo = null, infoAction = null) {
	infoDisplay.className = reason;
	if (additionalInfo) infoDisplay.querySelector(`[name='${reason}'] .additional_info`).textContent = additionalInfo;
	if (infoAction) infoDisplay.querySelector(`[name='${reason}'] .info_action`).onclick = infoAction;
}

function loadInfoForWebpage(tab) {
	let url = tab.url;
	let domain = url.split(/\/|\?/)[2];
	let tabID = tab.id;
	browser.tabs.sendMessage(
		tabID,
		{
			reason: "INFO_REQUEST",
			dynamic: pref.dynamic,
			noThemeColour: pref.noThemeColour,
			reservedColour: pref.reservedColour,
		},
		(RESPONSE_INFO) => {
			if (RESPONSE_INFO) {
				setInfoDisplay(RESPONSE_INFO.reason);

				if (infoAction) {
					// Need to change
					infoAction.onclick = () => {
						pref.reservedColour[domain] = infoAction.dataset.action;
						reservedColour = pref.reservedColour;
						browser.storage.local.set({
							custom: true,
							reservedColour: pref.reservedColour,
						});
						load();
					};
				}
			} else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) setInfoDisplay("pdf_viewer");
			else if (tab.favIconUrl && tab.favIconUrl.startsWith("chrome:")) setInfoDisplay("protected_page");
			else if (url.endsWith("http://" + tab.title) || url.endsWith("https://" + tab.title)) setInfoDisplay("text_viewer");
			else setInfoDisplay("error_occurred");
		}
	);
}

function loadInfoForAddonPage(tab) {
	let uuid = tab.url.split(/\/|\?/)[2];
	browser.management.getAll().then((addonList) => {
		let foundAssociatedAddon = false;
		for (let addon of addonList) {
			if (addon.type != "extension" || !addon.hostPermissions) continue;
			for (let host of addon.hostPermissions) {
				if (!host.startsWith("moz-extension:") || uuid != host.split(/\/|\?/)[2]) continue;
				else if (reservedColour[`Add-on ID: ${addon.id}`])
					setInfoDisplay("addon_default", addon.name, () => specifyColourForAddon(addon.id, null));
				else if (recommendedColour_addon[addon.id])
					setInfoDisplay("addon_recom", addon.name, () => specifyColourForAddon(addon.id, recommendedColour_addon[addon.id]));
				else setInfoDisplay("addon_specify", addon.name, () => specifyColourForAddon(addon.id, "#333333", true));
				foundAssociatedAddon = true;
				break;
			}
			if (foundAssociatedAddon) break;
		}
	});
}

function specifyColourForAddon(addonID, colour, openOptionsPage = false) {
	if (colour) reservedColour[`Add-on ID: ${addonID}`] = colour;
	else delete reservedColour[`Add-on ID: ${addonID}`];
	browser.storage.local
		.set({
			custom: true,
			reservedColour: reservedColour,
		})
		.then(() => {
			if (openOptionsPage) browser.runtime.openOptionsPage();
		});
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
