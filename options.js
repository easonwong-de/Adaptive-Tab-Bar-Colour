let loading = document.getElementById("loading");
let settings = document.getElementById("settings");
let color_scheme_no_dark = document.getElementById("color_scheme_no_dark");
let color_scheme_no_light = document.getElementById("color_scheme_no_light");
let color_scheme_system = document.getElementById("color_scheme_system");
let force_mode = document.getElementById("force_mode");
let force_mode_caption = document.getElementById("force_mode_caption");
let custom = document.getElementById("custom");
let body = document.getElementsByTagName("body")[0];
let custom_options = document.getElementById("custom_options");
let light_color = document.getElementById("light_color");
let dark_color = document.getElementById("dark_color");
let custom_reset = document.getElementById("custom_reset");
let custom_popup = document.getElementById("custom_popup");

/**
 * Updates the background color of the popup.
 */
function changeColor() {
	browser.theme.getCurrent().then(theme => {
		body.style.backgroundColor = theme['colors']['popup'];
		body.style.color = theme['colors']['popup_text'];
		if (theme['colors']['popup_text'] == "rgb(0, 0, 0)") {
			body.classList.add("light");
			body.classList.remove("dark");
		} else {
			body.classList.add("dark");
			body.classList.remove("light");
		}
	});
}

//if the popup is running this code
if (custom == null) browser.theme.onUpdated.addListener(changeColor);

//browser.storage.local.set({force: true}); //v1.3.1 temporary fix

settings.hidden = true;
loading.hidden = false;
load();

document.addEventListener("pageshow", load);
browser.storage.onChanged.addListener(load);

/**
 * Loads settings to options or popup page
 */
function load() {
	browser.storage.local.get(function (pref) {
		let scheme = pref.scheme;
		let force = pref.force;
		if (scheme == null || force == null) {
			if (light_mode_match()) {
				scheme = "light";
			} else {
				scheme = "dark";
			}
			force = false;
		}
		force_mode.checked = !force;
		if (scheme == "dark") {
			switchBodyToDark();
			color_scheme_no_light.checked = true;
			color_scheme_no_dark.checked = false;
			color_scheme_system.checked = false;
		} else if (scheme == "light") {
			switchBodyToLight();
			color_scheme_no_light.checked = false;
			color_scheme_no_dark.checked = true;
			color_scheme_system.checked = false;
		} else if (scheme == "system") {
			if (light_mode_match()) {
				switchBodyToLight();
			} else {
				switchBodyToDark();
			}
			color_scheme_no_light.checked = false;
			color_scheme_no_dark.checked = false;
			color_scheme_system.checked = true;
		}
		let pref_custom = pref.custom;
		let pref_light_color = pref.light_color;
		let pref_dark_color = pref.dark_color;
		if (pref_custom == null || pref_light_color == null || pref_dark_color == null) {
			pref_custom = false;
			pref_light_color = "#FFFFFF";
			pref_dark_color = "#1C1B22";
		}
		if (custom != null) { //not popup
			custom.checked = pref_custom;
			custom_options.hidden = !pref_custom;
			light_color.value = pref_light_color;
			dark_color.value = pref_dark_color;
		} else {
			changeColor();
		}
		loading.hidden = true;
		settings.hidden = false;
		applySettings();
	});
}

color_scheme_no_light.addEventListener("input", function (event) {
	if (color_scheme_no_light.checked) {
		browser.storage.local.set({ scheme: "dark" });
		browser.browserSettings.overrideContentColorScheme.set({ value: "dark" });
		switchBodyToDark();
		color_scheme_no_light.checked = true;
		color_scheme_no_dark.checked = false;
		color_scheme_system.checked = false;
		applySettings();
	}
});

color_scheme_no_dark.addEventListener("input", function (event) {
	if (color_scheme_no_dark.checked) {
		browser.storage.local.set({ scheme: "light" });
		browser.browserSettings.overrideContentColorScheme.set({ value: "light" });
		switchBodyToLight();
		color_scheme_no_light.checked = false;
		color_scheme_no_dark.checked = true;
		color_scheme_system.checked = false;
		applySettings();
	}
});

color_scheme_system.addEventListener("input", function (event) {
	if (color_scheme_system.checked) {
		browser.storage.local.set({ scheme: "system" });
		browser.browserSettings.overrideContentColorScheme.set({ value: "system" }).then(() => {
			if (light_mode_match()) {
				switchBodyToLight();
			} else {
				switchBodyToDark();
			}
		});
		color_scheme_no_light.checked = false;
		color_scheme_no_dark.checked = false;
		color_scheme_system.checked = true;
		applySettings();
	}
});

force_mode.onclick = function () {
	if (force_mode.checked) {
		browser.storage.local.set({ force: false });
	} else {
		browser.storage.local.set({ force: true });
	}
	applySettings();
};

if (custom != null) custom.onclick = function () {
	if (custom.checked) {
		browser.storage.local.set({ custom: true });
		custom_options.hidden = false;
	} else {
		browser.storage.local.set({ custom: false });
		custom_options.hidden = true;
	}
	applySettings();
};

if (custom != null) light_color.addEventListener("change", function (event) {
	browser.storage.local.set({ light_color: light_color.value });
	applySettings();
});

if (custom != null) dark_color.addEventListener("change", function (event) {
	browser.storage.local.set({ dark_color: dark_color.value });
	applySettings();
});

if (custom != null) custom_reset.onclick = function () {
	browser.storage.local.set({
		light_color: "#FFFFFF",
		dark_color: "#1C1B22"
	});
	light_color.value = "#FFFFFF";
	dark_color.value = "#1C1B22";
	applySettings();
};

if (custom_popup != null) custom_popup.onclick = () => {
	browser.runtime.openOptionsPage();
};

/**
 * Triggers color update.
 */
function applySettings() {
	chrome.runtime.sendMessage("apply_settings");
}

function switchBodyToLight() {
	body.classList.add("light");
	body.classList.remove("dark");
	force_mode_caption.innerHTML = "Allow dark tab bar";
}

function switchBodyToDark() {
	body.classList.add("dark");
	body.classList.remove("light");
	force_mode_caption.innerHTML = "Allow light tab bar";
}

const light_mode_match_media = window.matchMedia("(prefers-color-scheme: light)");

if (light_mode_match_media != null) light_mode_match_media.onchange = () => {
	if (color_scheme_system.checked) {
		if (light_mode_match()) {
			switchBodyToLight();
		} else {
			switchBodyToDark();
		}
	}
};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect
 */
function light_mode_match() {
	if (light_mode_match_media != null && light_mode_match_media.matches){
		return true;
	} else {
		return false;
	}
}