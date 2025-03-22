"use strict";

import { recommendedAddonPageColour, restrictedSiteColour } from "../default_values.js";
import { setSliderValue, setupSlider } from "../elements.js";
import preference from "../preference.js";
import { localise } from "../utility.js";

const pref = new preference();

const loadingWrapper = document.querySelector("#loading-wrapper");
const settingsWrapper = document.querySelector("#settings-wrapper");
const infoDisplay = document.querySelector("#info-display-wrapper");

const moreCustomButton = document.querySelector("#custom-popup");
moreCustomButton.onclick = () => browser.runtime.openOptionsPage();

const sliders = document.querySelectorAll(".slider");
sliders.forEach((slider) =>
	setupSlider(slider, (key, value) => {
		pref[key] = value;
		applySettings();
	})
);

/**
 * @param {tabs.Tab} tab
 */
async function getWindowInfo(tab) {
	const url = new URL(tab.url);
	const windowId = tab.windowId;
	const windowInfo = await browser.runtime.sendMessage({ header: "INFO_REQUEST", windowId: windowId });
	const themeReasons = {
		THEME_UNIGNORED: { headerType: "URL", type: "THEME_COLOUR", value: false },
		THEME_USED: { headerType: "URL", type: "THEME_COLOUR", value: false },
		THEME_IGNORED: { headerType: "URL", type: "THEME_COLOUR", value: true },
	};
	const reason = windowInfo.reason;
	if (reason in themeReasons) {
		return {
			reason: reason,
			additionalInfo: null,
			infoAction: async () => {
				pref.addPolicy({ header: url.hostname, ...themeReasons[reason] });
				await applySettings();
				await updatePopupSelection();
			},
		};
	} else {
		return windowInfo;
	}
}

/**
 * @param {tabs.Tab} tab
 */
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
			} else if (addon.id in recommendedAddonPageColour) {
				return {
					reason: "ADDON_RECOM",
					additionalInfo: addon.name,
					infoAction: async () => await specifyColourForAddon(addon.id, recommendedAddonPageColour[addon.id]),
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

/**
 * @param {string} addonId
 * @param {string} colourHex
 * @param {boolean} openOptionsPage
 */
async function specifyColourForAddon(addonId, colourHex, openOptionsPage = false) {
	if (colourHex) {
		pref.addPolicy({
			headerType: "ADDON_ID",
			header: addonId,
			type: "COLOUR",
			value: colourHex,
		});
	} else {
		pref.removePolicy(pref.getPolicyId(addonId, "ADDON_ID"));
	}
	await applySettings();
	if (openOptionsPage) browser.runtime.openOptionsPage();
}

function updateSliders() {
	sliders.forEach((slider) => {
		setSliderValue(slider, pref[slider.dataset.pref]);
	});
}

/**
 * Changes the content shown in info display panel.
 *
 * @param {Object} options Options to configure the info display panel.
 * @param {string} options.reason Determines which page to show on the panel by setting the class name of the info display.
 * @param {string | null} options.additionalInfo Additional information to display on the panel.
 * @param {function | null} options.infoAction The function called by the `.info-action` button being clicked.
 */
function setInfoDisplay({ reason, additionalInfo = null, infoAction = null }) {
	infoDisplay.className = reason;
	const additionalInfoDisplay = infoDisplay.querySelector(`[name='${reason}'] .additional-info`);
	const infoActionButton = infoDisplay.querySelector(`[name='${reason}'] .info-action`);
	if (additionalInfo) additionalInfoDisplay.textContent = additionalInfo;
	if (infoAction) infoActionButton.onclick = infoAction;
}

async function updateInfoDisplay() {
	const tabsOnCurrentWindow = await browser.tabs.query({ active: true, status: "complete", currentWindow: true });
	if (tabsOnCurrentWindow.length === 0) {
		setInfoDisplay({ reason: "PROTECTED_PAGE" });
		return;
	}
	const tab = tabsOnCurrentWindow[0];
	const url = new URL(tab.url);
	if (
		url.href.startsWith("about:firefoxview") ||
		url.href.startsWith("about:home") ||
		url.href.startsWith("about:newtab")
	) {
		setInfoDisplay({ reason: "HOME_PAGE" });
	} else if (url.protocol === "about:" || url.hostname in restrictedSiteColour) {
		setInfoDisplay({ reason: "PROTECTED_PAGE" });
	} else if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:") {
		setInfoDisplay(await getWindowInfo(tab));
	} else if (url.protocol === "moz-extension:") {
		setInfoDisplay(await getAddonPageInfo(tab));
	} else {
		setInfoDisplay({ reason: "PROTECTED_PAGE" });
	}
}

async function updatePopupColour() {
	const body = document.querySelector("body");
	const theme = await browser.theme.getCurrent();
	body.style.backgroundColor = theme["colors"]["popup"];
}

/**
 * Updates infobox's content and popup's text and background colour.
 */
async function updatePopup() {
	await pref.load();
	if (pref.valid()) {
		updateSliders();
		await updateInfoDisplay();
		await updatePopupColour();
		loadingWrapper.hidden = true;
		settingsWrapper.hidden = false;
	} else {
		browser.runtime.sendMessage({ header: "INIT_REQUEST" });
	}
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
updatePopup();

document.addEventListener("DOMContentLoaded", () => localise(document));
