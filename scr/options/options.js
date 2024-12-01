"use strict";

import preference from "../preference.js";
import { hex } from "../colour.js";
import { msg } from "../utility.js";

const pref = new preference();

const tabSwitches = document.querySelectorAll("input[name='tab-switch']");

tabSwitches.forEach((tabSwitch) => {
	tabSwitch.addEventListener("change", () => (settings.className = tabSwitch.id));
});

const checkboxes = document.querySelectorAll("[type='checkbox']");
checkboxes.forEach(setupCheckBox);

function setupCheckBox(checkbox) {
	checkbox.onclick = () => {
		pref[checkbox.dataset.pref] = checkbox.checked;
		applySettings();
	};
}

const sliders = document.querySelectorAll(".slider");
sliders.forEach(setupSider);

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
 * @param {Function} onInput
 */
function setupColourInput(colourInputWrapper, onInput) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector(".colour-picker");
	const colourPickerInput = colourInputWrapper.querySelector("input[type='color']");
	colourInput.addEventListener("focus", () => colourInput.select());
	colourInput.addEventListener("blur", () => {
		const colour = hex(colourInput.value);
		colourInput.value = colour;
		colourPicker.style.backgroundColor = colour;
		colourPickerInput.value = colour;
		onInput(colour);
	});
	colourInput.addEventListener("input", () => {
		const colour = hex(colourInput.value);
		colourPicker.style.backgroundColor = colour;
		colourPickerInput.value = colour;
		onInput(colour);
	});
	colourPickerInput.addEventListener("input", () => {
		const colour = colourPickerInput.value;
		colourPicker.style.backgroundColor = colour;
		colourInput.value = colour;
		onInput(colour);
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

const fixedOptionsSections = document.querySelectorAll(".section.fixed-option");
fixedOptionsSections.forEach((fixedOptionsSection) => {
	const colourInputWrapper = fixedOptionsSection.querySelector(".colour-input-wrapper");
	const key = colourInputWrapper.dataset.pref;
	setColourInputValue(colourInputWrapper, pref[key]);
	setupColourInput(colourInputWrapper, (colour) => {
		pref[key] = colour;
		applySettings();
	});
	const resetButton = fixedOptionsSection.querySelector("button");
	resetButton.onclick = async () => {
		await pref.reset(key);
		setColourInputValue(colourInputWrapper, pref[key]);
	};
});

const customOptionsSections = document.querySelectorAll(".section.custom-option");
customOptionsSections.forEach((customOptionsSection) => {
	const select = customOptionsSection.querySelector("select");
	select.addEventListener("change", () => {
		select.className = select.value;
	});
	const colourInputWrapper = customOptionsSection.querySelector(".colour-input-wrapper");
	setColourInputValue(colourInputWrapper, "#2b2a33");
	setupColourInput(colourInputWrapper, () => {});
});

const allowDarkLightTitle = document.querySelector("#allow-dark-light-title");
const allowDarkLightCheckboxCaption = document.querySelector("#allow-dark-light-caption");

async function updateAllowDarkLightText(nthTry = 0) {
	if (nthTry > 10) return;
	try {
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

const loading = document.querySelector("#loading-wrapper");
const settings = document.querySelector("#settings");

async function updateOptionsPage() {
	await pref.load();
	if (pref.valid()) {
		checkboxes.forEach((checkbox) => (checkbox.checked = pref[checkbox.dataset.pref]));
		sliders.forEach((slider) => setSliderValue(slider, pref[slider.dataset.pref]));
		await updateAllowDarkLightText();
		loading.hidden = true;
		settings.hidden = false;
	} else {
		browser.runtime.sendMessage({ header: "INIT_REQUEST" });
	}
}

/**
 * Updates the text content and title of elements based on localisation data attributes.
 *
 * Finds elements with `data-text` or `data-title` attributes, retrieves the localised text using the `msg` function, and assigns it to the element's `textContent` or `title`.
 */
function localise() {
	document.querySelectorAll("[data-text]").forEach((element) => (element.textContent = msg(element.dataset.text)));
	document.querySelectorAll("[data-title]").forEach((element) => (element.title = msg(element.dataset.title)));
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
