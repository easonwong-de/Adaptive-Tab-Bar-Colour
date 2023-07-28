// This script is shared by option page and popup

// Localisation
document.addEventListener("DOMContentLoaded", function () {
	document.querySelectorAll("[data-text]").forEach((element) => {
		element.textContent = msg(element.dataset.text);
	});
	document.querySelectorAll("[data-title]").forEach((element) => {
		element.title = msg(element.dataset.title);
	});
});

// Settings cache: always synced with settings page
var pref_scheme; // scheme
var pref_allow_dark_light; // force
var pref_dynamic; // dynamic
var pref_no_theme_color; // no_theme_color
var pref_tabbar; // tabbar_color
var pref_tab_selected; // tab_selected
var pref_toolbar; // toolbar_color
var pref_toolbar_border_bottom; // separator_opacity
var pref_toolbar_field; // toolbar_field_color
var pref_toolbar_field_focus; // toolbar_field_focus_color
var pref_sidebar; // sidebar_color
var pref_sidebar_border; // sidebar_border_color
var pref_popup; // popup_color
var pref_popup_border; // popup_color
var pref_custom; // custom
var pref_home_light; // light_color
var pref_home_dark; // dark_color
var pref_fallback_light; // light_fallback_color
var pref_fallback_dark; // dark_fallback_color
var pref_reservedColor_cs; // reservedColor_cs

// Current color lookup table
var current_reservedColor_cs;

// Default color lookup table
const default_reservedColor_cs = Object.freeze({
	"apnews.com": "IGNORE_THEME",
	"developer.mozilla.org": "IGNORE_THEME",
	"www.facebook.com": "UN_IGNORE_THEME",
	"github.com": "IGNORE_THEME",
	"mail.google.com": "QS_div.wl",
	"open.spotify.com": "#000000",
	"www.linkedin.com": "IGNORE_THEME",
	"www.spiegel.de": "IGNORE_THEME",
});

const svg_bin = `<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
const svg_warning = `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

/**
 * Caches pref into local variables and checks integrity.
 */
function cachePref_option(pref) {
	// loads prefs
	pref_scheme = pref.scheme;
	pref_allow_dark_light = pref.force;
	pref_dynamic = pref.dynamic;
	pref_no_theme_color = pref.no_theme_color;
	pref_tabbar = pref.tabbar_color;
	pref_tab_selected = pref.tab_selected_color;
	pref_toolbar = pref.toolbar_color;
	pref_toolbar_border_bottom = pref.separator_opacity;
	pref_toolbar_field = pref.toolbar_field_color;
	pref_toolbar_field_focus = pref.toolbar_field_focus_color;
	pref_sidebar = pref.sidebar_color;
	pref_sidebar_border = pref.sidebar_border_color;
	pref_popup = pref.popup_color;
	pref_popup_border = pref.popup_border_color;
	pref_custom = pref.custom;
	pref_home_light = pref.light_color;
	pref_home_dark = pref.dark_color;
	pref_fallback_light = pref.light_fallback_color;
	pref_fallback_dark = pref.dark_fallback_color;
	pref_reservedColor_cs = pref.reservedColor_cs;
	current_reservedColor_cs = pref_custom ? pref_reservedColor_cs : default_reservedColor_cs;
	return (
		pref_scheme != null &&
		pref_allow_dark_light != null &&
		pref_dynamic != null &&
		pref_no_theme_color != null &&
		pref_tabbar != null &&
		pref_tab_selected != null &&
		pref_toolbar != null &&
		pref_toolbar_border_bottom != null &&
		pref_toolbar_field != null &&
		pref_toolbar_field_focus != null &&
		pref_sidebar != null &&
		pref_sidebar_border != null &&
		pref_popup != null &&
		pref_popup_border != null &&
		pref_custom != null &&
		pref_home_light != null &&
		pref_home_dark != null &&
		pref_fallback_light != null &&
		pref_fallback_dark != null &&
		pref_reservedColor_cs != null
	);
}

// Recommended color for Add-ons' built-in page
const recommendedColor_addon = Object.freeze({
	"uBlock0@raymondhill.net": "#1b1a23",
	"adguardadblocker@adguard.com": "#131313",
	"{ce9f4b1f-24b8-4e9a-9051-b9e472b1b2f2}": "#fffffe",
	"enhancerforyoutube@maximerf.addons.mozilla.org": "#282a2d",
	"languagetool-webextension@languagetool.org": "#111113",
	"sponsorBlocker@ajay.app": "#323232",
	"tongwen@softcup": "#fffffe",
	"{46551EC9-40F0-4e47-8E18-8E5CF550CFB8}": "#fffffe",
	"{e7476172-097c-4b77-b56e-f56a894adca9}": "#151f2a",
});

// List of protected domains
const protected_domains = Object.freeze({
	"accounts-static.cdn.mozilla.net": "PROTECTED",
	"accounts.firefox.com": "PROTECTED",
	"addons.cdn.mozilla.net": "PROTECTED",
	"addons.mozilla.org": "PROTECTED",
	"content.cdn.mozilla.net": "PROTECTED",
	"discovery.addons.mozilla.org": "PROTECTED",
	"install.mozilla.org": "PROTECTED",
	"support.mozilla.org": "PROTECTED",
});

let body = document.getElementsByTagName("body")[0];
let loading = document.getElementById("loading");
let settings = document.getElementById("settings");
let color_scheme_light = document.getElementById("color_scheme_no_dark");
let color_scheme_dark = document.getElementById("color_scheme_no_light");
let color_scheme_system = document.getElementById("color_scheme_system");
let allow_dark_light = document.getElementById("force_mode");
let force_mode_caption = document.getElementById("force_mode_caption");
let dynamic = document.getElementById("dynamic");
let no_theme_color = document.getElementById("no_theme_color");
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
let op_more_custom = document.getElementById("more_custom");
let op_custom_options = document.getElementById("custom_options");
let op_custom_options_table = document.getElementById("custom_options_table");
let op_light_color = document.getElementById("light_color");
let op_dark_color = document.getElementById("dark_color");
let op_reset_light = document.getElementById("reset_light_color");
let op_reset_dark = document.getElementById("reset_dark_color");
let op_light_fallback_color = document.getElementById("light_fallback_color");
let op_dark_fallback_color = document.getElementById("dark_fallback_color");
let op_reset_light_fallback = document.getElementById("reset_light_fallback_color");
let op_reset_dark_fallback = document.getElementById("reset_dark_fallback_color");
let op_reset_all = document.getElementById("reset_all");
let op_save = document.getElementById("save");
let op_add = document.getElementById("add");
let pp_more_custom = document.getElementById("custom_popup");
let pp_info_display = document.getElementById("info_display");

settings.hidden = true;
loading.hidden = false;

popupDetected() ? load_lite() : load();

browser.theme.onUpdated.addListener(autoPageColor);
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
	browser.storage.local.get((pref) => {
		if (cachePref_option(pref)) {
			color_scheme_dark.checked = pref_scheme === "dark";
			color_scheme_light.checked = pref_scheme === "light";
			color_scheme_system.checked = pref_scheme === "system";
			allow_dark_light.checked = !pref_allow_dark_light;
			dynamic.checked = pref_dynamic;
			no_theme_color.checked = pref_no_theme_color;
			if (!popupDetected()) {
				// when the script is run by option page
				op_tabbar.value = pref_tabbar;
				op_tab_selected.value = pref_tab_selected;
				op_toolbar.value = pref_toolbar;
				op_toolbar_border_bottom.value = pref_toolbar_border_bottom;
				op_toolbar_field.value = pref_toolbar_field;
				op_toolbar_field_focus.value = pref_toolbar_field_focus;
				op_sidebar.value = pref_sidebar;
				op_sidebar_border.value = pref_sidebar_border;
				op_popup.value = pref_popup;
				op_popup_border.value = pref_popup_border;
				op_more_custom.checked = pref_custom;
				op_custom_options.className = pref_custom ? "enabled" : "disabled";
				op_light_color.value = pref_home_light;
				op_dark_color.value = pref_home_dark;
				op_light_fallback_color.value = pref_fallback_light;
				op_dark_fallback_color.value = pref_fallback_dark;
				let table_rows = op_custom_options_table.rows;
				for (let i = table_rows.length - 1; i > 3; i--) op_custom_options_table.deleteRow(i);
				let domains = Object.keys(pref_reservedColor_cs);
				domains.forEach((domain, i) => {
					let new_row = op_custom_options_table.insertRow(i + 4);
					generateNewRow(domain, i).then((new_row_HTML) => {
						new_row.innerHTML += new_row_HTML;
						addAction(i);
					});
				});
			}
			autoPageColor();
			loading.hidden = true;
			settings.hidden = false;
		} else {
			browser.runtime.sendMessage({ reason: "INIT_REQUEST" });
		}
	});
}

/**
 * Only loads color scheme, force mode, dynamic mode, ignore theme color pref.
 */
function load_lite() {
	browser.storage.local.get((pref) => {
		if (cachePref_option(pref)) {
			color_scheme_dark.checked = pref_scheme === "dark";
			color_scheme_light.checked = pref_scheme === "light";
			color_scheme_system.checked = pref_scheme === "system";
			allow_dark_light.checked = !pref_allow_dark_light;
			dynamic.checked = pref_dynamic;
			no_theme_color.checked = pref_no_theme_color;
			autoPageColor();
			loading.hidden = true;
			settings.hidden = false;
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
 * Sets the color scheme, and updates appearance of option page.
 * @param {string} pending_scheme "light", "dark", or "system".
 */
function changeColorScheme(pending_scheme) {
	pref_scheme = pending_scheme;
	browser.storage.local.set({ scheme: pending_scheme });
	setBrowserColorScheme(pending_scheme);
	autoPageColor();
}

// If it's below v95.0, grey out "allow..." option
if (checkVersion() < 95) {
	allow_dark_light.checked = false;
	allow_dark_light.disabled = true;
} else {
	allow_dark_light.onclick = () => {
		pref_allow_dark_light = !allow_dark_light.checked;
		browser.storage.local.set({ force: !allow_dark_light.checked });
	};
}

dynamic.onclick = () => {
	pref_dynamic = dynamic.checked;
	browser.storage.local.set({ dynamic: dynamic.checked });
};

no_theme_color.onclick = () => {
	pref_no_theme_color = no_theme_color.checked;
	browser.storage.local.set({ no_theme_color: no_theme_color.checked });
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
	pp_more_custom.onclick = () => browser.runtime.openOptionsPage();
} else {
	op_tabbar.oninput = () => browser.storage.local.set({ tabbar_color: Number(op_tabbar.value) });
	op_tab_selected.oninput = () => browser.storage.local.set({ tab_selected_color: Number(op_tab_selected.value) });
	op_toolbar.oninput = () => browser.storage.local.set({ toolbar_color: Number(op_toolbar.value) });
	op_toolbar_border_bottom.oninput = () => browser.storage.local.set({ separator_opacity: Number(op_toolbar_border_bottom.value) });
	op_toolbar_field.oninput = () => browser.storage.local.set({ toolbar_field_color: Number(op_toolbar_field.value) });
	op_toolbar_field_focus.oninput = () => browser.storage.local.set({ toolbar_field_focus_color: Number(op_toolbar_field_focus.value) });
	op_sidebar.oninput = () => browser.storage.local.set({ sidebar_color: Number(op_sidebar.value) });
	op_sidebar_border.oninput = () => browser.storage.local.set({ sidebar_border_color: Number(op_sidebar_border.value) });
	op_popup.oninput = () => browser.storage.local.set({ popup_color: Number(op_popup.value) });
	op_popup_border.oninput = () => browser.storage.local.set({ popup_border_color: Number(op_popup_border.value) });
	op_more_custom.onchange = () => {
		op_custom_options.className = op_more_custom.checked ? "enabled" : "disabled";
		browser.storage.local.set({ custom: op_more_custom.checked });
	};
	op_light_color.onchange = () => browser.storage.local.set({ light_color: op_light_color.value });
	op_dark_color.onchange = () => browser.storage.local.set({ dark_color: op_dark_color.value });
	op_reset_light.onclick = () => browser.storage.local.set({ light_color: "#FFFFFF" }).then(load);
	op_reset_dark.onclick = () => browser.storage.local.set({ dark_color: "#2B2A33" }).then(load);
	op_light_fallback_color.onchange = () => browser.storage.local.set({ light_fallback_color: op_light_fallback_color.value });
	op_dark_fallback_color.onchange = () => browser.storage.local.set({ dark_fallback_color: op_dark_fallback_color.value });
	op_reset_light_fallback.onclick = () => browser.storage.local.set({ light_fallback_color: "#FFFFFF" }).then(load);
	op_reset_dark_fallback.onclick = () => browser.storage.local.set({ dark_fallback_color: "#2B2A33" }).then(load);
	op_reset_all.onclick = () => {
		if (confirm(msg("resetRuleConfirm"))) browser.storage.local.set({ reservedColor_cs: default_reservedColor_cs }).then(load);
	};
	op_add.onclick = () => {
		let i = 0;
		while (document.getElementById(`DOM_${i}`) != null) i++; // finds an unoccupied index
		let new_row = op_custom_options_table.insertRow(op_custom_options_table.rows.length);
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
	let pending_reservedColor_cs = {};
	let all_table_rows = op_custom_options_table.firstElementChild.children;
	for (let i = 4; i < all_table_rows.length; i++) {
		let table_cells = all_table_rows[i].children;
		let domain = table_cells[0].firstElementChild.title;
		if (!domain) domain = table_cells[0].firstElementChild.value;
		if (domain != "" && isNaN(domain) && pending_reservedColor_cs[domain] == null) {
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
				pending_reservedColor_cs[domain] = action;
				if (table_cells[4] != null) table_cells[4].remove();
			} else {
				if (table_cells[4] == null) all_table_rows[i].insertCell().innerHTML = svg_warning;
			}
		} else {
			if (table_cells[4] == null) all_table_rows[i].insertCell().innerHTML = svg_warning;
		}
	}
	browser.storage.local.set({ reservedColor_cs: pending_reservedColor_cs });
}

/**
 * Reads settings for a domain, generates new HTML elements and gives them id-s.
 * These HTML elements shall be inserted into op_custom_options_table using insertRow().
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
				let part_3 = `<input type="color" class="FiveEm" value="${pref_reservedColor_cs[domain]}">`;
				let part_4 = `<button id="DEL_${i}" title="${msg("delete")}">${svg_bin}</button>`;
				resolve(`<td class="TenFiveEm">${part_1}</td>
				<td>${part_2}</td>
				<td id="OPE_${i}">${part_3}</td>
				<td>${part_4}</td>`);
			});
		});
	} else {
		let action;
		if (domain === "") {
			domain = "example.com";
			action = "#ECECEC";
		} else {
			action = pref_reservedColor_cs[domain];
		}
		let part_1 = `<input id="DOM_${i}" type="text" value="${domain}">`;
		let part_2 = ``;
		let part_3 = ``;
		let part_4 = `<button id="DEL_${i}" title="${msg("delete")}">${svg_bin}</button>`;
		if (action === "IGNORE_THEME") {
			part_2 = `<select id="SEL_${i}">
				<option>${msg("specifyAColour")}</option>
				<option selected>${msg("ignoreThemeColour")}</option>
				<option>${msg("useThemeColour")}</option>
				<option>${msg("useQuerySelector")}</option>
			</select>`;
			part_3 = `<span class="FiveEm"></span>`;
		} else if (action === "UN_IGNORE_THEME") {
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
 * Triggers color update.
 */
function applySettings() {
	browser.runtime.sendMessage({ reason: "UPDATE_REQUEST" });
}

/**
 * Updates color of option page or popup.
 */
function autoPageColor() {
	popupDetected() ? autoPopupColor() : autoOptionsColor();
}

/**
 * Updates popup's color depends on tab bar color.
 */
function autoPopupColor() {
	// Sets text in info box
	browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		let url = tabs[0].url;
		let domain = url.split(/\/|\?/)[2];
		let id = tabs[0].id;
		if (((url.startsWith("http:") || url.startsWith("https:")) && protected_domains[domain] != "PROTECTED") || url.startsWith("file:")) {
			browser.tabs.sendMessage(
				id,
				{
					reason: "INFO_REQUEST",
					dynamic: pref_dynamic,
					no_theme_color: pref_no_theme_color,
					reservedColor_cs: current_reservedColor_cs,
				},
				(RESPONSE_INFO) => {
					if (RESPONSE_INFO) {
						pp_info_display.innerHTML = RESPONSE_INFO;
						let pp_info_action = document.getElementById("info_action");
						if (pp_info_action) {
							pp_info_action.onclick = () => {
								pref_reservedColor_cs[domain] = pp_info_action.dataset.action;
								current_reservedColor_cs = pref_reservedColor_cs;
								browser.storage.local.set({
									custom: true,
									reservedColor_cs: pref_reservedColor_cs,
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
				for (addon of addon_list) {
					if (addon.type === "extension" && addon.hostPermissions) {
						for (host of addon.hostPermissions) {
							if (host.startsWith("moz-extension:") && uuid === host.split(/\/|\?/)[2]) {
								if (current_reservedColor_cs[`Add-on ID: ${addon.id}`]) {
									pp_info_display.innerHTML = msg("useDefaultColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										delete pref_reservedColor_cs[`Add-on ID: ${addon.id}`];
										current_reservedColor_cs = pref_reservedColor_cs;
										browser.storage.local.set({
											custom: true,
											reservedColor_cs: pref_reservedColor_cs,
										});
									};
								} else if (recommendedColor_addon[addon.id]) {
									pp_info_display.innerHTML = msg("useRecommendedColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										pref_reservedColor_cs[`Add-on ID: ${addon.id}`] = recommendedColor_addon[addon.id];
										current_reservedColor_cs = pref_reservedColor_cs;
										browser.storage.local.set({
											custom: true,
											reservedColor_cs: pref_reservedColor_cs,
										});
									};
								} else {
									pp_info_display.innerHTML = msg("specifyColourForAddon", addon.name);
									document.getElementById("info_action").onclick = () => {
										pref_reservedColor_cs[`Add-on ID: ${addon.id}`] = "#333333";
										current_reservedColor_cs = pref_reservedColor_cs;
										browser.storage.local
											.set({
												custom: true,
												reservedColor_cs: pref_reservedColor_cs,
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
		if (current_theme["colors"]["popup_text"] === "rgb(0, 0, 0)") {
			body.classList.add("light");
			body.classList.remove("dark");
		} else {
			body.classList.add("dark");
			body.classList.remove("light");
		}
	});
	if (pref_scheme === "light" || (pref_scheme === "system" && lightModeDetected())) {
		force_mode_caption.innerHTML = msg("allowDarkTabBar");
		force_mode_caption.parentElement.title = msg("forceModeTooltip_dark");
	} else {
		force_mode_caption.innerHTML = msg("allowLightTabBar");
		force_mode_caption.parentElement.title = msg("forceModeTooltip_bright");
	}
}

/**
 * Updates option page's color depends on color scheme.
 */
function autoOptionsColor() {
	if (pref_scheme === "light" || (pref_scheme === "system" && lightModeDetected())) {
		body.classList.add("light");
		body.classList.remove("dark");
		force_mode_caption.innerHTML = msg("allowDarkTabBar");
		force_mode_caption.parentElement.title = msg("forceModeTooltip_dark");
	} else {
		body.classList.add("dark");
		body.classList.remove("light");
		force_mode_caption.innerHTML = msg("allowLightTabBar");
		force_mode_caption.parentElement.title = msg("forceModeTooltip_bright");
	}
}

/**
 * @returns true if the script is run by the popup.
 */
function popupDetected() {
	return document.getElementById("more_custom") == null;
}

// Light Mode Match Media on option page
const lightModeDetection_p = window.matchMedia("(prefers-color-scheme: light)");
if (lightModeDetection_p)
	lightModeDetection_p.onchange = () => {
		if (color_scheme_system.checked) autoOptionsColor();
	};

/**
 * @returns true if in light mode, false if in dark mode or cannot detect.
 */
function lightModeDetected() {
	return lightModeDetection_p && lightModeDetection_p.matches;
}

/**
 * @returns Firefox version. 999 if cannot be found.
 */
function checkVersion() {
	let userAgent = navigator.userAgent;
	let version = 999;
	let ind = userAgent.lastIndexOf("Firefox");
	if (ind != -1) {
		version = userAgent.substring(ind + 8);
	}
	return version;
}

/**
 * Overrides content color scheme.
 * @param {string} scheme "light", "dark", or "system". Converts "system" to "auto" if above v106.
 */
function setBrowserColorScheme(pending_scheme) {
	let version = checkVersion();
	if (version >= 95)
		browser.browserSettings.overrideContentColorScheme.set({
			value: pending_scheme === "system" && version >= 106 ? "auto" : pending_scheme,
		});
}

/**
 * Inquires localised messages.
 * @param {string} key handle in _locales.
 */
function msg(key, placeholder) {
	return browser.i18n.getMessage(key, placeholder);
}
