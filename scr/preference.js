"use strict";

import {
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
} from "./default_values.js";

export default class preference {
	/** The content of the preference */
	#prefContent = {
		allowDarkLight: true,
		dynamic: true,
		noThemeColour: true,
		tabbar: 0,
		tabbarBorder: 0,
		tabSelected: 0.1,
		tabSelectedBorder: 0.0,
		toolbar: 0,
		toolbarBorder: 0,
		toolbarField: 0.05,
		toolbarFieldBorder: 0.1,
		toolbarFieldOnFocus: 0.05,
		sidebar: 0.05,
		sidebarBorder: 0.05,
		popup: 0.05,
		popupBorder: 0.05,
		minContrast_light: 9,
		minContrast_dark: 4.5,
		custom: false,
		homeBackground_light: default_homeBackground_light,
		homeBackground_dark: default_homeBackground_dark,
		fallbackColour_light: default_fallbackColour_light,
		fallbackColour_dark: default_fallbackColour_dark,
		customRule: {},
		version: [2, 2],
	};

	/** Legacy pref keys and their current version */
	#legacyPrefKey = {
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
	};

	/** Expected data type of pref values */
	#expectedTypes = {
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
		customRule: "object",
		version: "object",
	};

	/**
	 * Validates that each property in the `#prefContent` object has the expected data type.
	 *
	 * @returns {boolean} Returns `true` if all properties have the correct data types, otherwise `false`.
	 */
	valid() {
		for (const key in this.#expectedTypes) {
			if (typeof this.#prefContent[key] !== this.#expectedTypes[key]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Normalises saved preferences to a consistent format (v2.2).
	 *
	 * Ensures compatibility across various versions of saved preferences by converting them to the latest standard format.
	 * The function adjusts fields as necessary, filling in any missing values to maintain a complete preference structure.
	 *
	 * Once executed, the normalised preferences are loaded in the instance and saved to browser storage.
	 */
	async normalise() {
		const storedPref = await browser.storage.local.get();
		for (const key in storedPref) {
			if (key in this.#prefContent) {
				this.#prefContent[key] = storedPref[key];
			} else if (key in this.#legacyPrefKey) {
				this.#prefContent[this.#legacyPrefKey[key]] = storedPref[key];
			}
		}
		// Updating from before v2.2
		if (this.#prefContent.version < [2, 2]) {
			this.#prefContent.dynamic = true;
			this.#prefContent.allowDarkLight = true;
			this.#prefContent.noThemeColour = true;
			if (this.#prefContent.scheme === "system") {
				this.#prefContent.scheme = "auto";
			}
		}
		// Updating from before v1.7.5
		// Converts legacy rules to query selector format
		if (this.#prefContent.version < [1, 7, 5]) {
			for (const url in this.#prefContent.customRule) {
				const legacyRule = this.#prefContent.customRule[url];
				if (legacyRule.startsWith("TAG_")) {
					this.#prefContent.customRule[url] = legacyRule.replace("TAG_", "QS_");
				} else if (legacyRule.startsWith("CLASS_")) {
					this.#prefContent.customRule[url] = legacyRule.replace("CLASS_", "QS_.");
				} else if (legacyRule.startsWith("ID_")) {
					this.#prefContent.customRule[url] = legacyRule.replace("ID_", "QS_#");
				} else if (legacyRule.startsWith("NAME_")) {
					this.#prefContent.customRule[url] = `${legacyRule.replace("NAME_", "QS_[name='")}']`;
				} else if (legacyRule === "") {
					delete this.#prefContent.customRule[url];
				}
			}
		}
		// Updating from before v1.7.4
		// Clears possible empty reserved colour rules caused by a bug
		if (this.#prefContent.version < [1, 7, 4]) {
			delete this.#prefContent.customRule[undefined];
		}
		// Updating from before v1.6.4
		// Corrects the dark home page colour, unless the user has set something different
		if (
			this.#prefContent.version < [1, 6, 5] &&
			this.#prefContent.homeBackground_dark.toUpperCase() === "#1C1B22"
		) {
			this.#prefContent.homeBackground_dark = default_homeBackground_dark;
		}
		await this.save();
	}

	async load() {
		this.#prefContent = await browser.storage.local.get();
	}

	async save() {
		await browser.storage.local.set(this.#prefContent);
	}

	get allowDarkLight() {
		return this.#prefContent.allowDarkLight;
	}
	set allowDarkLight(value) {
		this.#prefContent.allowDarkLight = value;
	}

	get dynamic() {
		return this.#prefContent.dynamic;
	}
	set dynamic(value) {
		this.#prefContent.dynamic = value;
	}

	get noThemeColour() {
		return this.#prefContent.noThemeColour;
	}
	set noThemeColour(value) {
		this.#prefContent.noThemeColour = value;
	}

	get tabbar() {
		return this.#prefContent.tabbar;
	}
	set tabbar(value) {
		this.#prefContent.tabbar = value;
	}

	get tabbarBorder() {
		return this.#prefContent.tabbarBorder;
	}
	set tabbarBorder(value) {
		this.#prefContent.tabbarBorder = value;
	}

	get tabSelected() {
		return this.#prefContent.tabSelected;
	}
	set tabSelected(value) {
		this.#prefContent.tabSelected = value;
	}

	get tabSelectedBorder() {
		return this.#prefContent.tabSelectedBorder;
	}
	set tabSelectedBorder(value) {
		this.#prefContent.tabSelectedBorder = value;
	}

	get toolbar() {
		return this.#prefContent.toolbar;
	}
	set toolbar(value) {
		this.#prefContent.toolbar = value;
	}

	get toolbarBorder() {
		return this.#prefContent.toolbarBorder;
	}
	set toolbarBorder(value) {
		this.#prefContent.toolbarBorder = value;
	}

	get toolbarField() {
		return this.#prefContent.toolbarField;
	}
	set toolbarField(value) {
		this.#prefContent.toolbarField = value;
	}

	get toolbarFieldBorder() {
		return this.#prefContent.toolbarFieldBorder;
	}
	set toolbarFieldBorder(value) {
		this.#prefContent.toolbarFieldBorder = value;
	}

	get toolbarFieldOnFocus() {
		return this.#prefContent.toolbarFieldOnFocus;
	}
	set toolbarFieldOnFocus(value) {
		this.#prefContent.toolbarFieldOnFocus = value;
	}

	get sidebar() {
		return this.#prefContent.sidebar;
	}
	set sidebar(value) {
		this.#prefContent.sidebar = value;
	}

	get sidebarBorder() {
		return this.#prefContent.sidebarBorder;
	}
	set sidebarBorder(value) {
		this.#prefContent.sidebarBorder = value;
	}

	get popup() {
		return this.#prefContent.popup;
	}
	set popup(value) {
		this.#prefContent.popup = value;
	}

	get popupBorder() {
		return this.#prefContent.popupBorder;
	}
	set popupBorder(value) {
		this.#prefContent.popupBorder = value;
	}

	get minContrast_light() {
		return this.#prefContent.minContrast_light;
	}
	set minContrast_light(value) {
		this.#prefContent.minContrast_light = value;
	}

	get minContrast_dark() {
		return this.#prefContent.minContrast_dark;
	}
	set minContrast_dark(value) {
		this.#prefContent.minContrast_dark = value;
	}

	get custom() {
		return this.#prefContent.custom;
	}
	set custom(value) {
		this.#prefContent.custom = value;
	}

	get homeBackground_light() {
		return this.#prefContent.homeBackground_light;
	}
	set homeBackground_light(value) {
		this.#prefContent.homeBackground_light = value;
	}

	get homeBackground_dark() {
		return this.#prefContent.homeBackground_dark;
	}
	set homeBackground_dark(value) {
		this.#prefContent.homeBackground_dark = value;
	}

	get fallbackColour_light() {
		return this.#prefContent.fallbackColour_light;
	}
	set fallbackColour_light(value) {
		this.#prefContent.fallbackColour_light = value;
	}

	get fallbackColour_dark() {
		return this.#prefContent.fallbackColour_dark;
	}
	set fallbackColour_dark(value) {
		this.#prefContent.fallbackColour_dark = value;
	}

	get customRule() {
		return this.#prefContent.customRule;
	}
	set customRule(value) {
		this.#prefContent.customRule = value;
	}

	get version() {
		return this.#prefContent.version;
	}
	set version(value) {
		this.#prefContent.version = value;
	}
}
