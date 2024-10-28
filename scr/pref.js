/**
 * Legacy pref keys and their current version.
 */
export const legacyPrefKey = Object.freeze({
	force: "allowDarkLight",
	tabbar_color: "tabbar",
	tab_selected_color: "tabSelected",
	toolbar_color: "toolbar",
	separator_opacity: "toolbarBorder",
	toolbar_field_color: "toolbarField",
	toolbar_field_focus_color: "toolbarFieldOnFocus",
	sidebar_color: "sidebar",
	sidebar_border_color: "sidebarBorder",
	popup_color: "popup",
	popup_border_color: "popupBorder",
	light_color: "homeBackground_light",
	dark_color: "homeBackground_dark",
	light_fallback_color: "fallbackColour_light",
	dark_fallback_color: "fallbackColour_dark",
	customRule_cs: "customRule_webPage",
	last_version: "version",
});

/**
 * @param {Object} pref preference object.
 * @returns integrity of the preference object.
 */
export function verifyPref(pref) {
	const expectedTypes = {
		allowDarkLight: "boolean",
		dynamic: "boolean",
		noThemeColour: "boolean",
		tabbar: "number",
		tabbarBorder: "number",
		tabSelected: "number",
		tabSelectedBorder: "number",
		toolbar: "number",
		toolbarBorder: "number",
		toolbarField: "number",
		toolbarFieldBorder: "number",
		toolbarFieldOnFocus: "number",
		sidebar: "number",
		sidebarBorder: "number",
		popup: "number",
		popupBorder: "number",
		minContrast_light: "number",
		minContrast_dark: "number",
		custom: "boolean",
		homeBackground_light: "string",
		homeBackground_dark: "string",
		fallbackColour_light: "string",
		fallbackColour_dark: "string",
		customRule_webPage: "string",
		version: "object",
	};
	for (const key in expectedTypes) {
		if (typeof pref[key] !== expectedTypes[key]) {
			return false;
		}
	}
	return true;
}
