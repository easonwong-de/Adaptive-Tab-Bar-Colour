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
	toolbarBorder: 0,
	toolbarField: 0.05,
	toolbarFieldBorder: 0.1,
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
var currentReservedColour;

/**
 * Caches pref into local variables and checks integrity.
 */
function cachePref(storedPref) {
	pref = Object.assign({}, storedPref);
	currentReservedColour = pref.custom ? pref.reservedColour : {};
	return (
		pref.scheme != null &&
		pref.allowDarkLight != null &&
		pref.dynamic != null &&
		pref.noThemeColour != null &&
		pref.tabbar != null &&
		pref.tabSelected != null &&
		pref.toolbar != null &&
		pref.toolbarBorder != null &&
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
let allowDarkLightCheckbox = document.getElementById("allow-dark-light");
let allowDarkLightCheckboxText = document.getElementById("force_mode_caption");
let dynamicCheckbox = document.getElementById("dynamic");
let noThemeColourCheckbox = document.getElementById("no-theme-color");
let moreCustomButton = document.getElementById("custom_popup");

settings.hidden = true;
loading.hidden = false;

load();

// Updates popup's colour upon theme updates
browser.theme.onUpdated.addListener(updatePopup);
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
			updatePopup();
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
	updatePopup();
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
function updatePopup() {
	// Sets text in info box
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let url = tabs[0].url;
		let domain = url.split(/\/|\?/)[2];
		if (domain in protectedDomain) setInfoDisplay("protected_page");
		else if (url.startsWith("http:") || url.startsWith("https:") || url.startsWith("file:"))
			loadInfoForWebpage(tabs[0]);
		else if (url.startsWith("moz-extension:")) loadInfoForAddonPage(tabs[0]);
		else if (url.startsWith("about:firefoxview") || url.startsWith("about:home") || url.startsWith("about:newtab"))
			setInfoDisplay("home_page");
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
	let infoDisplay = document.getElementById("info_display_wrapper");
	let additionalInfoDisplay = infoDisplay.querySelector(`[name='${reason}'] .additional_info`);
	let infoActionButton = infoDisplay.querySelector(`[name='${reason}'] .info_action`);
	infoDisplay.className = reason;
	if (additionalInfo) additionalInfoDisplay.textContent = additionalInfo;
	if (infoAction) infoActionButton.onclick = infoAction;
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
			reservedColour: currentReservedColour,
		},
		(RESPONSE_INFO) => {
			if (RESPONSE_INFO) {
				let reason = RESPONSE_INFO.reason;
				let action = null;
				if (reason == "theme_unignored" || reason == "theme_used") action = "IGNORE_THEME";
				else if (reason == "theme_ignored") action = "UN_IGNORE_THEME";
				if (action) {
					setInfoDisplay(reason, null, () => {
						pref.reservedColour[domain] = action;
						currentReservedColour = pref.reservedColour;
						browser.storage.local
							.set({
								custom: true,
								reservedColour: pref.reservedColour,
							})
							.then(load);
					});
				} else {
					setInfoDisplay(reason);
				}
			} else if (url.endsWith(".pdf") || tab.title.endsWith(".pdf")) setInfoDisplay("pdf_viewer");
			else if (tab.favIconUrl && tab.favIconUrl.startsWith("chrome:")) setInfoDisplay("protected_page");
			else if (url.endsWith("http://" + tab.title) || url.endsWith("https://" + tab.title))
				setInfoDisplay("text_viewer");
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
				else if (currentReservedColour[`Add-on ID: ${addon.id}`])
					setInfoDisplay("addon_default", addon.name, () => specifyColourForAddon(addon.id, null));
				else if (recommendedColour_addon[addon.id])
					setInfoDisplay("addon_recom", addon.name, () =>
						specifyColourForAddon(addon.id, recommendedColour_addon[addon.id])
					);
				else
					setInfoDisplay("addon_specify", addon.name, () => specifyColourForAddon(addon.id, "#333333", true));
				foundAssociatedAddon = true;
				break;
			}
			if (foundAssociatedAddon) break;
		}
	});
}

function specifyColourForAddon(addonID, colour, openOptionsPage = false) {
	if (colour) pref.reservedColour[`Add-on ID: ${addonID}`] = colour;
	else delete pref.reservedColour[`Add-on ID: ${addonID}`];
	currentReservedColour = pref.reservedColour;
	browser.storage.local
		.set({
			custom: true,
			reservedColour: pref.reservedColour,
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
