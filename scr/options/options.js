"use strict";

import preference from "../preference.js";
import { hex } from "../colour.js";
import { msg } from "../utility.js";

const pref = new preference();

const tabSwitches = document.querySelectorAll("input[name='tab-switch']");
tabSwitches.forEach(setupTabSwitch);
const checkboxes = document.querySelectorAll("[type='checkbox']");
checkboxes.forEach(setupCheckBox);
const sliders = document.querySelectorAll(".slider");
sliders.forEach(setupSider);
const fixedOptions = document.querySelectorAll(".section.fixed-option");
fixedOptions.forEach(setupFixedOption);
const addNewRuleButton = document.querySelector("#add-new-rule");
addNewRuleButton.onclick = addNewRule;

function setupTabSwitch(tabSwitch) {
	tabSwitch.addEventListener("change", () => (settings.className = tabSwitch.id));
}

function setupCheckBox(checkbox) {
	checkbox.onclick = () => {
		pref[checkbox.dataset.pref] = checkbox.checked;
		applySettings();
	};
}

function setupSider(slider) {
	const minusButton = slider.querySelector("button:nth-of-type(1)");
	const plusButton = slider.querySelector("button:nth-of-type(2)");
	minusButton.addEventListener("mousedown", () => {
		if (+slider.dataset.value <= +slider.dataset.min) return;
		const newValue = +slider.dataset.value - +slider.dataset.step;
		setSliderValue(slider, newValue);
		pref[slider.dataset.pref] = newValue;
		applySettings();
	});
	plusButton.addEventListener("mousedown", () => {
		if (+slider.dataset.value >= +slider.dataset.max) return;
		const newValue = +slider.dataset.value + +slider.dataset.step;
		setSliderValue(slider, newValue);
		pref[slider.dataset.pref] = newValue;
		applySettings();
	});
}

/**
 * @param {HTMLElement} slider
 * @param {number} value
 */
function setSliderValue(slider, value) {
	const sliderBody = slider.querySelector(".slider-body");
	const percentage = (value - +slider.dataset.min) / (+slider.dataset.max - +slider.dataset.min);
	const scale = slider.dataset.scale;
	slider.dataset.value = value;
	sliderBody.textContent = scale ? `${value.toString().slice(0, -scale)}.${value.toString().slice(-scale)}` : value;
	sliderBody.style.setProperty("--slider-position", `${100 * (1 - percentage)}%`);
}

/**
 * @param {HTMLElement} colourInputWrapper
 * @param {Function} onChange
 */
function setupColourInput(colourInputWrapper, initialColour, onChange) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector(".colour-picker");
	const colourPickerInput = colourInputWrapper.querySelector("input[type='color']");
	colourInput.value = initialColour;
	colourPicker.style.backgroundColor = initialColour;
	colourPickerInput.value = initialColour;
	colourInput.addEventListener("focus", () => colourInput.select());
	colourInput.addEventListener("blur", () => {
		const colour = hex(colourInput.value);
		colourInput.value = colour;
		colourPicker.style.backgroundColor = colour;
		colourPickerInput.value = colour;
		onChange(colour);
	});
	colourInput.addEventListener("input", () => {
		const colour = hex(colourInput.value);
		colourPicker.style.backgroundColor = colour;
		colourPickerInput.value = colour;
		onChange(colour);
	});
	colourPickerInput.addEventListener("input", () => {
		const colour = colourPickerInput.value;
		colourPicker.style.backgroundColor = colour;
		colourInput.value = colour;
		onChange(colour);
	});
}

/**
 * @param {HTMLElement} colourInputWrapper
 * @param {string} colour
 */
function setColourInputValue(colourInputWrapper, colour) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector(".colour-picker");
	const colourPickerInput = colourInputWrapper.querySelector("input[type='color']");
	colourInput.value = colour;
	colourPicker.style.backgroundColor = colour;
	colourPickerInput.value = colour;
}

function setupThemeColourSwitch(themeColourSwitchWrapper, initialSelection, onChange) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(1)");
	const ignoreThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(2)");
	if (initialSelection === "IGNORE_THEME") ignoreThemeColourRadioButton.checked = true;
	useThemeColourRadioButton.addEventListener("change", () => {
		if (useThemeColourRadioButton.checked) onChange("UN_IGNORE_THEME");
	});
	ignoreThemeColourRadioButton.addEventListener("change", () => {
		if (ignoreThemeColourRadioButton.checked) onChange("IGNORE_THEME");
	});
}

function setupQSInput(QSInputWrapper, initialValue, onChange) {
	const QSInput = QSInputWrapper.querySelector("input[type='text']");
	QSInput.value = initialValue;
	QSInput.addEventListener("input", () => {
		onChange(QSInput.value);
	});
}

function setupFixedOption(fixedOption) {
	const colourInputWrapper = fixedOption.querySelector(".colour-input-wrapper");
	const key = colourInputWrapper.dataset.pref;
	setupColourInput(colourInputWrapper, pref[key], (colour) => {
		pref[key] = colour;
		applySettings();
	});
	const resetButton = fixedOption.querySelector("button");
	resetButton.onclick = async () => {
		await pref.reset(key);
		setColourInputValue(colourInputWrapper, pref[key]);
	};
}

function setupCustomOption(customOption, id, site, customRule) {
	const optionHeaderInput = customOption.querySelector(".option-header-input");
	const select = customOption.querySelector("select");
	const colourInput = customOption.querySelector(".colour-input-wrapper");
	const themeColourSwitch = customOption.querySelector(".theme-colour-switch");
	const QSInput = customOption.querySelector(".qs-input-wrapper");

	customOption.dataset.id = id;
	customOption.querySelector(".colour-picker").htmlFor = `colour-picker-${id}`;
	customOption.querySelector("input[type='color']").id = `colour-picker-${id}`;
	customOption.querySelector("input.toggle-switch:nth-of-type(1)").name = `theme-colour-${id}`;
	customOption.querySelector("input.toggle-switch:nth-of-type(1)").id = `use-theme-colour-${id}`;
	customOption.querySelector("label.toggle-switch:nth-of-type(1)").htmlFor = `use-theme-colour-${id}`;
	customOption.querySelector("input.toggle-switch:nth-of-type(2)").name = `theme-colour-${id}`;
	customOption.querySelector("input.toggle-switch:nth-of-type(2)").id = `ignore-theme-colour-${id}`;
	customOption.querySelector("label.toggle-switch:nth-of-type(2)").htmlFor = `ignore-theme-colour-${id}`;

	optionHeaderInput.value = site;
	select.addEventListener("change", () => {
		select.className = select.value;
	});
	setupColourInput(colourInput, "#2b2a33", (colour) => {});
	setupThemeColourSwitch(themeColourSwitch, "UN_IGNORE_THEME", (themePolicy) => {});
	setupQSInput(QSInput, "div#nav", (qs) => {});
}

function addNewRule() {
	const templateCustomOption = document.querySelector("#template .custom-option");
	const listWrapper = document.querySelector("#option-list");
	const customOption = templateCustomOption.cloneNode(true);
	listWrapper.appendChild(customOption);
	let id = 1;
	while (document.querySelector(`#option-list .custom-option[data-id='${id}']`)) {
		id++;
	}
	setupCustomOption(customOption, id, "www.example.com", "IGNORE_THEME");
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
		document.querySelector("#loading-wrapper").hidden = true;
		document.querySelector("#settings").hidden = false;
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
