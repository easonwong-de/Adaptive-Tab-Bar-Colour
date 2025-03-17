"use strict";

import preference from "../preference.js";
import { localise, msg } from "../utility.js";
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
const loadingWrapper = document.querySelector("#loading-wrapper");
const policyList = document.querySelector("#policy-list");

const tabSwitches = document.querySelectorAll("input[name='tab-switch']");
tabSwitches.forEach((tabSwitch) => {
	tabSwitch.addEventListener("change", () => (settingsWrapper.className = tabSwitch.id));
});

const checkboxes = document.querySelectorAll("[type='checkbox']");
checkboxes.forEach((checkbox) =>
	setupCheckbox(checkbox, (key, value) => {
		pref[key] = value;
		applySettings();
	})
);

const sliders = document.querySelectorAll(".slider");
sliders.forEach((slider) =>
	setupSlider(slider, (key, value) => {
		pref[key] = value;
		applySettings();
	})
);

const fixedPolicies = document.querySelectorAll(".section.fixed-policy");
fixedPolicies.forEach(setupFixedPolicySection);

/**
 * @param {HTMLElement} fixedPolicySection
 */
function setupFixedPolicySection(fixedPolicySection) {
	const colourInputWrapper = fixedPolicySection.querySelector(".colour-input-wrapper");
	const key = colourInputWrapper.dataset.pref;
	const resetButton = fixedPolicySection.querySelector("button");
	setupColourInput(colourInputWrapper, pref[key], (colour) => {
		pref[key] = colour;
		applySettings();
	});
	resetButton.onclick = async () => {
		pref.reset(key);
		await applySettings();
		setColourInputValue(colourInputWrapper, pref[key]);
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
	try {
		const addon = await browser.management.get(policy.header);
		policyHeader.textContent = addon.name;
	} catch (error) {
		policyHeader.textContent = msg("addonNotFound");
	}
	setupColourInput(colourInputWrapper, policy.value, (newColour) => {
		pref.siteList[id].value = newColour;
		applySettings();
	});
	deleteButton.onclick = () => {
		pref.removePolicy(policySection.dataset.id);
		policySection.remove();
		applySettings();
	};
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
	select.addEventListener("change", () => {
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
		applySettings();
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
	setupPolicyHeaderInput(policyHeaderInputWrapper, policy.header, (newHeader) => {
		policySection.classList.toggle("warning", newHeader === "");
		pref.siteList[id].header = newHeader;
		applySettings();
	});
	setupColourInput(colourInputWrapper, initialColour, (newColour) => {
		pref.siteList[id].value = newColour;
		applySettings();
	});
	setupThemeColourSwitch(themeColourSwitch, initialUseThemeColour, (newUseThemeColour) => {
		pref.siteList[id].value = newUseThemeColour;
		applySettings();
	});
	setupQuerySelectorInput(querySelectorInputWrapper, initialQuerySelector, (newQuerySelector) => {
		pref.siteList[id].value = newQuerySelector;
		applySettings();
	});
	deleteButton.onclick = () => {
		pref.removePolicy(policySection.dataset.id);
		policySection.remove();
		applySettings();
	};
}

document.querySelector("#add-new-rule").onclick = async () => {
	const policy = {
		headerType: "URL",
		header: "",
		type: "COLOUR",
		value: "#000000",
	};
	const id = pref.addPolicy(policy);
	policyList.appendChild(await createPolicySection(id, policy));
	applySettings();
};

document.querySelector("#export-pref").onclick = () => {
	const exportPref = document.querySelector("#export-pref-link");
	const blob = new Blob([pref.prefToJSON()], { type: "text/plain" });
	const url = URL.createObjectURL(blob);
	exportPref.href = url;
	exportPref.click();
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
			await updateElements();
		} else {
			//
		}
	};
	reader.onerror = () => {
		//
	};
	reader.readAsText(file);
});

document.querySelector("#reset-theme-builder").onclick = async () => {
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
	await updateElements();
};

document.querySelector("#reset-site-list").onclick = async () => {
	pref.reset("siteList");
	await applySettings();
	await updateElements();
};

document.querySelector("#reset-advanced").onclick = async () => {
	[
		"allowDarkLight",
		"dynamic",
		"noThemeColour",
		"homeBackground_light",
		"homeBackground_dark",
		"fallbackColour_light",
		"fallbackColour_dark",
		"minContrast_light",
		"minContrast_dark",
	].forEach((key) => pref.reset(key));
	await applySettings();
	await updateElements();
};

/**
 * @param {number} id
 * @param {object} policy
 * @returns
 */
async function createPolicySection(id, policy) {
	if (policy.headerType === "URL") {
		const templateFlexiblePolicySection = document.querySelector("#template .policy.flexible-policy");
		const policySection = templateFlexiblePolicySection.cloneNode(true);
		setupFlexiblePolicySection(policySection, id, policy);
		return policySection;
	} else if (policy.headerType === "ADDON_ID") {
		const templateColourPolicySection = document.querySelector("#template .policy.colour-policy");
		const policySection = templateColourPolicySection.cloneNode(true);
		await setupColourPolicySection(policySection, id, policy);
		return policySection;
	}
}

function updateCheckboxes() {
	checkboxes.forEach((checkbox) => {
		setCheckboxValue(checkbox, pref[checkbox.dataset.pref]);
	});
}

function updateSliders() {
	sliders.forEach((slider) => {
		setSliderValue(slider, pref[slider.dataset.pref]);
	});
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
			policyList.appendChild(await createPolicySection(id, policy));
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
			policySection.replaceWith(await createPolicySection(id, policy));
		}
	}
	policyList.querySelectorAll(`.policy`).forEach((policySection) => {
		if (!(policySection.dataset.id in pref.siteList)) {
			policySection.remove();
		}
	});
}

async function updateElements() {
	updateCheckboxes();
	updateSliders();
	updateFixedPolicySection();
	await updateSiteList();
}

/**
 * @param {number} nthTry
 */
async function updateAllowDarkLightText(nthTry = 0) {
	// bugged
	if (nthTry > 10) return;
	try {
		const allowDarkLightTitle = document.querySelector("#allow-dark-light-title");
		const allowDarkLightCheckboxCaption = document.querySelector("#allow-dark-light-caption");
		const scheme = await browser.runtime.sendMessage({ header: "SCHEME_REQUEST" });
		if (scheme === "light") {
			allowDarkLightTitle.textContent = msg("allowDarkTabBar");
			allowDarkLightCheckboxCaption.textContent = msg("allowDarkTabBarTooltip");
		} else {
			allowDarkLightTitle.textContent = msg("allowLightTabBar");
			allowDarkLightCheckboxCaption.textContent = msg("allowLightTabBarTooltip");
		}
	} catch (error) {
		console.error(error);
		await updateAllowDarkLightText(++nthTry);
	}
}

async function updateOptionsPage() {
	await pref.load();
	if (pref.valid()) {
		if (!document.hasFocus()) await updateElements();
		await updateAllowDarkLightText();
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

browser.theme.onUpdated.addListener(updateOptionsPage);
browser.storage.onChanged.addListener(updateOptionsPage);
document.addEventListener("pageshow", updateOptionsPage);
updateOptionsPage();

document.addEventListener("DOMContentLoaded", () => localise(document));
