import {
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_reservedColour,
	recommendedColour_addon,
	protectedDomain,
	checkVersion,
} from "./shared.js";

// Localisation
document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll("[data-text]").forEach((element) => (element.textContent = msg(element.dataset.text)));
	document.querySelectorAll("[data-title]").forEach((element) => (element.title = msg(element.dataset.title)));
});

var pref = {
	scheme: "auto",
	allowDarkLight: false,
	dynamic: true,
	noThemeColour: true,
	tabbar: 0,
	tabSelected: 0.1,
	toolbar: 0,
	toolbarBorder: 0,
	toolbarField: 0.05,
	toolbarFieldOnFocus: 0.05,
	sidebar: 0.05,
	sidebarBorder: 0.05,
	popup: 0.05,
	popupBorder: 0.05,
	custom: false,
	homeBackground_light: default_homeBackground_light,
	homeBackground_dark: default_homeBackground_dark,
	fallbackColour_light: default_fallbackColour_light,
	fallbackColour_dark: default_fallbackColour_dark,
	reservedColour: default_reservedColour,
	version: [2, 2],
};

// Current colour lookup table
var reservedColour;

/**
 * Caches pref into local variables and checks integrity.
 */
function cachePref(storedPref) {
	pref = storedPref;
	reservedColour = pref.custom ? pref.reservedColour : default_reservedColour;
	return (
		pref.scheme != null &&
		pref.allowDarkLight != null &&
		pref.dynamic != null &&
		pref.noThemeColour != null &&
		pref.tabbar != null &&
		pref.tabSelected != null &&
		pref.toolbar != null &&
		pref.toolbarBorder != null &&
		pref.toolbarField != null &&
		pref.toolbarFieldOnFocus != null &&
		pref.sidebar != null &&
		pref.sidebarBorder != null &&
		pref.popup != null &&
		pref.popupBorder != null &&
		pref.custom != null &&
		pref.homeBackground_light != null &&
		pref.homeBackground_dark != null &&
		pref.fallbackColour_light != null &&
		pref.fallbackColour_dark != null &&
		pref.reservedColour != null &&
		pref.version != null
	);
}

let body = document.getElementsByTagName("body")[0];
let loading = document.getElementById("loading_wrapper");
let settings = document.getElementById("settings");
let colourSchemeLight = document.getElementById("colour_scheme_light");
let colourSchemeDark = document.getElementById("colour_scheme_dark");
let colourSchemeAuto = document.getElementById("colour_scheme_auto");
let allowDarkLightCheckbox = document.getElementById("allow-dark-light");
let allowDarkLightCheckboxText = document.getElementById("force_mode_caption");
let dynamicCheckbox = document.getElementById("dynamic");
let noThemeColourCheckbox = document.getElementById("no-theme-color");
/* let op_overlay_opacity_factor = document.getElementById("overlay_opacity_factor");
let op_overlay_opacity_threshold = document.getElementById("overlay_opacity_threshold"); */
let op_tabbar = document.getElementById("tabbar_color");
let op_tab_selected = document.getElementById("tab_selected_color");
let op_toolbar = document.getElementById("toolbar_color");
let op_toolbar_border_bottom = document.getElementById("toolbar_border_bottom_color");
let op_toolbar_field = document.getElementById("toolbar_field_color");
let op_toolbar_field_focus = document.getElementById("toolbar_field_focus_color");
let op_sidebar = document.getElementById("sidebar_color");
let op_sidebar_border = document.getElementById("sidebar_border_color");
let op_popup = document.getElementById("popup_color");
let op_popup_border = document.getElementById("popup_border_color");
let op_more-custom = document.getElementById("more-custom");
let op_custom-options-wrapper = document.getElementById("custom-options-wrapper");
let op_custom-options = document.getElementById("custom-options");
let op_light_colour = document.getElementById("light_color");
let op_dark_colour = document.getElementById("dark_color");
let op_reset_light = document.getElementById("reset_light_color");
let op_reset_dark = document.getElementById("reset_dark_color");
let op_light_fallback_colour = document.getElementById("light_fallback_color");
let op_dark_fallback_colour = document.getElementById("dark_fallback_color");
let op_reset_light_fallback = document.getElementById("reset_light_fallback_color");
let op_reset_dark_fallback = document.getElementById("reset_dark_fallback_color");
let op_reset-all = document.getElementById("reset-all");
let op_add = document.getElementById("add");

settings.hidden = true;
loading.hidden = false;

popupDetected() ? load_lite() : load();

browser.theme.onUpdated.addListener(autoPageColour);
// Load prefs when popup is opened
document.addEventListener("pageshow", load);
// Sync prefs on option page and popup
// Technically it might cause dead loop, but onChanged will not be triggered when same pref is set
browser.storage.onChanged.addListener(() => {
	if (!popupDetected()) document.hasFocus() ? load_lite() : load();
	applySettings();
});

/**
 * Loads all prefs.
 */
function load() {
	browser.storage.local.get((storedPref) => {
		if (cachePref(storedPref)) {
			colourSchemeDark.checked = pref.scheme == "dark";
			colourSchemeLight.checked = pref.scheme == "light";
			colourSchemeAuto.checked = pref.scheme == "auto";
			allowDarkLightCheckbox.checked = !pref.allowDarkLight;
			dynamicCheckbox.checked = pref.dynamic;
			noThemeColourCheckbox.checked = pref.noThemeColour;
			/* op_overlay_opacity_factor.value = pref.overlay_opacity_factor;
			op_overlay_opacity_threshold.value = pref.overlay_opacity_threshold; */
			op_tabbar.value = pref.tabbar;
			op_tab_selected.value = pref.tabSelected;
			op_toolbar.value = pref.toolbar;
			op_toolbar_border_bottom.value = pref.toolbarBorder;
			op_toolbar_field.value = pref.toolbarField;
			op_toolbar_field_focus.value = pref.toolbarFieldOnFocus;
			op_sidebar.value = pref.sidebar;
			op_sidebar_border.value = pref.sidebarBorder;
			op_popup.value = pref.popup;
			op_popup_border.value = pref.popupBorder;
			op_more-custom.checked = pref.custom;
			op_custom-options-wrapper.className = pref.custom ? "enabled" : "disabled";
			op_light_colour.value = pref.homeBackground_light;
			op_dark_colour.value = pref.homeBackground_dark;
			op_light_fallback_colour.value = pref.fallbackColour_light;
			op_dark_fallback_colour.value = pref.fallbackColour_dark;
			let table_rows = op_custom-options.rows;
			for (let i = table_rows.length - 1; i > 3; i--) op_custom-options.deleteRow(i);
			let domains = Object.keys(pref.reservedColour);
			domains.forEach((domain, i) => {
				let new_row = op_custom-options.insertRow(i + 4);
				generateNewRow(domain, i).then((new_row_HTML) => {
					new_row.innerHTML += new_row_HTML;
					addAction(i);
				});
			});
			autoPageColour();
			loading.hidden = true;
			settings.hidden = false;
		} else {
			browser.runtime.sendMessage({ reason: "INIT_REQUEST" });
		}
	});
}

/**
 * Only loads colour scheme, force mode, dynamic mode, ignore theme colour pref.
 */
function load_lite() {
	browser.storage.local.get((storedPref) => {
		if (cachePref(storedPref)) {
			colourSchemeDark.checked = pref.scheme == "dark";
			colourSchemeLight.checked = pref.scheme == "light";
			colourSchemeAuto.checked = pref.scheme == "system";
			allowDarkLightCheckbox.checked = pref.allowDarkLight;
			dynamicCheckbox.checked = pref.dynamic;
			noThemeColourCheckbox.checked = pref.noThemeColour;
			autoPageColour();
			loading.hidden = true;
			settings.hidden = false;
		}
	});
}

colourSchemeDark.addEventListener("input", () => {
	if (colourSchemeDark.checked) {
		colourSchemeLight.checked = false;
		colourSchemeAuto.checked = false;
		changeColourScheme("dark");
	}
});

colourSchemeLight.addEventListener("input", () => {
	if (colourSchemeLight.checked) {
		colourSchemeDark.checked = false;
		colourSchemeAuto.checked = false;
		changeColourScheme("light");
	}
});

colourSchemeAuto.addEventListener("input", () => {
	if (colourSchemeAuto.checked) {
		colourSchemeDark.checked = false;
		colourSchemeLight.checked = false;
		changeColourScheme("system");
	}
});

/**
 * Sets the colour scheme, and updates appearance of option page.
 * @param {string} pending_scheme "light", "dark", or "system".
 */
function changeColourScheme(pending_scheme) {
	pref.scheme = pending_scheme;
	browser.storage.local.set({ scheme: pending_scheme });
	setBrowserColourScheme(pending_scheme);
	autoPageColour();
}

// If it's below v95.0, grey out "allow..." option
if (checkVersion() < 95) {
	allowDarkLightCheckbox.checked = false;
	allowDarkLightCheckbox.disabled = true;
} else {
	allowDarkLightCheckbox.onclick = () => {
		pref.allowDarkLight = allowDarkLightCheckbox.checked;
		browser.storage.local.set({ allowDarkLight: allowDarkLightCheckbox.checked });
	};
}

dynamicCheckbox.onclick = () => {
	pref.dynamic = dynamicCheckbox.checked;
	browser.storage.local.set({ dynamic: dynamicCheckbox.checked });
};

noThemeColourCheckbox.onclick = () => {
	pref.noThemeColour = noThemeColourCheckbox.checked;
	browser.storage.local.set({ noThemeColour: noThemeColourCheckbox.checked });
};

/**
 * Gives newly generated HTML elements actions.
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
			case 0:
				operation.innerHTML = `<input type="color" class="FiveEm" value="#FFFFFF">`;
				break;
			case 1:
				operation.innerHTML = `<span class="FiveEm"></span>`;
				break;
			case 2:
				operation.innerHTML = `<span class="FiveEm"></span>`;
				break;
			case 3:
				operation.innerHTML = `<input type="text" class="FiveEm" value="">`;
				break;
			default:
				break;
		}
		autoSaveSettings();
	};
	operation.oninput = autoSaveSettings;
	delete_button.onclick = () => {
		delete_button.parentElement.parentElement.remove();
		autoSaveSettings();
	};
}

if (popupDetected()) {
	// popup
	pp_more-custom.onclick = () => browser.runtime.openOptionsPage();
} else {
	// option page
	/* op_overlay_opacity_factor.oninput = () => browser.storage.local.set({ overlay_opacity_factor: Number(op_overlay_opacity_factor.value) });
	op_overlay_opacity_threshold.oninput = () => browser.storage.local.set({ overlay_opacity_threshold: Number(op_overlay_opacity_threshold.value) }); */
	op_tabbar.oninput = () => browser.storage.local.set({ tabbar: Number(op_tabbar.value) });
	op_tab_selected.oninput = () => browser.storage.local.set({ tabSelected: Number(op_tab_selected.value) });
	op_toolbar.oninput = () => browser.storage.local.set({ toolbar: Number(op_toolbar.value) });
	op_toolbar_border_bottom.oninput = () => browser.storage.local.set({ toolbarBorder: Number(op_toolbar_border_bottom.value) });
	op_toolbar_field.oninput = () => browser.storage.local.set({ toolbarField: Number(op_toolbar_field.value) });
	op_toolbar_field_focus.oninput = () => browser.storage.local.set({ toolbarFieldOnFocus: Number(op_toolbar_field_focus.value) });
	op_sidebar.oninput = () => browser.storage.local.set({ sidebar: Number(op_sidebar.value) });
	op_sidebar_border.oninput = () => browser.storage.local.set({ sidebarBorder: Number(op_sidebar_border.value) });
	op_popup.oninput = () => browser.storage.local.set({ popup: Number(op_popup.value) });
	op_popup_border.oninput = () => browser.storage.local.set({ popupBorder: Number(op_popup_border.value) });
	op_more-custom.onchange = () => {
		op_custom-options-wrapper.className = op_more-custom.checked ? "enabled" : "disabled";
		browser.storage.local.set({ custom: op_more-custom.checked });
	};
	op_light_colour.onchange = () => browser.storage.local.set({ homeBackground_light: op_light_colour.value });
	op_dark_colour.onchange = () => browser.storage.local.set({ homeBackground_dark: op_dark_colour.value });
	op_reset_light.onclick = () => browser.storage.local.set({ homeBackground_light: "#FFFFFF" }).then(load);
	op_reset_dark.onclick = () => browser.storage.local.set({ homeBackground_dark: "#2B2A33" }).then(load);
	op_light_fallback_colour.onchange = () => browser.storage.local.set({ fallbackColour_light: op_light_fallback_colour.value });
	op_dark_fallback_colour.onchange = () => browser.storage.local.set({ fallbackColour_light: op_dark_fallback_colour.value });
	op_reset_light_fallback.onclick = () => browser.storage.local.set({ fallbackColour_light: "#FFFFFF" }).then(load);
	op_reset_dark_fallback.onclick = () => browser.storage.local.set({ fallbackColour_dark: "#2B2A33" }).then(load);
	op_reset-all.onclick = () => {
		if (confirm(msg("resetRuleConfirm"))) browser.storage.local.set({ reservedColour: default_reservedColour }).then(load);
	};
	op_add.onclick = () => {
		let i = 0;
		while (document.getElementById(`DOM_${i}`) != null) i++; // finds an unoccupied index
		let new_row = op_custom-options.insertRow(op_custom-options.rows.length);
		generateNewRow("", i).then((new_row_HTML) => {
			new_row.innerHTML = new_row_HTML;
			addAction(i);
			autoSaveSettings();
		});
	};
}

/**
 * Reads lookup table and stores data in storage.
 */
function autoSaveSettings() {
	let pending_reservedColour = {};
	let all_table_rows = op_custom-options.firstElementChild.children;
	for (let i = 4; i < all_table_rows.length; i++) {
		let table_cells = all_table_rows[i].children;
		let domain = table_cells[0].firstElementChild.title;
		if (!domain) domain = table_cells[0].firstElementChild.value;
		if (domain != "" && isNaN(domain) && pending_reservedColour[domain] == null) {
			let action;
			switch (table_cells[1].firstElementChild.selectedIndex) {
				case 0:
					action = table_cells[2].firstElementChild.value;
					break;
				case 1:
					action = "IGNORE_THEME";
					break;
				case 2:
					action = "UN_IGNORE_THEME";
					break;
				case 3: // query selector
					action = `QS_${table_cells[2].firstElementChild.value}`;
					break;
				default:
					break;
			}
			if (action != "QS_") {
				pending_reservedColour[domain] = action;
				if (table_cells[4] != null) table_cells[4].remove();
			} else {
				if (table_cells[4] == null) all_table_rows[i].insertCell().innerHTML = svg_warning;
			}
		} else {
			if (table_cells[4] == null) all_table_rows[i].insertCell().innerHTML = svg_warning;
		}
	}
	browser.storage.local.set({ reservedColour: pending_reservedColour });
}

/**
 * Reads settings for a domain, generates new HTML elements and gives them id-s.
 * These HTML elements shall be inserted into op_custom-options using insertRow().
 * Shall run addAction() after inserting.
 * @param {*} domain Domain stored in the storage.
 * @param {*} i Special numbering of the elements.
 */
function generateNewRow(domain, i) {
	if (domain.startsWith("Add-on ID: ")) {
		return new Promise((resolve) => {
			browser.management.get(domain.replace("Add-on ID: ", "")).then((addon) => {
				let part_1 = `<span id="DOM_${i}" title="${domain}">${addon.name}</span>`;
				let part_2 = `<select id="SEL_${i}">
					<option selected>${msg("specifyAColour")}</option>
				</select>`;
				let part_3 = `<input type="color" class="FiveEm" value="${pref.reservedColour[domain]}">`;
				let part_4 = `<button id="DEL_${i}" title="${msg("delete")}">${svg_bin}</button>`;
				resolve(`<td class="TenFiveEm">${part_1}</td>
				<td>${part_2}</td>
				<td id="OPE_${i}">${part_3}</td>
				<td>${part_4}</td>`);
			});
		});
	} else {
		let action;
		if (domain == "") {
			domain = "example.com";
			action = "#ECECEC";
		} else {
			action = pref.reservedColour[domain];
		}
		let part_1 = `<input id="DOM_${i}" type="text" value="${domain}">`;
		let part_2 = ``;
		let part_3 = ``;
		let part_4 = `<button id="DEL_${i}" title="${msg("delete")}">${svg_bin}</button>`;
		if (action == "IGNORE_THEME") {
			part_2 = `<select id="SEL_${i}">
				<option>${msg("specifyAColour")}</option>
				<option selected>${msg("ignoreThemeColour")}</option>
				<option>${msg("useThemeColour")}</option>
				<option>${msg("useQuerySelector")}</option>
			</select>`;
			part_3 = `<span class="FiveEm"></span>`;
		} else if (action == "UN_IGNORE_THEME") {
			part_2 = `<select id="SEL_${i}">
				<option>${msg("specifyAColour")}</option>
				<option>${msg("ignoreThemeColour")}</option>
				<option selected>${msg("useThemeColour")}</option>
				<option>${msg("useQuerySelector")}</option>
			</select>`;
			part_3 = `<span class="FiveEm"></span>`;
		} else if (action.startsWith("QS_")) {
			part_2 = `<select id="SEL_${i}">
				<option>${msg("specifyAColour")}</option>
				<option>${msg("ignoreThemeColour")}</option>
				<option>${msg("useThemeColour")}</option>
				<option selected>${msg("useQuerySelector")}</option>
			</select>`;
			part_3 = `<input type="text" class="FiveEm" value="${action.replace("QS_", "")}">`;
		} else {
			part_2 = `<select id="SEL_${i}">
				<option selected>${msg("specifyAColour")}</option>
				<option>${msg("ignoreThemeColour")}</option>
				<option>${msg("useThemeColour")}</option>
				<option>${msg("useQuerySelector")}</option>´
			</select>`;
			part_3 = `<input type="color" class="FiveEm" value="${action}">`;
		}
		return Promise.resolve(
			`<td class="TenFiveEm">${part_1}</td>
			<td>${part_2}</td>
			<td id="OPE_${i}">${part_3}</td>
			<td>${part_4}</td>`
		);
	}
}

/**
 * Triggers colour update.
 */
function applySettings() {
	browser.runtime.sendMessage({ reason: "UPDATE_REQUEST" });
}

/**
 * Updates colour of option page or popup.
 */
function autoPageColour() {
	popupDetected() ? autoPopupColour() : autoOptionsColour();
}

/**
 * Updates popup's colour depends on tab bar colour.
 */
function autoPopupColour() {
	// Sets text in info box
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let url = tabs[0].url;
		let domain = url.split(/\/|\?/)[2];
		let id = tabs[0].id;
		if (((url.startsWith("http:") || url.startsWith("https:")) && protectedDomain[domain] != "PROTECTED") || url.startsWith("file:")) {
			browser.tabs.sendMessage(
				id,
				{
					reason: "INFO_REQUEST",
					dynamic: pref.dynamic,
					noThemeColour: pref.noThemeColour,
					reservedColour: reservedColour,
				},
				(RESPONSE_INFO) => {
					if (RESPONSE_INFO) {
						pp_info_display.innerHTML = RESPONSE_INFO;
						let pp_info_action = document.getElementById("info_action");
						if (pp_info_action) {
							pp_info_action.onclick = () => {
								pref.reservedColour[domain] = pp_info_action.dataset.action;
								reservedColour = pref.reservedColour;
								browser.storage.local.set({
									custom: true,
									reservedColour: pref.reservedColour,
								});
								load_lite();
							};
						}
					} else if (url.endsWith(".pdf") || tabs[0].title.endsWith(".pdf")) {
						pp_info_display.innerHTML = msg("colourForPDFViewer");
					} else if (tabs[0].favIconUrl && tabs[0].favIconUrl.startsWith("chrome:")) {
						pp_info_display.innerHTML = msg("pageIsProtected");
					} else if (url.endsWith("http://" + tabs[0].title) || url.endsWith("https://" + tabs[0].title)) {
						pp_info_display.innerHTML = msg("colourForPlainTextViewer");
					} else {
						pp_info_display.innerHTML = msg("errorOccured");
					}
				}
			);
		} else if (url.startsWith("about:firefoxview") || url.startsWith("about:home") || url.startsWith("about:newtab")) {
			pp_info_display.innerHTML = msg("colourForHomePage");
		} else if (url.startsWith("moz-extension:")) {
			let uuid = url.split(/\/|\?/)[2];
			browser.management.getAll().then((addon_list) => {
				let breakLoop = false;
				for (let addon of addon_list) {
					if (addon.type == "extension" && addon.hostPermissions) {
						for (let host of addon.hostPermissions) {
							if (host.startsWith("moz-extension:") && uuid == host.split(/\/|\?/)[2]) {
								if (reservedColour[`Add-on ID: ${addon.id}`]) {
									pp_info_display.innerHTML = msg("useDefaultColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										delete pref.reservedColour[`Add-on ID: ${addon.id}`];
										reservedColour = pref.reservedColour;
										browser.storage.local.set({
											custom: true,
											reservedColour: pref.reservedColour,
										});
									};
								} else if (recommendedColour_addon[addon.id]) {
									pp_info_display.innerHTML = msg("useRecommendedColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										pref.reservedColour[`Add-on ID: ${addon.id}`] = recommendedColour_addon[addon.id];
										reservedColour = pref.reservedColour;
										browser.storage.local.set({
											custom: true,
											reservedColour: pref.reservedColour,
										});
									};
								} else {
									pp_info_display.innerHTML = msg("specifyColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										pref.reservedColour[`Add-on ID: ${addon.id}`] = "#333333";
										reservedColour = pref.reservedColour;
										browser.storage.local
											.set({
												custom: true,
												reservedColour: pref.reservedColour,
											})
											.then(() => browser.runtime.openOptionsPage());
									};
								}
								breakLoop = true;
								break;
							}
						}
					}
					if (breakLoop) break;
				}
			});
		} else {
			pp_info_display.innerHTML = msg("pageIsProtected");
		}
	});
	browser.theme.getCurrent().then((current_theme) => {
		body.style.backgroundColor = current_theme["colors"]["popup"];
		body.style.color = current_theme["colors"]["popup_text"];
		if (current_theme["colors"]["popup_text"] == "rgb(0, 0, 0)") {
			body.classList.add("light");
			body.classList.remove("dark");
		} else {
			body.classList.add("dark");
			body.classList.remove("light");
		}
	});
	if (pref.scheme == "light" || (pref.scheme == "system" && lightModeDetected())) {
		allowDarkLightCheckboxText.innerHTML = msg("allowDarkTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_dark");
	} else {
		allowDarkLightCheckboxText.innerHTML = msg("allowLightTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_bright");
	}
}

/**
 * Updates option page's colour depends on colour scheme.
 */
function autoOptionsColour() {
	if (pref.scheme == "light" || (pref.scheme == "system" && lightModeDetected())) {
		body.classList.add("light");
		body.classList.remove("dark");
		allowDarkLightCheckboxText.innerHTML = msg("allowDarkTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_dark");
	} else {
		body.classList.add("dark");
		body.classList.remove("light");
		allowDarkLightCheckboxText.innerHTML = msg("allowLightTabBar");
		allowDarkLightCheckboxText.parentElement.title = msg("forceModeTooltip_bright");
	}
}

/**
 * @returns true if the script is run by the popup.
 */
function popupDetected() {
	return document.getElementById("more-custom") == null;
}

// Light Mode Match Media on option page
const lightModeDetection_p = window.matchMedia("(prefers-color-scheme: light)");
if (lightModeDetection_p)
	lightModeDetection_p.onchange = () => {
		if (colourSchemeAuto.checked) autoOptionsColour();
	};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect.
 */
function lightModeDetected() {
	return lightModeDetection_p && lightModeDetection_p.matches;
}

/**
 * Overrides content colour scheme.
 * @param {string} scheme "light", "dark", or "system". Converts "system" to "auto" if above v106.
 */
function setBrowserColourScheme(pending_scheme) {
	let version = checkVersion();
	if (version >= 95)
		browser.browserSettings.overrideContentColorScheme.set({
			value: pending_scheme == "system" && version >= 106 ? "auto" : pending_scheme,
		});
}

/**
 * Inquires localised messages.
 * @param {string} key handle in _locales.
 */
function msg(key, placeholder) {
	return browser.i18n.getMessage(key, placeholder);
}
