"use strict";

import preference from "../preference.js";
import { msg } from "../utility.js";
import { setColourPolicySectionID, setFlexiblePolicySectionID, setupCheckBox, setupSlider } from "./elements.js";

const pref = new preference();

const settingsWrapper = document.querySelector("#settings-wrapper");
const loadingWrapper = document.querySelector("#loading-wrapper");
const tabSwitches = document.querySelectorAll("input[name='tab-switch']");
tabSwitches.forEach((tabSwitch) => {
	tabSwitch.addEventListener("change", () => (settingsWrapper.className = tabSwitch.id));
});

const checkboxes = document.querySelectorAll("[type='checkbox']");
checkboxes.forEach((checkbox) =>
	setupCheckBox(checkbox, (key, value) => {
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

const addNewRuleButton = document.querySelector("#add-new-rule");
addNewRuleButton.onclick = addPolicySection;

function setupFixedPolicySection(fixedPolicySection) {
	const colourInputWrapper = fixedPolicySection.querySelector(".colour-input-wrapper");
	const key = colourInputWrapper.dataset.pref;
	const resetButton = fixedPolicySection.querySelector("button");
	setupColourInput(colourInputWrapper, pref[key], (colour) => {
		pref[key] = colour;
		applySettings();
	});
	resetButton.onclick = async () => {
		await pref.reset(key);
		setColourInputValue(colourInputWrapper, pref[key]);
	};
}

function setupColourPolicySection(policySection, id, policy) {
	const policyHeader = policySection.querySelector(".policy-header");
	const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
	let initialColour = "#000000";
	setColourPolicySectionID(policySection, id);
	setupColourInput(colourInputWrapper, initialColour, (newColour) => {});
}

function setupFlexiblePolicySection(policySection, id, policy) {
	const policyHeaderInputWrapper = policySection.querySelector(".policy-header-input-wrapper");
	const select = policySection.querySelector("select");
	const colourInputWrapper = policySection.querySelector(".colour-input-wrapper");
	const themeColourSwitch = policySection.querySelector(".theme-colour-switch");
	const QuerySelectorInputWrapper = policySection.querySelector(".qs-input-wrapper");
	let initialColour = "#000000";
	let initialUseThemeColour = true;
	let initialQuerySelector = "div#nav";
	if (policy.type === "COLOUR") {
		initialColour = policy.value;
		select.className = select.value = "COLOUR";
	} else if (policy.type === "THEME_COLOUR") {
		initialUseThemeColour = policy.value;
		select.className = select.value = "THEME_COLOUR";
	} else if ((policy.type = "QUERY_SELECTOR")) {
		initialQuerySelector = policy.value;
		select.className = select.value = "QUERY_SELECTOR";
	}
	select.addEventListener("change", () => {
		pref.siteList[id].type = select.className = select.value;
		applySettings();
	});
	setFlexiblePolicySectionID(policySection, id);
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
	setupQuerySelectorInput(QuerySelectorInputWrapper, initialQuerySelector, (newQuerySelector) => {
		pref.siteList[id].value = newQuerySelector;
		applySettings();
	});
}

async function addPolicySection(
	id = 0,
	policy = {
		headerType: "URL",
		header: "www.example.com",
		type: "COLOUR",
		value: "#000000",
	}
) {
	if (id === 0) {
		id = pref.addPolicy(policy);
		await applySettings();
	}
	const siteList = document.querySelector("#site-list");
	if (policy.headerType === "URL") {
		const templateFlexiblePolicySection = document.querySelector("#template .custom-policy.flexible-policy");
		const policySection = templateFlexiblePolicySection.cloneNode(true);
		setupFlexiblePolicySection(policySection, id, policy);
		siteList.appendChild(policySection);
	} else if (policy.headerType === "ADDON_ID") {
		const templateColourPolicySection = document.querySelector("#template .custom-policy.colour-policy");
		const policySection = templateColourPolicySection.cloneNode(true);
		setupColourPolicySection(policySection, id, policy);
		siteList.appendChild(policySection);
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
		checkboxes.forEach((checkbox) => (checkbox.checked = pref[checkbox.dataset.pref]));
		sliders.forEach((slider) => setSliderValue(slider, pref[slider.dataset.pref]));
		await updateAllowDarkLightText();
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
