let loading = document.getElementById("loading");
let settings = document.getElementById("settings");
let color_scheme_no_dark = document.getElementById("color_scheme_no_dark");
let color_scheme_no_light = document.getElementById("color_scheme_no_light");
let color_scheme_system = document.getElementById("color_scheme_system");
let allow_dark_light = document.getElementById("force_mode");
let force_mode_caption = document.getElementById("force_mode_caption");
let custom = document.getElementById("custom");
let body = document.getElementsByTagName("body")[0];
let custom_options = document.getElementById("custom_options");
let light_color = document.getElementById("light_color");
let dark_color = document.getElementById("dark_color");
let custom_reset = document.getElementById("custom_reset");
let custom_popup = document.getElementById("custom_popup");

//Settings cache
var pref_scheme;
var pref_force;
var pref_custom;
var pref_light_color;
var pref_dark_color;

/**
 * Loads preferences into cache.
 * 
 * @param {*} pref 
 */
function loadPref(pref) {
	pref_scheme = pref.scheme;
	pref_force = pref.force;
	pref_custom = pref.custom;
	pref_light_color = pref.light_color;
	pref_dark_color = pref.dark_color;
}

function verifyPref() {
	return pref_scheme != null && pref_force != null && pref_custom != null && pref_light_color != null && pref_dark_color != null;
}

browser.theme.onUpdated.addListener(autoPageColor);

settings.hidden = true;
loading.hidden = false;
load();

document.addEventListener("pageshow", load);
browser.storage.onChanged.addListener(load);

/**
 * Loads settings to options or popup page
 */
function load() {
	browser.storage.local.get(pref => {
		loadPref(pref);
		if (verifyPref()) {
			allow_dark_light.checked = !pref_force;
			if (pref_scheme == "dark") {
				color_scheme_no_light.checked = true;
				color_scheme_no_dark.checked = false;
				color_scheme_system.checked = false;
			} else if (pref_scheme == "light") {
				color_scheme_no_light.checked = false;
				color_scheme_no_dark.checked = true;
				color_scheme_system.checked = false;
			} else if (pref_scheme == "system") {
				color_scheme_no_light.checked = false;
				color_scheme_no_dark.checked = false;
				color_scheme_system.checked = true;
			}
			if (popupDetected()) {
				autoPopupColor();
			} else {
				autoOptionsColor();
				custom.checked = pref_custom;
				custom_options.hidden = !pref_custom;
				light_color.value = pref_light_color;
				dark_color.value = pref_dark_color;
			}
			loading.hidden = true;
			settings.hidden = false;
			applySettings();
		}
	});
}

color_scheme_no_light.addEventListener("input", () => {
	if (color_scheme_no_light.checked) {
		color_scheme_no_dark.checked = false;
		color_scheme_system.checked = false;
		changeColorScheme("dark");
	}
});

color_scheme_no_dark.addEventListener("input", () => {
	if (color_scheme_no_dark.checked) {
		color_scheme_no_light.checked = false;
		color_scheme_system.checked = false;
		changeColorScheme("light");
	}
});

color_scheme_system.addEventListener("input", () => {
	if (color_scheme_system.checked) {
		color_scheme_no_light.checked = false;
		color_scheme_no_dark.checked = false;
		changeColorScheme("system");
	}
});

/**
 * @param {*} pending_scheme the name of the scheme to change to
 */
function changeColorScheme(pending_scheme) {
	pref_scheme = pending_scheme;
	browser.storage.local.set({ scheme: pending_scheme });
	browser.browserSettings.overrideContentColorScheme.set({ value: pending_scheme });
	autoPageColor();
	applySettings();
}

allow_dark_light.onclick = () => {
	if (allow_dark_light.checked) {
		browser.storage.local.set({ force: false });
	} else {
		browser.storage.local.set({ force: true });
	}
	applySettings();
};

if (custom != null) custom.onclick = () => {
	if (custom.checked) {
		browser.storage.local.set({ custom: true });
		custom_options.hidden = false;
	} else {
		browser.storage.local.set({ custom: false });
		custom_options.hidden = true;
	}
	applySettings();
};

if (popupDetected()) {
	custom_popup.onclick = () => {
		browser.runtime.openOptionsPage();
	};
} else {
	light_color.addEventListener("change", () => {
		browser.storage.local.set({ light_color: light_color.value });
		applySettings();
	});
	dark_color.addEventListener("change", () => {
		browser.storage.local.set({ dark_color: dark_color.value });
		applySettings();
	});
	custom_reset.onclick = () => {
		browser.storage.local.set({
			light_color: "#FFFFFF",
			dark_color: "#1C1B22"
		});
		light_color.value = "#FFFFFF";
		dark_color.value = "#1C1B22";
		applySettings();
	};
}

/**
 * Triggers color update.
 */
function applySettings() {
	browser.runtime.sendMessage("apply_settings");
}

/**
 * Updates color of options page or popup
 */
function autoPageColor() {
	if (popupDetected()) {
		autoPopupColor();
	} else {
		autoOptionsColor();
	}
}

/**
 * Updates popup's color depends on tab bar color.
 */
function autoPopupColor() {
	browser.theme.getCurrent().then(theme => {
		body.style.backgroundColor = theme['colors']['popup'];
		body.style.color = theme['colors']['popup_text'];
		if (theme['colors']['popup_text'] == "rgb(0, 0, 0)") {
			body.classList.add("light");
			body.classList.remove("dark");
			force_mode_caption.innerHTML = "Allow dark tab bar";
		} else {
			body.classList.add("dark");
			body.classList.remove("light");
			force_mode_caption.innerHTML = "Allow light tab bar";
		}
	});
}

/**
 * Updates options page's color depends on color scheme.
 */
function autoOptionsColor() {
	if (pref_scheme == "light" || (pref_scheme == "system" && lightModeDetected())) {
		body.classList.add("light");
		body.classList.remove("dark");
		force_mode_caption.innerHTML = "Allow dark tab bar";
	} else {
		body.classList.add("dark");
		body.classList.remove("light");
		force_mode_caption.innerHTML = "Allow light tab bar";
	}
}

/**
 * @returns true if the script is run by the popup
 */
function popupDetected() {
	return (document.getElementById("custom") == null) ? true : false;
}

const light_mode_match_media = window.matchMedia("(prefers-color-scheme: light)");
if (light_mode_match_media != null) light_mode_match_media.onchange = () => {
	if (color_scheme_system.checked) autoOptionsColor();
};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect
 */
function lightModeDetected() {
	return (light_mode_match_media != null && light_mode_match_media.matches) ? true : false;
}