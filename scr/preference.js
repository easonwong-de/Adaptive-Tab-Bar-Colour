"use strict";

import {
	addonVersion,
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
} from "./default_values.js";
import { hex } from "./colour.js";

export default class preference {
	/** The content of the preference */
	#content = {
		tabbar: 0,
		tabbarBorder: 0,
		tabSelected: 10,
		tabSelectedBorder: 0,
		toolbar: 0,
		toolbarBorder: 0,
		toolbarField: 5,
		toolbarFieldBorder: 5,
		toolbarFieldOnFocus: 5,
		sidebar: 5,
		sidebarBorder: 5,
		popup: 5,
		popupBorder: 5,
		minContrast_light: 90,
		minContrast_dark: 45,
		allowDarkLight: true,
		dynamic: true,
		noThemeColour: true,
		homeBackground_light: default_homeBackground_light,
		homeBackground_dark: default_homeBackground_dark,
		fallbackColour_light: default_fallbackColour_light,
		fallbackColour_dark: default_fallbackColour_dark,
		siteList: {},
		version: addonVersion,
	};

	/** Default content of the preference */
	#default_content = {
		tabbar: 0,
		tabbarBorder: 0,
		tabSelected: 10,
		tabSelectedBorder: 0,
		toolbar: 0,
		toolbarBorder: 0,
		toolbarField: 5,
		toolbarFieldBorder: 5,
		toolbarFieldOnFocus: 5,
		sidebar: 5,
		sidebarBorder: 5,
		popup: 5,
		popupBorder: 5,
		minContrast_light: 90,
		minContrast_dark: 45,
		allowDarkLight: true,
		dynamic: true,
		noThemeColour: true,
		homeBackground_light: default_homeBackground_light,
		homeBackground_dark: default_homeBackground_dark,
		fallbackColour_light: default_fallbackColour_light,
		fallbackColour_dark: default_fallbackColour_dark,
		siteList: {},
		version: addonVersion,
	};

	/** Current pref keys and their legacy version */
	#legacyKey = {
		allowDarkLight: "force",
		tabbar: "tabbar_color",
		tabSelected: "tab_selected_color",
		toolbar: "toolbar_color",
		toolbarBorder: "separator_opacity",
		toolbarField: "toolbar_field_color",
		toolbarFieldOnFocus: "toolbar_field_focus_color",
		sidebar: "sidebar_color",
		sidebarBorder: "sidebar_border_color",
		popup: "popup_color",
		popupBorder: "popup_border_color",
		homeBackground_light: "light_color",
		homeBackground_dark: "dark_color",
		fallbackColour_light: "light_fallback_color",
		fallbackColour_dark: "dark_fallback_color",
		siteList: "reservedColor_cs",
		version: "last_version",
	};

	/**
	 * Loads the preferences from the browser storage to the instance.
	 */
	async load() {
		this.#content = await browser.storage.local.get();
	}

	/**
	 * Stores the preferences from the instance to the browser storage.
	 */
	async save() {
		await browser.storage.local.clear();
		await browser.storage.local.set(this.#content);
	}

	/**
	 * Validates that each property in the `#prefContent` object has the expected data type.
	 *
	 * @returns {boolean} Returns `true` if all properties have the correct data types, otherwise `false`.
	 */
	valid() {
		if (Object.keys(this.#content).length !== Object.keys(this.#default_content).length) return false;
		for (const key in this.#default_content) {
			if (typeof this.#content[key] !== typeof this.#default_content[key]) return false;
		}
		return true;
	}

	/**
	 * Resets a single preference if a valid key is specified.
	 *
	 * Resets all preferences if the key is not specified or invalid.
	 *
	 * @param {string | null} key The key of the preference to reset.
	 */
	reset(key = null) {
		if (key in this.#default_content) {
			this.#content[key] = this.#default_content[key];
		} else {
			this.#content = {};
			for (const key in this.#default_content) {
				this.#content[key] = this.#default_content[key];
			}
		}
	}

	/**
	 * Normalises the preferences content to a consistent format.
	 *
	 * The function adjusts fields as necessary, filling in any missing values to maintain a complete preference structure.
	 *
	 * If the existing preferences don't have a version number, date back before v1.7, or has the version number of 2.2.1, the default pref will overwrite the old pref.
	 *
	 * Once executed, the preferences in the instance are normalised.
	 */
	async normalise() {
		// If there's no version number, if last version was before v1.7, or if it was v2.2.1, resets the preference
		if (
			(!this.#content.last_version && !this.#content.version) ||
			(this.#content.last_version && this.#content.last_version < [1, 7]) ||
			(this.#content.version && JSON.stringify(this.#content.version) === "[2,2,1]")
		) {
			this.reset();
			await this.save();
			return;
		}
		// Transfers the stored pref into the instance
		const oldContent = Object.assign({}, this.#content);
		this.#content = {};
		for (const key in this.#default_content) {
			this.#content[key] = oldContent[key] ?? oldContent[this.#legacyKey[key]] ?? this.#default_content[key];
			if (typeof this.#content[key] !== typeof this.#default_content[key]) {
				this.reset(key);
			}
		}
		// Updating from before v1.7.5
		// Converts from legacy format to query selector format
		if (this.#content.version < [1, 7, 5]) {
			// Clears possible empty policies
			delete this.#content.siteList[undefined];
			for (const site in this.#content.siteList) {
				const legacyPolicy = this.#content.siteList[site];
				if (typeof legacyPolicy !== "string") {
					continue;
				} else if (legacyPolicy.startsWith("TAG_")) {
					this.#content.siteList[site] = legacyPolicy.replace("TAG_", "QS_");
				} else if (legacyPolicy.startsWith("CLASS_")) {
					this.#content.siteList[site] = legacyPolicy.replace("CLASS_", "QS_.");
				} else if (legacyPolicy.startsWith("ID_")) {
					this.#content.siteList[site] = legacyPolicy.replace("ID_", "QS_#");
				} else if (legacyPolicy.startsWith("NAME_")) {
					this.#content.siteList[site] = `${legacyPolicy.replace("NAME_", "QS_[name='")}']`;
				} else if (legacyPolicy === "") {
					delete this.#content.siteList[site];
				}
			}
		}
		// Updating from before v2.2
		if (this.#content.version < [2, 2]) {
			// Turns on allow dark / light tab bar, dynamic, and no theme colour settings for once
			this.#content.allowDarkLight = true;
			this.#content.dynamic = true;
			this.#content.noThemeColour = true;
			// Re-formatting site list
			const newSiteList = {};
			let id = 1;
			for (const site in this.#content.siteList) {
				const legacyPolicy = this.#content.siteList[site];
				if (typeof legacyPolicy !== "string") {
					continue;
				} else if (legacyPolicy === "IGNORE_THEME") {
					newSiteList[id++] = {
						headerType: "URL",
						header: site,
						type: "THEME_COLOUR",
						value: false,
					};
				} else if (legacyPolicy === "UN_IGNORE_THEME") {
					newSiteList[id++] = {
						headerType: "URL",
						header: site,
						type: "THEME_COLOUR",
						value: true,
					};
				} else if (legacyPolicy.startsWith("QS_")) {
					newSiteList[id++] = {
						headerType: "URL",
						header: site,
						type: "QUERY_SELECTOR",
						value: legacyPolicy.replace("QS_", ""),
					};
				} else if (site.startsWith("Add-on ID: ")) {
					newSiteList[id++] = {
						headerType: "ADDON_ID",
						header: site.replace("Add-on ID: ", ""),
						type: "COLOUR",
						value: hex(legacyPolicy),
					};
				} else {
					newSiteList[id++] = {
						headerType: "URL",
						header: site,
						type: "COLOUR",
						value: hex(legacyPolicy),
					};
				}
			}
			this.#content.siteList = newSiteList;
		}
		// Updating from before v2.4
		if (this.#content.version < [2, 4]) {
			if (this.#content.minContrast_light === 165) this.#content.minContrast_light = 90;
		}
		// Makes sure colour offset values are stored in integer
		[
			"tabbar",
			"tabbarBorder",
			"tabSelected",
			"tabSelectedBorder",
			"toolbar",
			"toolbarBorder",
			"toolbarField",
			"toolbarFieldBorder",
			"toolbarFieldOnFocus",
			"sidebar",
			"sidebarBorder",
			"popup",
			"popupBorder",
		].forEach((key) => {
			this.#content[key] = x100IfSmallerThan1(this.#content[key]);
		});
		// Updates the pref version
		this.#content.version = addonVersion;
	}

	/**
	 * Converts the pref to a JSON string.
	 * 
	 * @returns The JSON string of the pref.
	 */
	prefToJSON() {
		return JSON.stringify(this.#content);
	}

	/**
	 * Loads pref from a JSON string and normalises it. Returns `false` if the JSON string is invalid.
	 *
	 * @param {string} JSONString The JSON string to load pref from.
	 * @returns `true` if the JSON string is converted to the pref, otherwise `false`.
	 */
	async JSONToPref(JSONString) {
		try {
			const parsedJSON = JSON.parse(JSONString);
			if (typeof parsedJSON !== "object" || parsedJSON === null) return false;
			this.#content = parsedJSON;
			await this.normalise();
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Returns the policy for a URL / add-on ID from the site list.
	 *
	 * Newly added policies have higher priority.
	 *
	 * Returns `undefined` if nothing matches.
	 *
	 * @param {string} site URL or add-on ID.
	 * @param {string} headerType `URL` (by default), or `ADDON_ID`.
	 */
	getPolicy(site, headerType = "URL") {
		return this.#content.siteList[this.getPolicyId(site, headerType)];
	}

	/**
	 * Gets the policy ID for a URL / add-on ID from the site list.
	 *
	 * Policies with bigger `id` number / newly added policies have higher priority.
	 *
	 * Returns `0` if there's no match.
	 *
	 * @param {string} site URL or add-on ID.
	 * @param {string} headerType `URL` (by default), or `ADDON_ID`.
	 */
	getPolicyId(site, headerType = "URL") {
		let result = 0;
		for (const id in this.#content.siteList) {
			const policy = this.#content.siteList[id];
			if (!policy || policy.header === "" || policy.headerType !== headerType) {
				continue;
			} else if (policy.header === site) {
				result = +id;
				continue;
			} else if (headerType === "URL") {
				try {
					if (policy.header === new URL(site).hostname) {
						result = +id;
						continue;
					}
				} catch (error) {}
				try {
					if (new RegExp(`^${policy.header}\$`).test(site)) {
						result = +id;
						continue;
					}
				} catch (error) {}
			}
		}
		return result;
	}

	/**
	 * Adds a policy to the site list.
	 *
	 * @param {object} policy The policy to add.
	 * @returns The ID of the policy.
	 */
	addPolicy(policy) {
		let id = 1;
		while (id in this.#content.siteList) id++;
		this.#content.siteList[id] = policy;
		return id;
	}

	/**
	 * Removes a policy from the site list by setting the policy to `null`.
	 *
	 * @param {number | string} id The ID of a policy.
	 */
	removePolicy(id) {
		this.#content.siteList[id] = null;
	}

	get allowDarkLight() {
		return this.#content.allowDarkLight;
	}
	set allowDarkLight(value) {
		this.#content.allowDarkLight = value;
	}

	get dynamic() {
		return this.#content.dynamic;
	}
	set dynamic(value) {
		this.#content.dynamic = value;
	}

	get noThemeColour() {
		return this.#content.noThemeColour;
	}
	set noThemeColour(value) {
		this.#content.noThemeColour = value;
	}

	get tabbar() {
		return this.#content.tabbar;
	}
	set tabbar(value) {
		this.#content.tabbar = value;
	}

	get tabbarBorder() {
		return this.#content.tabbarBorder;
	}
	set tabbarBorder(value) {
		this.#content.tabbarBorder = value;
	}

	get tabSelected() {
		return this.#content.tabSelected;
	}
	set tabSelected(value) {
		this.#content.tabSelected = value;
	}

	get tabSelectedBorder() {
		return this.#content.tabSelectedBorder;
	}
	set tabSelectedBorder(value) {
		this.#content.tabSelectedBorder = value;
	}

	get toolbar() {
		return this.#content.toolbar;
	}
	set toolbar(value) {
		this.#content.toolbar = value;
	}

	get toolbarBorder() {
		return this.#content.toolbarBorder;
	}
	set toolbarBorder(value) {
		this.#content.toolbarBorder = value;
	}

	get toolbarField() {
		return this.#content.toolbarField;
	}
	set toolbarField(value) {
		this.#content.toolbarField = value;
	}

	get toolbarFieldBorder() {
		return this.#content.toolbarFieldBorder;
	}
	set toolbarFieldBorder(value) {
		this.#content.toolbarFieldBorder = value;
	}

	get toolbarFieldOnFocus() {
		return this.#content.toolbarFieldOnFocus;
	}
	set toolbarFieldOnFocus(value) {
		this.#content.toolbarFieldOnFocus = value;
	}

	get sidebar() {
		return this.#content.sidebar;
	}
	set sidebar(value) {
		this.#content.sidebar = value;
	}

	get sidebarBorder() {
		return this.#content.sidebarBorder;
	}
	set sidebarBorder(value) {
		this.#content.sidebarBorder = value;
	}

	get popup() {
		return this.#content.popup;
	}
	set popup(value) {
		this.#content.popup = value;
	}

	get popupBorder() {
		return this.#content.popupBorder;
	}
	set popupBorder(value) {
		this.#content.popupBorder = value;
	}

	get minContrast_light() {
		return this.#content.minContrast_light;
	}
	set minContrast_light(value) {
		this.#content.minContrast_light = value;
	}

	get minContrast_dark() {
		return this.#content.minContrast_dark;
	}
	set minContrast_dark(value) {
		this.#content.minContrast_dark = value;
	}

	get homeBackground_light() {
		return this.#content.homeBackground_light;
	}
	set homeBackground_light(value) {
		this.#content.homeBackground_light = value;
	}

	get homeBackground_dark() {
		return this.#content.homeBackground_dark;
	}
	set homeBackground_dark(value) {
		this.#content.homeBackground_dark = value;
	}

	get fallbackColour_light() {
		return this.#content.fallbackColour_light;
	}
	set fallbackColour_light(value) {
		this.#content.fallbackColour_light = value;
	}

	get fallbackColour_dark() {
		return this.#content.fallbackColour_dark;
	}
	set fallbackColour_dark(value) {
		this.#content.fallbackColour_dark = value;
	}

	get siteList() {
		return this.#content.siteList;
	}
	set siteList(value) {
		this.#content.siteList = value;
	}

	get version() {
		return this.#content.version;
	}
	set version(value) {
		this.#content.version = value;
	}
}

/**
 * @param {number} num
 */
function x100IfSmallerThan1(num) {
	if (-1 < num && num < 1) return Math.round(num * 100);
	else return +num;
}
