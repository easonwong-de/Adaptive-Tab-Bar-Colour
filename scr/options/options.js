"use strict";

import preference from "../preference.js";
import { msg } from "../utility.js";
import {
	getColourInputValue,
	getQuerySelectorInputValue,
	getThemeColourSwitchValue,
	setCheckboxValue,
	setColourInputValue,
	setColourPolicySectionID,
	setFlexiblePolicySectionID,
	setPolicyHeaderInputValue,
	setQuerySelectorInputValue,
	setSliderValue,
	setThemeColourSwitchValue,
	setupCheckbox,
	setupColourInput,
	setupPolicyHeaderInput,
	setupQuerySelectorInput,
	setupSlider,
	setupThemeColourSwitch,
} from "./elements.js";

const pref = new preference();

const settingsWrapper = document.querySelector("#settings-wrapper");
const loadingWrapper = document.querySelector("#loading-wrapper");
const siteList = document.querySelector("#site-list");

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

async function setupColourPolicySection(policySection, id, policy) {
	setColourPolicySectionID(policySection, id);
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
	deleteButton.onclick = () => removePolicySection(policySection);
}

function setupFlexiblePolicySection(policySection, id, policy) {
	setFlexiblePolicySectionID(policySection, id);
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
	let initialQuerySelector = "div#nav";
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
		removePolicySection(policySection);
		applySettings();
	};
}

const addNewRuleButton = document.querySelector("#add-new-rule");
addNewRuleButton.onclick = async () => {
	const policy = {
		headerType: "URL",
		header: "www.example.com",
		type: "COLOUR",
		value: "#000000",
	};
	const id = pref.addPolicy(policy);
	siteList.appendChild(await createPolicySection(id, policy));
	applySettings();
};

async function createPolicySection(id, policy) {
	if (policy.headerType === "URL") {
		const templateFlexiblePolicySection = document.querySelector("#template .custom-policy.flexible-policy");
		const policySection = templateFlexiblePolicySection.cloneNode(true);
		setupFlexiblePolicySection(policySection, id, policy);
		return policySection;
	} else if (policy.headerType === "ADDON_ID") {
		const templateColourPolicySection = document.querySelector("#template .custom-policy.colour-policy");
		const policySection = templateColourPolicySection.cloneNode(true);
		await setupColourPolicySection(policySection, id, policy);
		return policySection;
	}
}

function removePolicySection(policySection) {
	policySection.remove();
}

async function updateSiteList() {
	for (const policySection of document.querySelectorAll("#site-list .custom-policy")) {
		if (!(policySection.dataset.id in pref.siteList)) {
			removePolicySection(policySection);
		}
	}
	for (const id in pref.siteList) {
		const policySection = document.querySelector(`.custom-policy[data-id='${id}']`);
		const policy = pref.siteList[id];
		if (!policySection) {
			siteList.appendChild(await createPolicySection(id, policy));
		} else {
			if (policy.headerType === "URL" && policySection.classList.contains("flexible-policy")) {
				const select = policySection.querySelector("select");
				select.className = select.value = policy.type;
				const policyHeaderInputWrapper = policySection.querySelector(".policy-header-input-wrapper");
				const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
				const themeColourSwitch = policySection.querySelector(".theme-colour-switch");
				const querySelectorInputWrapper = policySection.querySelector(".qs-input-wrapper");
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
	}
}

async function updateAllowDarkLightText(nthTry = 0) {
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
		checkboxes.forEach((checkbox) => setCheckboxValue(checkbox, pref[checkbox.dataset.pref]));
		sliders.forEach((slider) => setSliderValue(slider, pref[slider.dataset.pref]));
		await updateAllowDarkLightText();
		await updateSiteList();
		loadingWrapper.hidden = true;
		settingsWrapper.hidden = false;
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

browser.theme.onUpdated.addListener(updateOptionsPage);
browser.storage.onChanged.addListener(updateOptionsPage);
document.addEventListener("pageshow", updateOptionsPage);
document.addEventListener("DOMContentLoaded", localise);
updateOptionsPage();
