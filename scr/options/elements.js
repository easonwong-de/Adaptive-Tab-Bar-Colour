import { hex } from "../colour.js";

/**
 * @param {HTMLElement} checkbox
 * @param {function} onChange
 */
export function setupCheckbox(checkbox, onChange) {
	checkbox.onclick = () => {
		onChange(checkbox.dataset.pref, checkbox.checked);
	};
}

/**
 * @param {HTMLElement} checkbox
 * @param {boolean} value
 */
export function setCheckboxValue(checkbox, value) {
	checkbox.checked = value;
}

/**
 * @param {HTMLElement} slider
 * @param {function} onChange
 */
export function setupSlider(slider, onChange) {
	const minusButton = slider.querySelector("button:nth-of-type(1)");
	const plusButton = slider.querySelector("button:nth-of-type(2)");
	minusButton.addEventListener("mousedown", () => {
		if (+slider.dataset.value <= +slider.dataset.min) return;
		const value = +slider.dataset.value - +slider.dataset.step;
		setSliderValue(slider, value);
		onChange(slider.dataset.pref, value);
	});
	plusButton.addEventListener("mousedown", () => {
		if (+slider.dataset.value >= +slider.dataset.max) return;
		const value = +slider.dataset.value + +slider.dataset.step;
		setSliderValue(slider, value);
		onChange(slider.dataset.pref, value);
	});
}

/**
 * @param {HTMLElement} slider
 * @param {number} value
 */
export function setSliderValue(slider, value) {
	const sliderBody = slider.querySelector(".slider-body");
	const percentage = (value - +slider.dataset.min) / (+slider.dataset.max - +slider.dataset.min);
	const scale = slider.dataset.scale;
	slider.dataset.value = value;
	sliderBody.textContent = scale ? `${value.toString().slice(0, -scale)}.${value.toString().slice(-scale)}` : value;
	sliderBody.style.setProperty("--slider-position", `${100 * (1 - percentage)}%`);
}

/**
 * @param {HTMLElement} policyHeaderInputWrapper
 * @param {string} initialValue
 * @param {function} onChange
 */
export function setupPolicyHeaderInput(policyHeaderInputWrapper, initialValue, onChange) {
	const policyHeaderInput = policyHeaderInputWrapper.querySelector(".policy-header-input");
	policyHeaderInput.value = initialValue;
	policyHeaderInput.addEventListener("focus", () => policyHeaderInput.select());
	policyHeaderInput.addEventListener("input", () => {
		// to-do: warning display, trimming
		onChange(policyHeaderInput.value);
	});
}

/**
 * @param {HTMLElement} policyHeaderInputWrapper
 */
export function setPolicyHeaderInputValue(policyHeaderInputWrapper, value) {
	const policyHeaderInput = policyHeaderInputWrapper.querySelector(".policy-header-input");
	policyHeaderInput.value = value;
}

/**
 * @param {HTMLElement} policyHeaderInputWrapper
 */
export function getPolicyHeaderInputValue(policyHeaderInputWrapper) {
	const policyHeaderInput = policyHeaderInputWrapper.querySelector(".policy-header-input");
	return policyHeaderInput.value;
}

/**
 * @param {HTMLElement} colourInputWrapper
 * @param {function} onChange
 */
export function setupColourInput(colourInputWrapper, initialColour, onChange) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector(".colour-picker-display");
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
 * @param {string} value
 */
export function setColourInputValue(colourInputWrapper, value) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector("input[type='color']");
	const colourPickerDisplay = colourInputWrapper.querySelector(".colour-picker-display");
	colourInput.value = value;
	colourPicker.value = value;
	colourPickerDisplay.style.backgroundColor = value;
}

/**
 * @param {HTMLElement} colourInputWrapper
 */
export function getColourInputValue(colourInputWrapper) {
	const colourPicker = colourInputWrapper.querySelector("input[type='color']");
	return colourPicker.value;
}

/**
 * @param {HTMLElement} themeColourSwitchWrapper
 * @param {boolean} initialSelection
 * @param {function} onChange
 */
export function setupThemeColourSwitch(themeColourSwitchWrapper, initialSelection, onChange) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(1)");
	const ignoreThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(2)");
	if (initialSelection === false) ignoreThemeColourRadioButton.checked = true;
	useThemeColourRadioButton.addEventListener("change", () => {
		if (useThemeColourRadioButton.checked) onChange(true);
	});
	ignoreThemeColourRadioButton.addEventListener("change", () => {
		if (ignoreThemeColourRadioButton.checked) onChange(false);
	});
}

/**
 * @param {HTMLElement} themeColourSwitchWrapper
 * @param {boolean} value 
 */
export function setThemeColourSwitchValue(themeColourSwitchWrapper, value) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(1)");
	const ignoreThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(2)");
	useThemeColourRadioButton.checked = value;
	ignoreThemeColourRadioButton.checked = !value;
}

/**
 * @param {HTMLElement} themeColourSwitchWrapper
 */
export function getThemeColourSwitchValue(themeColourSwitchWrapper) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector("input[type='radio']:nth-of-type(1)");
	return useThemeColourRadioButton.checked;
}

/**
 * @param {HTMLElement} QuerySelectorInputWrapper
 * @param {string} initialQuerySelector
 * @param {function} onChange
 */
export function setupQuerySelectorInput(QuerySelectorInputWrapper, initialQuerySelector, onChange) {
	const QuerySelectorInput = QuerySelectorInputWrapper.querySelector("input[type='text']");
	QuerySelectorInput.value = initialQuerySelector;
	QuerySelectorInput.addEventListener("focus", () => QuerySelectorInput.select());
	QuerySelectorInput.addEventListener("input", () => {
		// to-do: trimming
		onChange(QuerySelectorInput.value);
	});
}

/**
 * @param {HTMLElement} QuerySelectorInputWrapper
 * @param {string} value 
 */
export function setQuerySelectorInputValue(QuerySelectorInputWrapper, value) {
	const QuerySelectorInput = QuerySelectorInputWrapper.querySelector("input[type='text']");
	QuerySelectorInput.value = value;
}

/**
 * @param {HTMLElement} QuerySelectorInputWrapper
 */
export function getQuerySelectorInputValue(QuerySelectorInputWrapper) {
	const QuerySelectorInput = QuerySelectorInputWrapper.querySelector("input[type='text']");
	return QuerySelectorInput.value;
}

/**
 * @param {HTMLElement} policySection
 * @param {number} id
 */
export function setColourPolicySectionID(policySection, id) {
	policySection.dataset.id = id;
	policySection.querySelector(".colour-picker-display").htmlFor = `colour-picker-display-${id}`;
	policySection.querySelector("input[type='color']").id = `colour-picker-display-${id}`;
}

/**
 * @param {HTMLElement} policySection
 * @param {number} id
 */
export function setFlexiblePolicySectionID(policySection, id) {
	policySection.dataset.id = id;
	policySection.querySelector(".colour-picker-display").htmlFor = `colour-picker-display-${id}`;
	policySection.querySelector("input[type='color']").id = `colour-picker-display-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(1)").name = `theme-colour-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(1)").id = `use-theme-colour-${id}`;
	policySection.querySelector("label.toggle-switch:nth-of-type(1)").htmlFor = `use-theme-colour-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(2)").name = `theme-colour-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(2)").id = `ignore-theme-colour-${id}`;
	policySection.querySelector("label.toggle-switch:nth-of-type(2)").htmlFor = `ignore-theme-colour-${id}`;
}
