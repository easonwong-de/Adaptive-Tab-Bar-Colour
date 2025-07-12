"use strict";

import preference from "../preference.js";
import { localise, i18n, supportsThemeAPI } from "../utility.js";
import {
	setupCheckbox,
	setCheckboxValue,
	setupSlider,
	setSliderValue,
	setupColourInput,
	setColourInputValue,
	getColourInputValue,
	setupPolicyHeaderInput,
	setPolicyHeaderInputValue,
	setupThemeColourSwitch,
	setThemeColourSwitchValue,
	getThemeColourSwitchValue,
	setupQuerySelectorInput,
	setQuerySelectorInputValue,
	getQuerySelectorInputValue,
	setColourPolicySectionId,
	setFlexiblePolicySectionId,
} from "../elements.js";

const pref = new preference();

const settingsWrapper = document.querySelector("#settings-wrapper");
const policyList = document.querySelector("#policy-list");

const tabSwitches = document.querySelectorAll("input[name='tab-switch']");
tabSwitches.forEach((tabSwitch) => {
	tabSwitch.addEventListener("change", () => (settingsWrapper.className = tabSwitch.id));
});

const checkboxes = document.querySelectorAll("[type='checkbox']");
checkboxes.forEach((checkbox) =>
	setupCheckbox(checkbox, async (key, value) => {
		pref[key] = value;
		await applySettings();
	})
);

const sliders = document.querySelectorAll(".slider");
sliders.forEach((slider) =>
	setupSlider(slider, async (key, value) => {
		pref[key] = value;
		await applySettings();
	})
);

const fixedPolicies = document.querySelectorAll(".section.fixed-policy");
fixedPolicies.forEach((fixedPolicySection) => {
	const colourInputWrapper = fixedPolicySection.querySelector(".colour-input-wrapper");
	const key = colourInputWrapper.dataset.pref;
	setupColourInput(colourInputWrapper, pref[key], async (colour) => {
		pref[key] = colour;
		await applySettings();
	});
});

document.querySelector("#add-new-rule").onclick = async () => {
	const policy = {
		headerType: "URL",
		header: "",
		type: "COLOUR",
		value: "#000000",
	};
	const id = pref.addPolicy(policy);
	policyList.appendChild(createPolicySection(id, policy));
	await applySettings();
};

/**
 * @param {number} id
 * @param {object} policy
 * @returns
 */
function createPolicySection(id, policy) {
	if (policy.headerType === "URL") {
		const templateFlexiblePolicySection = document.querySelector("#template .policy.flexible-policy");
		const policySection = templateFlexiblePolicySection.cloneNode(true);
		setupFlexiblePolicySection(policySection, id, policy);
		return policySection;
	} else if (policy.headerType === "ADDON_ID") {
		const templateColourPolicySection = document.querySelector("#template .policy.colour-policy");
		const policySection = templateColourPolicySection.cloneNode(true);
		setupColourPolicySection(policySection, id, policy);
		return policySection;
	}
}

/**
 * @param {HTMLElement} policySection
 * @param {number} id
 * @param {object} policy
 */
function setupFlexiblePolicySection(policySection, id, policy) {
	setFlexiblePolicySectionId(policySection, id);
	policySection.classList.toggle("warning", policy.header === "");
	const select = policySection.querySelector("select");
	select.className = select.value = policy.type;
	select.addEventListener("change", async () => {
		pref.siteList[id].type = select.className = select.value;
		switch (select.value) {
			case "COLOUR":
				pref.siteList[id].value = getColourInputValue(colourInputWrapper);
				break;
			case "THEME_COLOUR":
				pref.siteList[id].value = getThemeColourSwitchValue(themeColourSwitch);
				break;
			case "QUERY_SELECTOR":
				pref.siteList[id].value = getQuerySelectorInputValue(querySelectorInputWrapper);
				break;
			default:
				break;
		}
		await applySettings();
	});
	const policyHeaderInputWrapper = policySection.querySelector(".policy-header-input-wrapper");
	const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
	const themeColourSwitch = policySection.querySelector(".theme-colour-switch");
	const querySelectorInputWrapper = policySection.querySelector(".qs-input-wrapper");
	const deleteButton = policySection.querySelector("button");
	let initialColour = "#000000";
	let initialUseThemeColour = true;
	let initialQuerySelector = "";
	switch (policy.type) {
		case "COLOUR":
			initialColour = policy.value;
			break;
		case "THEME_COLOUR":
			initialUseThemeColour = policy.value;
			break;
		case "QUERY_SELECTOR":
			initialQuerySelector = policy.value;
			break;
		default:
			break;
	}
	setupPolicyHeaderInput(policyHeaderInputWrapper, policy.header, async (newHeader) => {
		policySection.classList.toggle("warning", newHeader === "");
		pref.siteList[id].header = newHeader;
		await applySettings();
	});
	setupColourInput(colourInputWrapper, initialColour, async (newColour) => {
		pref.siteList[id].value = newColour;
		await applySettings();
	});
	setupThemeColourSwitch(themeColourSwitch, initialUseThemeColour, async (newUseThemeColour) => {
		pref.siteList[id].value = newUseThemeColour;
		await applySettings();
	});
	setupQuerySelectorInput(querySelectorInputWrapper, initialQuerySelector, async (newQuerySelector) => {
		pref.siteList[id].value = newQuerySelector;
		await applySettings();
	});
	deleteButton.onclick = async () => {
		pref.removePolicy(policySection.dataset.id);
		policySection.remove();
		await applySettings();
	};
}

/**
 * @param {HTMLElement} policySection
 * @param {number} id
 * @param {object} policy
 */
async function setupColourPolicySection(policySection, id, policy) {
	setColourPolicySectionId(policySection, id);
	const policyHeader = policySection.querySelector(".policy-header");
	const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
	const deleteButton = policySection.querySelector("button");
	setupColourInput(colourInputWrapper, policy.value, async (newColour) => {
		pref.siteList[id].value = newColour;
		await applySettings();
	});
	deleteButton.onclick = async () => {
		pref.removePolicy(policySection.dataset.id);
		policySection.remove();
		await applySettings();
	};
	try {
		const addon = await browser.management.get(policy.header);
		policyHeader.textContent = addon.name;
	} catch (error) {
		policyHeader.textContent = i18n("addonNotFound");
	}
}

document.querySelector("#export-pref").onclick = () => {
	const exportPref = document.querySelector("#export-pref-link");
	const blob = new Blob([pref.prefToJSON()], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	exportPref.href = url;
	exportPref.click();
	alert(i18n("settingsAreExported"));
};

const importPref = document.querySelector("#import-pref-link");
importPref.addEventListener("change", async () => {
	const file = importPref.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = async () => {
		const prefJSON = reader.result;
		if (await pref.JSONToPref(prefJSON)) {
			await applySettings();
			await updateUI();
			alert(i18n("settingsAreImported"));
		} else {
			alert(i18n("importFailed"));
		}
	};
	reader.onerror = () => alert(i18n("importFailed"));
	reader.readAsText(file);
});

document.querySelector("#reset-theme-builder").onclick = async () => {
	if (!confirm(i18n("confirmResetThemeBuilder"))) return;
	[
		"tabbar",
		"tabbarBorder",
		"tabSelected",
		"tabSelectedBorder",
		"toolbar",
		"toolbarBorder",
		"toolbarField",
		"toolbarFieldBorder",
		"toolbarFieldOnFocus",
		"sidebar",
		"sidebarBorder",
		"popup",
		"popupBorder",
	].forEach((key) => pref.reset(key));
	await applySettings();
	await updateUI();
};

document.querySelector("#reset-site-list").onclick = async () => {
	if (!confirm(i18n("confirmResetSiteList"))) return;
	pref.reset("siteList");
	await applySettings();
	await updateUI();
};

document.querySelector("#reset-advanced").onclick = async () => {
	if (!confirm(i18n("confirmResetAdvanced"))) return;
	[
		"allowDarkLight",
		"dynamic",
		"noThemeColour",
		"compatibilityMode",
		"homeBackground_light",
		"homeBackground_dark",
		"fallbackColour_light",
		"fallbackColour_dark",
		"minContrast_light",
		"minContrast_dark",
	].forEach((key) => pref.reset(key));
	await applySettings();
	await updateUI();
};

async function updateOptionsPage() {
	await pref.load();
	if (pref.valid()) {
		document.hasFocus() ? await updateUINoInput() : await updateUI();
	} else {
		browser.runtime.sendMessage({ header: "INIT_REQUEST" });
	}
}

async function updateUINoInput() {
	updateCheckboxes();
	updateSliders();
	updateCompatibilityMode();
	await updateAllowDarkLightText();
}

async function updateUI() {
	updateCheckboxes();
	updateSliders();
	updateCompatibilityMode();
	updateFixedPolicySection();
	await updateSiteList();
	await updateAllowDarkLightText();
}

function updateCheckboxes() {
	checkboxes.forEach((checkbox) => setCheckboxValue(checkbox, pref[checkbox.dataset.pref]));
}

function updateSliders() {
	sliders.forEach((slider) => setSliderValue(slider, pref[slider.dataset.pref]));
}

/**
 * Update options page's UI related to compatibility mode.
 */
function updateCompatibilityMode() {
	document
		.querySelectorAll(`#tab-1 .slider:not([data-pref="tabbar"])`)
		.forEach((slider) => slider.classList.toggle("disabled", pref.compatibilityMode));
	document
		.querySelector("#allow-dark-light")
		.closest(".section")
		.classList.toggle("disabled", pref.compatibilityMode);
	document.querySelector(`#compatibility-mode`).classList.toggle("disabled", !supportsThemeAPI());
}

function updateFixedPolicySection() {
	fixedPolicies.forEach((fixedPolicySection) => {
		const colourInputWrapper = fixedPolicySection.querySelector(".colour-input-wrapper");
		const key = colourInputWrapper.dataset.pref;
		setColourInputValue(colourInputWrapper, pref[key]);
	});
}

async function updateSiteList() {
	for (const id in pref.siteList) {
		const policy = pref.siteList[id];
		const policySection = policyList.querySelector(`.policy[data-id='${id}']`);
		if (policy && !policySection) {
			policyList.appendChild(createPolicySection(id, policy));
		} else if (!policy && policySection) {
			policySection.remove();
		} else if (!policy && !policySection) {
			continue;
		} else if (policy.headerType === "URL" && policySection.classList.contains("flexible-policy")) {
			const select = policySection.querySelector("select");
			const policyHeaderInputWrapper = policySection.querySelector(".policy-header-input-wrapper");
			const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
			const themeColourSwitch = policySection.querySelector(".theme-colour-switch");
			const querySelectorInputWrapper = policySection.querySelector(".qs-input-wrapper");
			select.className = select.value = policy.type;
			policySection.classList.toggle("warning", policy.header === "");
			setPolicyHeaderInputValue(policyHeaderInputWrapper, policy.header);
			switch (policy.type) {
				case "COLOUR":
					setColourInputValue(colourInputWrapper, policy.value);
					break;
				case "THEME_COLOUR":
					setThemeColourSwitchValue(themeColourSwitch, policy.value);
					break;
				case "QUERY_SELECTOR":
					setQuerySelectorInputValue(querySelectorInputWrapper, policy.value);
					break;
				default:
					break;
			}
		} else if (policy.headerType === "ADDON_ID" && policySection.classList.contains("colour-policy")) {
			const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
			setColourInputValue(colourInputWrapper, policy.value);
		} else {
			policySection.replaceWith(createPolicySection(id, policy));
		}
	}
	policyList.querySelectorAll(`.policy`).forEach((policySection) => {
		if (!(policySection.dataset.id in pref.siteList)) {
			policySection.remove();
		}
	});
}

/**
 * @param {number} nthTry
 */
async function updateAllowDarkLightText(nthTry = 0) {
	try {
		const allowDarkLightTitle = document.querySelector("#allow-dark-light-title");
		const allowDarkLightCheckboxCaption = document.querySelector("#allow-dark-light-caption");
		const scheme = await browser.runtime.sendMessage({ header: "SCHEME_REQUEST" });
		if (scheme === "light") {
			allowDarkLightTitle.textContent = i18n("allowDarkTabBar");
			allowDarkLightCheckboxCaption.textContent = i18n("allowDarkTabBarTooltip");
		} else {
			allowDarkLightTitle.textContent = i18n("allowLightTabBar");
			allowDarkLightCheckboxCaption.textContent = i18n("allowLightTabBarTooltip");
		}
	} catch (error) {
		if (nthTry > 5) {
			console.error("Could not attain browser colour scheme.");
		} else {
			console.warn("Failed to attain browser colour scheme.");
			setTimeout(async () => await updateAllowDarkLightText(++nthTry), 50);
		}
	}
}

/**
 * Saves the preference to browser storage and triggers colour update.
 *
 * Maximum frequency is 4 Hz.
 */
const applySettings = (() => {
	let timeout;
	let lastCall = 0;
	const limitMs = 250;
	const action = async () => {
		await pref.save();
		await browser.runtime.sendMessage({ header: "PREF_CHANGED" });
	};
	return async () => {
		const now = Date.now();
		clearTimeout(timeout);
		if (now - lastCall >= limitMs) {
			lastCall = now;
			await action();
		} else {
			timeout = setTimeout(async () => {
				lastCall = Date.now();
				await action();
			}, limitMs - (now - lastCall));
		}
	};
})();

document.addEventListener("pageshow", updateOptionsPage);
browser.storage.onChanged.addListener(updateOptionsPage);
browser.theme?.onUpdated?.addListener(updateOptionsPage);

updateOptionsPage();

document.addEventListener("DOMContentLoaded", () => localise(document));
