//This script is shared by option page and popup

const default_reservedColor_cs = {
	"developer.mozilla.org": "IGNORE_THEME",
	"github.com": "IGNORE_THEME",
	"mail.google.com": "CLASS_wl",
	"open.spotify.com": "#000000",
	"www.instagram.com": "IGNORE_THEME",
	"www.youtube.com": "IGNORE_THEME"
};

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
let op_custom_options_table = document.getElementById("custom_options_table");
let op_light_color = document.getElementById("light_color");
let op_dark_color = document.getElementById("dark_color");
let op_reset_light = document.getElementById("reset_light_color");
let op_reset_dark = document.getElementById("reset_dark_color");
let op_reset_all = document.getElementById("reset_all");
let op_save = document.getElementById("save");
let op_add = document.getElementById("add");
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
				let table_rows = op_custom_options_table.rows;
				for (let i = table_rows.length - 1; i >= 0; i--) {
					if (i > 1) op_custom_options_table.deleteRow(i);
				}
				let domains = Object.keys(pref_reservedColor_cs);
				domains.forEach((domain, i) => {
					let new_row = op_custom_options_table.insertRow(i + 2);
					new_row.innerHTML += generateNewRow(domain, i);
					addAction(i);
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

/**
 * Gives newly generated HTML elements actions.
 * 
 * @param {number} i The index number given to newly generated HTML elements.
 */
function addAction(i) {
	let domain_field = document.getElementById(`DOM_${i}`);
	let select_menu = document.getElementById(`SEL_${i}`);
	let operation = document.getElementById(`OPE_${i}`);
	let delete_button = document.getElementById(`DEL_${i}`);
	domain_field.oninput = autoSaveSettings;
	select_menu.onchange = () => {
		switch (select_menu.selectedIndex) {
			case 0: operation.innerHTML = `<input type="color" class="FiveEm" value="#FFFFFF">`; break;
			case 1: operation.innerHTML = `<span class="FiveEm"></span>`; break;
			case 2: operation.innerHTML = `<input type="text" class="FiveEm" value="">`; break;
			case 3: operation.innerHTML = `<input type="text" class="FiveEm" value="">`; break;
			default: break;
		}
		autoSaveSettings();
	};
	delete_button.onclick = () => {
		delete_button.parentElement.parentElement.remove();
		autoSaveSettings();
	};
	operation.oninput = autoSaveSettings;
}

if (popupDetected()) {
	pp_more_custom.onclick = () => browser.runtime.openOptionsPage();
} else {
	op_more_custom.onclick = () => {
		browser.storage.local.set({ custom: op_more_custom.checked });
		op_custom_options.hidden = !op_more_custom.checked;
	};
	op_light_color.onchange = () => browser.storage.local.set({ light_color: op_light_color.value });
	op_dark_color.onchange = () => browser.storage.local.set({ dark_color: op_dark_color.value });
	op_reset_light.onclick = () => browser.storage.local.set({ light_color: "#FFFFFF" }).then(load);
	op_reset_dark.onclick = () => browser.storage.local.set({ dark_color: "#1C1B22" }).then(load);
	op_reset_all.onclick = () => browser.storage.local.set({ reservedColor_cs: default_reservedColor_cs }).then(load);
	op_add.onclick = () => {
		let i = 0;
		while (document.getElementById(`DOM_${i}`) != null) i++;
		let new_row = op_custom_options_table.insertRow(op_custom_options_table.rows.length);
		new_row.innerHTML = generateNewRow("", i);
		addAction(i);
		autoSaveSettings();
	};
}

/**
 * Reads lookup table and stores data in storage.
 */
function autoSaveSettings() {
	let pending_reservedColor_cs = {};
	let all_table_rows = op_custom_options_table.firstElementChild.children;
	for (let i = 2; i < all_table_rows.length; i++) {
		let table_cells = all_table_rows[i].children;
		let domain = table_cells[0].firstElementChild.value;
		if (domain != "" && isNaN(domain) && pending_reservedColor_cs[domain] == null) {
			let action;
			switch (table_cells[1].firstElementChild.selectedIndex) {
				case 0: action = table_cells[2].firstElementChild.value; break;
				case 1: action = "IGNORE_THEME"; break;
				case 2: action = `CLASS_${table_cells[2].firstElementChild.value}`; break;
				case 3: action = `TAG_${table_cells[2].firstElementChild.value}`; break;
				default: break;
			}
			pending_reservedColor_cs[domain] = action;
			if (table_cells[4] != null) table_cells[4].remove();
		} else {
			if (table_cells[4] == null) all_table_rows[i].insertCell().innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
		}
	}
	browser.storage.local.set({ reservedColor_cs: pending_reservedColor_cs });
}

/**
 * Reads settings for a domain, generates new HTML elements and gives them ids.
 * These HTML elements shall be inserted into op_custom_options_table using insertRow().
 * Shall run addAtion() after inserting.
 * 
 * @param {*} domain Domain stored in the storage.
 * @param {*} i Identical numbering of the elements.
 * @returns 
 */
function generateNewRow(domain, i) {
	let action = "#ECECEC"; //default action for new settings row
	if (action == null) return null;
	domain == "" ? domain = "example.com" : action = pref_reservedColor_cs[domain];
	let part_1 = `<input id="DOM_${i}" type="text" value="${domain}">`;
	let part_2, part_3;
	let part_4 = `<button id="DEL_${i}" title="Delete"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>`;
	if (action == "IGNORE_THEME") {
		part_2 = `<select id="SEL_${i}"><option>specify a color</option><option selected>ignore theme color</option><option>pick from class</option><option>pick from tag</option><option>pick from id</option><option>pick from name</option></select>`;
		part_3 = `<span class="FiveEm"></span>`;
	} else if (action.startsWith("TAG_")) {
		part_2 = `<select id="SEL_${i}"><option>specify a color</option><option>ignore theme color</option><option>pick from class</option><option selected>pick from tag</option><option>pick from id</option><option>pick from name</option></select>`;
		part_3 = `<input type="text" class="FiveEm" value="${action.replace("TAG_", "")}">`;
	} else if (action.startsWith("CLASS_")) {
		part_2 = `<select id="SEL_${i}"><option>specify a color</option><option>ignore theme color</option><option selected>pick from class</option><option>pick from tag</option><option>pick from id</option><option>pick from name</option></select>`;
		part_3 = `<input type="text" class="FiveEm" value="${action.replace("CLASS_", "")}">`;
	} else if (action.startsWith("ID_")) {
		part_2 = `<select id="SEL_${i}"><option>specify a color</option><option>ignore theme color</option><option>pick from class</option><option>pick from tag</option><option selected>pick from id</option><option>pick from name</option></select>`;
		part_3 = `<input type="text" class="FiveEm" value="${action.replace("ID_", "")}">`;
	} else if (action.startsWith("NAME_")) {
		part_2 = `<select id="SEL_${i}"><option>specify a color</option><option>ignore theme color</option><option>pick from class</option><option>pick from tag</option><option>pick from id</option><option selected>pick from name</option></select>`;
		part_3 = `<input type="text" class="FiveEm" value="${action.replace("NAME_", "")}">`;
	} else {
		part_2 = `<select id="SEL_${i}"><option selected>specify a color</option><option>ignore theme color</option><option>pick from class</option><option>pick from tag</option><option>pick from id</option><option>pick from name</option></select>`;
		part_3 = `<input type="color" class="FiveEm" value="${action}">`;
	}
	return `<td class="TenEm">${part_1}</td><td>${part_2}</td><td id="OPE_${i}">${part_3}</td><td>${part_4}</td>`;
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
		body.style.backgroundColor = theme[`colors`][`popup`];
		body.style.color = theme[`colors`][`popup_text`];
		if (theme[`colors`][`popup_text`] == "rgb(0, 0, 0)") {
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