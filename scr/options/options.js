"use strict";

import preference from "../preference.js";
import { msg } from "../utility.js";

const pref = new preference();

const loading = document.querySelector("#loading-wrapper");
const settings = document.querySelector("#settings");
const allowDarkLightCheckboxCaption = document.querySelector("#allow-dark-light-caption");
const checkboxes = document.querySelectorAll("[type='checkbox']");
const sliders = document.querySelectorAll(".slider");
const customOptionsSections = document.querySelectorAll("#custom-options .section");

checkboxes.forEach((checkbox) => {
	checkbox.onclick = async () => {
		pref[checkbox.dataset.pref] = checkbox.checked;
		await applySettings();
	};
});

sliders.forEach((slider) => {
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
});

customOptionsSections.forEach((customOptionsSection) => {
	
});

async function updateAllowDarkLightText() {
	try {
		const scheme = await browser.runtime.sendMessage({ header: "SCHEME_REQUEST" });
		if (scheme === "light") {
			allowDarkLightCheckboxCaption.textContent = msg("allowDarkTabBar");
			allowDarkLightCheckboxCaption.parentElement.title = msg("allowDarkLightTooltip_dark");
		} else {
			allowDarkLightCheckboxCaption.textContent = msg("allowLightTabBar");
			allowDarkLightCheckboxCaption.parentElement.title = msg("allowDarkLightTooltip_light");
		}
	} catch (error) {
		await updateAllowDarkLightText();
	}
}

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
 * @param {HTMLElement} slider
 * @param {number} value
 */
function setSliderValue(slider, value) {
	const sliderBody = slider.querySelector(".slider-body");
	const percentage = (value - +slider.dataset.min) / (+slider.dataset.max - +slider.dataset.min);
	slider.dataset.value = value;
	sliderBody.textContent = value;
	sliderBody.style.setProperty("--slider-position", `${100 * (1 - percentage)}%`);
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
document.addEventListener("DOMContentLoaded", async () => {
	localise();
	await updateOptionsPage();
});
