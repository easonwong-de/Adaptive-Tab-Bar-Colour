"use strict";

import preference from "../preference.js";
import { recommendedAddonPageColour, restrictedSiteColour } from "../default_values.js";
import { setSliderValue, setupSlider } from "../elements.js";
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

function updateSliders() {
	sliders.forEach((slider) => {
		setSliderValue(slider, pref[slider.dataset.pref]);
	});
}

async function updateInfoDisplay() {
	try {
		const window = await browser.windows.getCurrent();
		const windowId = window.id;
		const info = await browser.runtime.sendMessage({ header: "INFO_REQUEST", windowId: windowId });
		const actions = {
			THEME_UNIGNORED: { headerType: "URL", type: "THEME_COLOUR", value: false },
			THEME_USED: { headerType: "URL", type: "THEME_COLOUR", value: false },
			THEME_IGNORED: { headerType: "URL", type: "THEME_COLOUR", value: true },
		};
		if (window.tabs.length === 0) {
			setInfoDisplay({ reason: "PROTECTED_PAGE" });
		} else if (info.reason === "ADDON") {
			const addonInfo = await getAddonPageInfo(info.additionalInfo);
			setInfoDisplay(addonInfo);
		} else if (info.reason in actions) {
			setInfoDisplay({
				reason: info.reason,
				additionalInfo: null,
				infoAction: async () => {
					pref.addPolicy({ header: new URL(window.tabs[0].url).hostname, ...actions[reason] });
					await applySettings();
					await updatePopupSelection();
				},
			});
		} else {
			setInfoDisplay(info);
		}
	} catch (error) {
		setInfoDisplay({ reason: "ERROR_OCCURRED" });
	}
}

/**
 * @param {string} addonId
 */
async function getAddonPageInfo(addonId) {
	addonName = (await browser.management.get(addonId)).name;
	if (pref.getPolicy(addonId, "ADDON_ID")) {
		return {
			reason: "ADDON_SPECIFIED",
			additionalInfo: addonName,
			infoAction: async () => await specifyColourForAddon(addonId, null),
		};
	} else if (addon.id in recommendedAddonPageColour) {
		return {
			reason: "ADDON_RECOM",
			additionalInfo: addonName,
			infoAction: async () => await specifyColourForAddon(addonId, recommendedAddonPageColour[addonId]),
		};
	} else {
		return {
			reason: "ADDON_DEFAULT",
			additionalInfo: addonName,
			infoAction: async () => await specifyColourForAddon(addonId, "#333333", true),
		};
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

async function updatePopupColour() {
	const body = document.body;
	const theme = await browser.theme.getCurrent();
	body.style.backgroundColor = theme.colors.popup;
	body.style.color = theme.colors.popup_text;
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
