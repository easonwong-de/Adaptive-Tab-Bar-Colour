import colour from "./colour.js";

export function setupCheckbox(checkbox, isChecked, onChange) {
	setCheckboxValue(checkbox, isChecked);
	checkbox.querySelector(`input[type="checkbox"]`).onclick = () => {
		onChange(control.dataset.pref, control.checked);
	};
}

export function setCheckboxValue(checkbox, isChecked) {
	checkbox.querySelector(`input[type="checkbox"]`)?.checked = isChecked;
}

export function getCheckboxValue(checkbox) {
	return checkbox.querySelector(`input[type="checkbox"]`)?.checked;
}

export function setupSlider(slider, sliderValue, onChange) {
	const minusButton = slider.querySelector("button:nth-of-type(1)");
	const plusButton = slider.querySelector("button:nth-of-type(2)");

	setSliderValue(slider, sliderValue);

	minusButton.addEventListener("mousedown", () => {
		if (getSliderValue(slider) <= +slider.dataset.min) return;
		const value = getSliderValue(slider) - +slider.dataset.step;
		setSliderValue(slider, value);
		onChange(slider.dataset.pref, value);
	});

	plusButton.addEventListener("mousedown", () => {
		if (getSliderValue(slider) >= +slider.dataset.max) return;
		const value = getSliderValue(slider) + +slider.dataset.step;
		setSliderValue(slider, value);
		onChange(slider.dataset.pref, value);
	});
}

export function setSliderValue(slider, sliderValue) {
	const track = slider.querySelector(".track");
	const percentage =
		(+slider.dataset.max - sliderValue) /
		(+slider.dataset.max - +slider.dataset.min);
	const scale = +slider.dataset.scale;

	slider.dataset.value = sliderValue;
	track.textContent =
		scale && sliderValue !== 0
			? `${sliderValue.toString().slice(0, -scale)}.${sliderValue.toString().slice(-scale)}`
			: sliderValue;
	track.style.setProperty("--slider-position", `${100 * percentage}%`);
}

export function getSliderValue(slider) {
	return +slider.dataset.value;
}

export function setupTextInput(
	textInput,
	textValue,
	onChange,
	onBlur = undefined,
) {
	const textInputElement = textInput.querySelector(`input[type="text"]`);

	setTextInputValue(textInput, textValue);

	textInputElement.addEventListener("focus", () => textInputElement.select());

	textInputElement.addEventListener("keydown", (event) => {
		if (event.key === "Enter") textInputElement.blur();
	});

	textInputElement.addEventListener("input", () =>
		onChange(textInputElement.value.trim()),
	);

	if (onBlur)
		textInputElement.addEventListener("blur", () =>
			onBlur(textInputElement.value.trim()),
		);
}

export function setTextInputValue(textInput, textValue) {
	const textInputElement = textInput.querySelector(`input[type="text"]`);
	textInputElement?.value = textValue;
}

export function getTextInputValue(textInput) {
	const textInputElement = textInput.querySelector(`input[type="text"]`);
	return textInputElement?.value;
}

export function setupColourInput(colourInput, colourHex, onChange) {
	const textInputElement = colourInput.querySelector(`input[type="text"]`);
	const colourDisplayElement = colourInput.querySelector("label");
	const colourPickerElement =
		colourInput.querySelector(`input[type="color"]`);

	setColourInputValue(colourInput, colourHex);

	setupTextInput(
		textInputElement,
		colourHex,
		(newColour) => {
			const newColourHex = new colour(newColour, false).toHex();
			colourDisplayElement.style.backgroundColor =
				colourPickerElement.value = newColourHex;
			onChange(newColourHex);
		},
		(newColour) => {
			const newColourHex = new colour(newColour, false).toHex();
			setColourInputValue(colourInput, newColourHex);
			onChange(newColourHex);
		},
	);

	colourPickerElement.addEventListener("input", () => {
		const newColourHex = new colour(
			colourPickerElement.value,
			false,
		).toHex();
		colourDisplayElement.style.backgroundColor = textInputElement.value =
			newColourHex;
		onChange(newColourHex);
	});
}

export function setColourInputValue(colourInput, colourHex) {
	const textInputElement = colourInput.querySelector(`input[type="text"]`);
	const colourDisplayElement = colourInput.querySelector("label");
	const colourPickerElement =
		colourInput.querySelector(`input[type="color"]`);

	textInputElement.value =
		colourDisplayElement.style.backgroundColor =
		colourPickerElement.value =
			colourHex;
}

export function getColourInputValue(colourInput) {
	const colourPickerElement =
		colourInput.querySelector(`input[type="color"]`);
	return new colour(colourPickerElement.value, false).toHex();
}

export function setupToggleSwitch(toggleSwitch, name, isEnabled, onChange) {
	const positiveElement = toggleSwitch.querySelector(
		`input[type="radio"]:nth-of-type(1)`,
	);
	const negativeElement = toggleSwitch.querySelector(
		`input[type="radio"]:nth-of-type(2)`,
	);
	positiveElement.name = negativeElement.name = name;

	setToggleSwitchValue(isEnabled);

	positiveElement.addEventListener("change", () => {
		if (positiveElement.checked) onChange(true);
	});

	negativeElement.addEventListener("change", () => {
		if (negativeElement.checked) onChange(false);
	});
}

export function setToggleSwitchValue(toggleSwitch, isEnabled) {
	const positiveElement = toggleSwitch.querySelector(
		`input[type="radio"]:nth-of-type(1)`,
	);
	const negativeElement = toggleSwitch.querySelector(
		`input[type="radio"]:nth-of-type(2)`,
	);

	positiveElement.checked = isEnabled;
	negativeElement.checked = !isEnabled;
}

export function getToggleSwitchValue(themeColourSwitchWrapper) {
	const positiveElement = themeColourSwitchWrapper.querySelector(
		`input[type="radio"]:nth-of-type(1)`,
	);

	return positiveElement.checked;
}

function setupFlexiblePolicy(
	flexiblePolicy,
	{ headerType, header, type, value },
	onChange,
) {
	const policy = {
		headerType,
		header,
		type,
		value,
	};

	const headerInput = flexiblePolicy.querySelector(".header");
	const typeInput = flexiblePolicy.querySelector("select");
	const colourInput = flexiblePolicy.querySelector(".colour-control");
	const themeInput = flexiblePolicy.querySelector(".theme-control");
	const queryInput = flexiblePolicy.querySelector(".query-control");
	const deleteButton = flexiblePolicy.querySelector("button");

	typeInput.dataset.selection = typeInput.value = type;
	flexiblePolicy.classList.toggle("warning", header === "");

	setupTextInput(headerInput, header, (newHeader) => {
		flexiblePolicy.classList.toggle("warning", newHeader === "");
		policy.header = newHeader;
		onChange(policy);
	});

	typeInput.addEventListener("change", () => {
		policy.type = typeInput.dataset.selection = typeInput.value;
		switch (typeInput.value) {
			case "COLOUR":
				policy.value = getColourInputValue(colourInput);
				break;
			case "THEME_COLOUR":
				policy.value = getToggleSwitchValue(themeInput);
				break;
			case "QUERY_SELECTOR":
				policy.value = getTextInputValue(queryInput);
				break;
			default:
				break;
		}
		onChange(policy);
	});

	setupColourInput(
		colourInput,
		policy.type === "COLOUR" ? policy.value : "#000000",
		(newColour) => {
			policy.value = newColour;
			onChange(policy);
		},
	);

	setupToggleSwitch(
		themeInput,
		policy.type === "THEME_COLOUR" ? policy.value : true,
		(newTheme) => {
			policy.value = newTheme;
			onChange(policy);
		},
	);

	setupTextInput(
		queryInput,
		policy.type === "QUERY_SELECTOR" ? policy.value : "",
		(newQuery) => {
			policy.value = newQuery;
			onChange(policy);
		},
	);

	deleteButton.onclick = () => {
		policy = null;
		flexiblePolicy.remove();
		onChange(policy);
	};
}

function setFlexiblePolicyValue(flexiblePolicy, policy) {
	if (policy) {
		const { header, type, value } = policy;
		const headerInput = flexiblePolicy.querySelector(".header");
		const typeInput = flexiblePolicy.querySelector("select");
		const colourInput = flexiblePolicy.querySelector(".colour-control");
		const themeInput = flexiblePolicy.querySelector(".theme-control");
		const queryInput = flexiblePolicy.querySelector(".query-control");

		typeInput.dataset.selection = typeInput.value = type;
		flexiblePolicy.classList.toggle("warning", header === "");
		setTextInputValue(headerInput, header);
		switch (type) {
			case "COLOUR":
				setColourInputValue(colourInput, value);
				break;
			case "THEME_COLOUR":
				setToggleSwitchValue(themeInput, value);
				break;
			case "QUERY_SELECTOR":
				setTextInputValue(queryInput, value);
				break;
			default:
				break;
		}
	} else {
		flexiblePolicy.remove();
	}
}
