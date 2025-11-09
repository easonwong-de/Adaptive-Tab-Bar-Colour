"use strict";

import colour from "./colour.js";

/**
 * Sets up a checkbox element with an onChange callback.
 *
 * @param {HTMLElement} checkbox - The checkbox element to set up.
 * @param {(pref: string, checked: boolean) => void} onChange - Callback invoked
 *   when the checkbox is clicked.
 */
export function setupCheckbox(checkbox, onChange) {
	checkbox.onclick = () => {
		onChange(checkbox.dataset.pref, checkbox.checked);
	};
}

/**
 * Sets the checked state of a checkbox element.
 *
 * @param {HTMLElement} checkbox - The checkbox element.
 * @param {boolean} value - The value to set (checked or not).
 */
export function setCheckboxValue(checkbox, value) {
	checkbox.checked = value;
}

/**
 * Sets up a slider element with increment / decrement buttons and an onChange
 * callback.
 *
 * @param {HTMLElement} slider - The slider element to set up.
 * @param {(pref: string, value: number) => void} onChange - Callback invoked
 *   when the slider value changes.
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
 * Sets the value of a slider element and updates its display.
 *
 * @param {HTMLElement} slider - The slider element.
 * @param {number} value - The value to set.
 */
export function setSliderValue(slider, value) {
	const sliderBody = slider.querySelector(".slider-body");
	const percentage =
		(value - +slider.dataset.min) /
		(+slider.dataset.max - +slider.dataset.min);
	const scale = slider.dataset.scale;
	slider.dataset.value = value;
	sliderBody.textContent =
		scale && value !== 0
			? `${value.toString().slice(0, -scale)}.${value.toString().slice(-scale)}`
			: value;
	sliderBody.style.setProperty(
		"--slider-position",
		`${100 * (1 - percentage)}%`,
	);
}

/**
 * Sets up a policy header input field with an initial value and onChange
 * callback.
 *
 * @param {HTMLElement} policyHeaderInputWrapper - The wrapper element
 *   containing the input.
 * @param {string} initialValue - The initial value to set.
 * @param {(value: string) => void} onChange - Callback invoked when the input
 *   value changes.
 */
export function setupPolicyHeaderInput(
	policyHeaderInputWrapper,
	initialValue,
	onChange,
) {
	const policyHeaderInput = policyHeaderInputWrapper.querySelector(
		".policy-header-input",
	);
	policyHeaderInput.value = initialValue;
	policyHeaderInput.addEventListener("focus", () =>
		policyHeaderInput.select(),
	);
	policyHeaderInput.addEventListener("input", () =>
		onChange(policyHeaderInput.value.trim()),
	);
	policyHeaderInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") policyHeaderInput.blur();
	});
}

/**
 * Sets the value of a policy header input field.
 *
 * @param {HTMLElement} policyHeaderInputWrapper - The wrapper element
 *   containing the input.
 * @param {string} value - The value to set.
 */
export function setPolicyHeaderInputValue(policyHeaderInputWrapper, value) {
	const policyHeaderInput = policyHeaderInputWrapper.querySelector(
		".policy-header-input",
	);
	policyHeaderInput.value = value;
}

/**
 * Gets the value of a policy header input field.
 *
 * @param {HTMLElement} policyHeaderInputWrapper - The wrapper element
 *   containing the input.
 * @returns {string} The current value of the input.
 */
export function getPolicyHeaderInputValue(policyHeaderInputWrapper) {
	const policyHeaderInput = policyHeaderInputWrapper.querySelector(
		".policy-header-input",
	);
	return policyHeaderInput.value;
}

/**
 * Sets up a colour input field and colour picker with an initial colour and
 * onChange callback.
 *
 * @param {HTMLElement} colourInputWrapper - The wrapper element containing the
 *   colour input and picker.
 * @param {string} initialColour - The initial colour value (hex).
 * @param {(colour: string) => void} onChange - Callback invoked when the colour
 *   changes.
 */
export function setupColourInput(colourInputWrapper, initialColour, onChange) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector(
		".colour-picker-display",
	);
	const colourPickerInput = colourInputWrapper.querySelector(
		"input[type='color']",
	);
	colourInput.value = initialColour;
	colourPicker.style.backgroundColor = initialColour;
	colourPickerInput.value = initialColour;
	colourInput.addEventListener("focus", () => colourInput.select());
	colourInput.addEventListener("blur", () => {
		const hex = new colour().parse(colourInput.value, false).toHex();
		colourInput.value = hex;
		colourPicker.style.backgroundColor = hex;
		colourPickerInput.value = hex;
		onChange(hex);
	});
	colourInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") colourInput.blur();
	});
	colourInput.addEventListener("input", () => {
		const hex = new colour().parse(colourInput.value, false).toHex();
		colourPicker.style.backgroundColor = hex;
		colourPickerInput.value = hex;
		onChange(hex);
	});
	colourPickerInput.addEventListener("input", () => {
		const colour = colourPickerInput.value;
		colourPicker.style.backgroundColor = colour;
		colourInput.value = colour;
		onChange(colour);
	});
}

/**
 * Sets the value of a colour input field and updates the picker display.
 *
 * @param {HTMLElement} colourInputWrapper - The wrapper element containing the
 *   colour input and picker.
 * @param {string} value - The colour value to set (hex).
 */
export function setColourInputValue(colourInputWrapper, value) {
	const colourInput = colourInputWrapper.querySelector(".colour-input");
	const colourPicker = colourInputWrapper.querySelector(
		"input[type='color']",
	);
	const colourPickerDisplay = colourInputWrapper.querySelector(
		".colour-picker-display",
	);
	colourInput.value = value;
	colourPicker.value = value;
	colourPickerDisplay.style.backgroundColor = value;
}

/**
 * Gets the value of a colour input field.
 *
 * @param {HTMLElement} colourInputWrapper - The wrapper element containing the
 *   colour input and picker.
 * @returns {string} The current colour value (hex).
 */
export function getColourInputValue(colourInputWrapper) {
	const colourPicker = colourInputWrapper.querySelector(
		"input[type='color']",
	);
	return colourPicker.value;
}

/**
 * Sets up a theme colour switch with an initial selection and onChange
 * callback.
 *
 * @param {HTMLElement} themeColourSwitchWrapper - The wrapper containing the
 *   radio buttons.
 * @param {boolean} initialSelection - Whether to use the theme colour
 *   initially.
 * @param {(useTheme: boolean) => void} onChange - Callback invoked when the
 *   selection changes.
 */
export function setupThemeColourSwitch(
	themeColourSwitchWrapper,
	initialSelection,
	onChange,
) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector(
		"input[type='radio']:nth-of-type(1)",
	);
	const ignoreThemeColourRadioButton = themeColourSwitchWrapper.querySelector(
		"input[type='radio']:nth-of-type(2)",
	);
	if (initialSelection === false) ignoreThemeColourRadioButton.checked = true;
	useThemeColourRadioButton.addEventListener("change", () => {
		if (useThemeColourRadioButton.checked) onChange(true);
	});
	ignoreThemeColourRadioButton.addEventListener("change", () => {
		if (ignoreThemeColourRadioButton.checked) onChange(false);
	});
}

/**
 * Sets the value of a theme colour switch.
 *
 * @param {HTMLElement} themeColourSwitchWrapper - The wrapper containing the
 *   radio buttons.
 * @param {boolean} value - Whether to use the theme colour.
 */
export function setThemeColourSwitchValue(themeColourSwitchWrapper, value) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector(
		"input[type='radio']:nth-of-type(1)",
	);
	const ignoreThemeColourRadioButton = themeColourSwitchWrapper.querySelector(
		"input[type='radio']:nth-of-type(2)",
	);
	useThemeColourRadioButton.checked = value;
	ignoreThemeColourRadioButton.checked = !value;
}

/**
 * Gets the value of a theme colour switch.
 *
 * @param {HTMLElement} themeColourSwitchWrapper - The wrapper containing the
 *   radio buttons.
 * @returns {boolean} True if the theme colour is selected, false otherwise.
 */
export function getThemeColourSwitchValue(themeColourSwitchWrapper) {
	const useThemeColourRadioButton = themeColourSwitchWrapper.querySelector(
		"input[type='radio']:nth-of-type(1)",
	);
	return useThemeColourRadioButton.checked;
}

/**
 * Sets up a query selector input field with an initial value and onChange
 * callback.
 *
 * @param {HTMLElement} QuerySelectorInputWrapper - The wrapper element
 *   containing the input.
 * @param {string} initialQuerySelector - The initial query selector value.
 * @param {(value: string) => void} onChange - Callback invoked when the input
 *   value changes.
 */
export function setupQuerySelectorInput(
	QuerySelectorInputWrapper,
	initialQuerySelector,
	onChange,
) {
	const QuerySelectorInput =
		QuerySelectorInputWrapper.querySelector("input[type='text']");
	QuerySelectorInput.value = initialQuerySelector;
	QuerySelectorInput.addEventListener("focus", () =>
		QuerySelectorInput.select(),
	);
	QuerySelectorInput.addEventListener("input", () =>
		onChange(QuerySelectorInput.value.trim()),
	);
	QuerySelectorInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") QuerySelectorInput.blur();
	});
}

/**
 * Sets the value of a query selector input field.
 *
 * @param {HTMLElement} QuerySelectorInputWrapper - The wrapper element
 *   containing the input.
 * @param {string} value - The value to set.
 */
export function setQuerySelectorInputValue(QuerySelectorInputWrapper, value) {
	const QuerySelectorInput =
		QuerySelectorInputWrapper.querySelector("input[type='text']");
	QuerySelectorInput.value = value;
}

/**
 * Gets the value of a query selector input field.
 *
 * @param {HTMLElement} QuerySelectorInputWrapper - The wrapper element
 *   containing the input.
 * @returns {string} The current value of the input.
 */
export function getQuerySelectorInputValue(QuerySelectorInputWrapper) {
	const QuerySelectorInput =
		QuerySelectorInputWrapper.querySelector("input[type='text']");
	return QuerySelectorInput.value;
}

/**
 * Sets the ID for a colour policy section and updates related element
 * attributes.
 *
 * @param {HTMLElement} policySection - The policy section element.
 * @param {number} id - The ID to set.
 */
export function setColourPolicySectionId(policySection, id) {
	policySection.dataset.id = id;
	policySection.querySelector(".colour-picker-display").htmlFor =
		`colour-picker-display-${id}`;
	policySection.querySelector("input[type='color']").id =
		`colour-picker-display-${id}`;
}

/**
 * Sets the ID for a flexible policy section and updates related element
 * attributes.
 *
 * @param {HTMLElement} policySection - The policy section element.
 * @param {number} id - The ID to set.
 */
export function setFlexiblePolicySectionId(policySection, id) {
	policySection.dataset.id = id;
	policySection.querySelector(".colour-picker-display").htmlFor =
		`colour-picker-display-${id}`;
	policySection.querySelector("input[type='color']").id =
		`colour-picker-display-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(1)").name =
		`theme-colour-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(1)").id =
		`use-theme-colour-${id}`;
	policySection.querySelector("label.toggle-switch:nth-of-type(1)").htmlFor =
		`use-theme-colour-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(2)").name =
		`theme-colour-${id}`;
	policySection.querySelector("input.toggle-switch:nth-of-type(2)").id =
		`ignore-theme-colour-${id}`;
	policySection.querySelector("label.toggle-switch:nth-of-type(2)").htmlFor =
		`ignore-theme-colour-${id}`;
}
