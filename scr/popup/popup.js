"use strict";

import { recommendedColour_addon, default_protectedPageColour } from "../default_values.js";
import preference from "../preference.js";
import { msg } from "../utility.js";

const pref = new preference();

const body = document.querySelector("body");
const loading = document.querySelector("#loading-wrapper");
const settings = document.querySelector("#settings");
const infoDisplay = document.querySelector("#info-display-wrapper");
const allowDarkLightCheckboxCaption = document.querySelector("#allow-dark-light-caption");
const checkboxes = document.querySelectorAll("[type='checkbox']");
const moreCustomButton = document.querySelector("#custom-popup");

checkboxes.forEach((checkbox) => {
	checkbox.onclick = async () => {
		pref[checkbox.name] = checkbox.checked;
		await applySettings();
	};
});

moreCustomButton.onclick = () => browser.runtime.openOptionsPage();

/**
 * Changes the content shown in info display panel.
 *
 * @param {Object} options Options to configure the info display panel.
 * @param {string} options.reason Determines which page to show on the panel by setting the class name of the info display.
 * @param {string} [options.additionalInfo=null] Additional information to display on the panel.
 * @param {Function} [options.infoAction=null] The function called by the `.info-action` button being clicked.
 */
function setInfoDisplay({ reason, additionalInfo = null, infoAction = null }) {
	infoDisplay.className = reason;
	const additionalInfoDisplay = infoDisplay.querySelector(`[name='${reason}'] .additional-info`);
	const infoActionButton = infoDisplay.querySelector(`[name='${reason}'] .info-action`);
	if (additionalInfo) additionalInfoDisplay.textContent = additionalInfo;
	if (infoAction) infoActionButton.onclick = infoAction;
}

async function getWebPageInfo(tab) {
	const url = new URL(tab.url);
	try {
		const response = await browser.tabs.sendMessage(tab.id, { header: "INFO_REQUEST" });
		const actions = {
			THEME_UNIGNORED: { headerType: "URL", type: "THEME_COLOUR", value: false },
			THEME_USED: { headerType: "URL", type: "THEME_COLOUR", value: false },
			THEME_IGNORED: { headerType: "URL", type: "THEME_COLOUR", value: true },
		};
		const reason = response.reason;
		if (reason in actions) {
			return {
				reason: reason,
				additionalInfo: null,
				infoAction: async () => {
					pref.addPolicy({ header: url.hostname, ...actions[reason] });
					await applySettings();
					await updatePopupSelection();
				},
			};
		} else {
			return { reason: reason };
		}
	} catch (error) {
		if (url.href.endsWith(".pdf") || tab.title.endsWith(".pdf")) {
			return { reason: "PDF_VIEWER" };
		} else if (tab.favIconUrl?.startsWith("chrome:")) {
			return { reason: "PROTECTED_PAGE" };
		} else if (new RegExp(`^https?:\/\/${tab.title}$`).test(url.href)) {
			return { reason: "TEXT_VIEWER" };
		} else {
			return { reason: "ERROR_OCCURRED" };
		}
	}
}

async function getAddonPageInfo(tab) {
	const uuid = tab.url.split(/\/|\?/)[2];
	const addonList = await browser.management.getAll();
	for (const addon of addonList) {
		if (!(addon.type === "extension" && addon.hostPermissions)) continue;
		for (const host of addon.hostPermissions) {
			if (!(host.startsWith("moz-extension:") && uuid === host.split(/\/|\?/)[2])) {
				continue;
			} else if (pref.getPolicy(addon.id, "ADDON_ID")) {
				return {
					reason: "ADDON_SPECIFIED",
					additionalInfo: addon.name,
					infoAction: async () => await specifyColourForAddon(addon.id, null),
				};
			} else if (addon.id in recommendedColour_addon) {
				return {
					reason: "ADDON_RECOM",
					additionalInfo: addon.name,
					infoAction: async () => await specifyColourForAddon(addon.id, recommendedColour_addon[addon.id]),
				};
			} else {
				return {
					reason: "ADDON_DEFAULT",
					additionalInfo: addon.name,
					infoAction: async () => await specifyColourForAddon(addon.id, "#333333", true),
				};
			}
		}
	}
}

async function specifyColourForAddon(addonID, colour, openOptionsPage = false) {
	if (colour) {
		pref.addPolicy({
			headerType: "ADDON_ID",
			header: addonID,
			type: "COLOUR",
			value: colour,
		});
	} else {
		pref.removePolicy(pref.getPolicyID(addonID, "ADDON_ID"));
	}
	await applySettings();
	if (openOptionsPage) browser.runtime.openOptionsPage();
}

async function updateInfoDisplay() {
	const tabsOnCurrentWindow = await browser.tabs.query({ active: true, status: "complete", currentWindow: true });
	const tab = tabsOnCurrentWindow[0];
	const url = new URL(tab.url);
	if (
		url.href.startsWith("about:firefoxview") ||
		url.href.startsWith("about:home") ||
		url.href.startsWith("about:newtab")
	) {
		setInfoDisplay({ reason: "HOME_PAGE" });
	} else if (url.protocol === "about:" || url.hostname in default_protectedPageColour) {
		setInfoDisplay({ reason: "PROTECTED_PAGE" });
	} else if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:") {
		setInfoDisplay(await getWebPageInfo(tab));
	} else if (url.protocol === "moz-extension:") {
		setInfoDisplay(await getAddonPageInfo(tab));
	} else {
		setInfoDisplay({ reason: "PROTECTED_PAGE" });
	}
}

async function updatePopupColour() {
	const theme = await browser.theme.getCurrent();
	body.style.backgroundColor = theme["colors"]["popup"];
	body.style.color = theme["colors"]["popup_text"];
}

async function updateAllowDarkLightText() {
	const scheme = await browser.runtime.sendMessage({ header: "SCHEME_REQUEST" });
	if (scheme === "light") {
		allowDarkLightCheckboxCaption.textContent = msg("allowDarkTabBar");
		allowDarkLightCheckboxCaption.parentElement.title = msg("allowDarkTabBarTooltip");
	} else {
		allowDarkLightCheckboxCaption.textContent = msg("allowLightTabBar");
		allowDarkLightCheckboxCaption.parentElement.title = msg("allowLightTabBarTooltip");
	}
}

/**
 * Loads all prefs.
 */
async function updatePopupSelection() {
	checkboxes.forEach((checkbox) => (checkbox.checked = pref[checkbox.name]));
}

/**
 * Updates infobox's content and popup's text and background colour.
 */
async function updatePopup() {
	await pref.load();
	if (pref.valid()) {
		await updateInfoDisplay();
		await updatePopupColour();
		await updateAllowDarkLightText();
		await updatePopupSelection();
		loading.hidden = true;
		settings.hidden = false;
	} else {
		browser.runtime.sendMessage({ header: "INIT_REQUEST" });
	}
}

/**
 * Updates the text content and title of elements based on localisation data attributes.
 *
 * Finds elements with `data-text`, `data-title`, or `data-placeholder` attributes, retrieves the localised text using the `msg` function, and assigns it to the element's `textContent`, `title`, or `placeholder`.
 */
function localise() {
	document.querySelectorAll("[data-text]").forEach((element) => {
		element.textContent = msg(element.dataset.text);
	});
	document.querySelectorAll("[data-title]").forEach((element) => {
		element.title = msg(element.dataset.title);
	});
	document.querySelectorAll("[data-placeholder]").forEach((element) => {
		element.placeholder = msg(element.dataset.placeholder);
	});
}

/**
 * Triggers colour update.
 */
async function applySettings() {
	await pref.save();
	await browser.runtime.sendMessage({ header: "PREF_CHANGED" });
}

browser.storage.onChanged.addListener(updatePopup);
browser.theme.onUpdated.addListener(updatePopup);
document.addEventListener("pageshow", updatePopup);
document.addEventListener("DOMContentLoaded", localise);
updatePopup();
