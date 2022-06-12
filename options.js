//this script is shared by option page and popup

let body = document.getElementsByTagName("body")[0];
let loading = document.getElementById("loading");
let settings = document.getElementById("settings");
let color_scheme_light = document.getElementById("color_scheme_no_dark");
let color_scheme_dark = document.getElementById("color_scheme_no_light");
let color_scheme_system = document.getElementById("color_scheme_system");
let allow_dark_light = document.getElementById("force_mode");
let force_mode_caption = document.getElementById("force_mode_caption");
let dynamic = document.getElementById("dynamic");
let op_more_custom = document.getElementById("more_custom");
let op_custom_options = document.getElementById("custom_options");
let op_light_color = document.getElementById("light_color");
let op_dark_color = document.getElementById("dark_color");
let op_color_reset = document.getElementById("color_reset");
let op_lookup = document.getElementById("lookup");
let op_lookup_reset = document.getElementById("lookup_reset");
let pp_more_custom = document.getElementById("custom_popup");

//Settings cache
var pref_scheme;
var pref_force;
var pref_dynamic;
var pref_custom;
var pref_light_color;
var pref_dark_color;
var pref_reservedColor_cs;

/**
 * Loads preferences into cache.
 */
function loadPref(pref) {
	pref_scheme = pref.scheme;
	pref_force = pref.force;
	pref_dynamic = pref.dynamic;
	pref_custom = pref.custom;
	pref_light_color = pref.light_color;
	pref_dark_color = pref.dark_color;
	pref_reservedColor_cs = pref.reservedColor_cs;
	return true;
}

/**
 * @returns If all prefs are loaded.
 */
function verifyPref() {
	return pref_scheme != null
		&& pref_force != null
		&& pref_custom != null
		&& pref_light_color != null
		&& pref_dark_color != null
		&& pref_reservedColor_cs != null;
}

settings.hidden = true;
loading.hidden = false;

load();

browser.theme.onUpdated.addListener(autoPageColor);
//Load prefs when popup is opened
document.addEventListener("pageshow", load);
//Sync prefs on option page and popup
browser.storage.onChanged.addListener(load_lite);

/**
 * Loads all prefs
 */
function load() {
	browser.storage.local.get(pref => {
		if (loadPref(pref) && verifyPref()) {
			allow_dark_light.checked = !pref_force;
			dynamic.checked = pref_dynamic;
			color_scheme_dark.checked = pref_scheme == "dark";
			color_scheme_light.checked = pref_scheme == "light";
			color_scheme_system.checked = pref_scheme == "system";
			if (!popupDetected()) { //when the script is run by option page
				op_more_custom.checked = pref_custom;
				op_custom_options.hidden = !pref_custom;
				op_light_color.value = pref_light_color;
				op_dark_color.value = pref_dark_color;
				op_lookup.value = "";
				let domains = Object.keys(pref_reservedColor_cs);
				domains.forEach((domain, i) => {
					op_lookup.value += domain + " " + pref_reservedColor_cs[domain];
					if (i != domains.length - 1) {
						op_lookup.value += "\r\n";
					}
				});
			}
			autoPageColor();
			loading.hidden = true;
			settings.hidden = false;
			applySettings();
		}
	});
}

/**
 * Only loads color scheme, force mode, dynamic mode
 */
function load_lite() {
	browser.storage.local.get(pref => {
		if (loadPref(pref) && verifyPref()) {
			allow_dark_light.checked = !pref_force;
			dynamic.checked = pref_dynamic;
			color_scheme_dark.checked = pref_scheme == "dark";
			color_scheme_light.checked = pref_scheme == "light";
			color_scheme_system.checked = pref_scheme == "system";
			autoPageColor();
			loading.hidden = true;
			settings.hidden = false;
			applySettings();
		}
	});
}

color_scheme_dark.addEventListener("input", () => {
	if (color_scheme_dark.checked) {
		color_scheme_light.checked = false;
		color_scheme_system.checked = false;
		changeColorScheme("dark");
	}
});

color_scheme_light.addEventListener("input", () => {
	if (color_scheme_light.checked) {
		color_scheme_dark.checked = false;
		color_scheme_system.checked = false;
		changeColorScheme("light");
	}
});

color_scheme_system.addEventListener("input", () => {
	if (color_scheme_system.checked) {
		color_scheme_dark.checked = false;
		color_scheme_light.checked = false;
		changeColorScheme("system");
	}
});

/**
 * @param {*} pending_scheme the name of the scheme to change to
 */
function changeColorScheme(pending_scheme) {
	pref_scheme = pending_scheme;
	browser.storage.local.set({ scheme: pending_scheme });
	if (firefoxAboveV95()) browser.browserSettings.overrideContentColorScheme.set({ value: pending_scheme });
	autoPageColor();
}

//If it's below v95.0, grey out "allow..." option
if (!firefoxAboveV95()) {
	allow_dark_light.checked = false;
	allow_dark_light.disabled = true;
} else {
	allow_dark_light.onclick = () => {
		if (allow_dark_light.checked) {
			browser.storage.local.set({ force: false });
		} else {
			browser.storage.local.set({ force: true });
		}
	};
}

dynamic.onclick = () => {
	if (dynamic.checked) {
		browser.storage.local.set({ dynamic: true });
	} else {
		browser.storage.local.set({ dynamic: false });
	}
};


if (popupDetected()) {
	pp_more_custom.onclick = browser.runtime.openOptionsPage();
} else {
	op_light_color.addEventListener("change", () => browser.storage.local.set({ light_color: op_light_color.value }));
	op_dark_color.addEventListener("change", () => browser.storage.local.set({ dark_color: op_dark_color.value }));
	op_more_custom.onclick = () => {
		if (op_more_custom.checked) {
			browser.storage.local.set({ custom: true });
			op_custom_options.hidden = false;
		} else {
			browser.storage.local.set({ custom: false });
			op_custom_options.hidden = true;
		}
	};
	op_color_reset.onclick = () => {
		browser.storage.local.set({
			light_color: "#FFFFFF",
			dark_color: "#1C1B22"
		});
		light_color.value = "#FFFFFF";
		dark_color.value = "#1C1B22";
	};
	op_lookup.oninput = () => {
		let pending_reservedColor_cs = {};
		let lookup_items = op_lookup.value.split("\n");
		lookup_items.forEach((entry) => {
			if (entry.split(" ").length == 2) {
				let domain = entry.split(" ")[0];
				let action = entry.split(" ")[1];
				pending_reservedColor_cs[domain] = action;
			}
		});
		browser.storage.local.set({ reservedColor_cs: pending_reservedColor_cs });
	};
	op_lookup_reset.onclick = () => {
		browser.storage.local.set({
			reservedColor_cs: {
				"developer.mozilla.org": "IGNORE_THEME",
				"github.com": "IGNORE_THEME",
				"mail.google.com": "CLASS_wl",
				"open.spotify.com": "#000000",
				"www.instagram.com": "IGNORE_THEME",
				"www.youtube.com": "IGNORE_THEME"
			}
		});
		load();
	};
}

/**
 * Triggers color update
 */
function applySettings() {
	browser.runtime.sendMessage("UPDATE_REQUEST");
}

/**
 * Updates color of option page or popup
 */
function autoPageColor() {
	popupDetected() ? autoPopupColor() : autoOptionsColor();
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
		} else {
			body.classList.add("dark");
			body.classList.remove("light");
		}
	});
	if (pref_scheme == "light" || (pref_scheme == "system" && lightModeDetected())) {
		force_mode_caption.innerHTML = "Allow dark tab bar";
	} else {
		force_mode_caption.innerHTML = "Allow light tab bar";
	}
}

/**
 * Updates option page's color depends on color scheme.
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
	return document.getElementById("more_custom") == null;
}

const light_mode_match_media = window.matchMedia("(prefers-color-scheme: light)");
if (light_mode_match_media != null) light_mode_match_media.onchange = () => {
	if (color_scheme_system.checked) autoOptionsColor();
};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect
 */
function lightModeDetected() {
	return light_mode_match_media != null && light_mode_match_media.matches;
}

/**
 * @returns true if Firefox 95.0 or later.
 */
function firefoxAboveV95() {
	let str = navigator.userAgent;
	let ind = str.lastIndexOf("Firefox");
	if (ind != -1) {
		str = str.substring(ind + 8);
		return Number(str) >= 95;
	} else {
		return true; //default answer
	}
}