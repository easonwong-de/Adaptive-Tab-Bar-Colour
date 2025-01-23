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
	#prefContent = {
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
		minContrast_light: 165,
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
	#default_prefContent = {
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
		minContrast_light: 165,
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
	 * Validates that each property in the `#prefContent` object has the expected data type.
	 *
	 * @returns {boolean} Returns `true` if all properties have the correct data types, otherwise `false`.
	 */
	valid() {
		if (Object.keys(this.#prefContent).length !== Object.keys(this.#default_prefContent).length) {
			return false;
		}
		for (const key in this.#default_prefContent) {
			if (typeof this.#prefContent[key] !== typeof this.#default_prefContent[key]) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Normalises saved preferences to a consistent format (v2.2).
	 *
	 * Ensures compatibility across various versions of saved preferences by converting them to the latest standard format.
	 *
	 * The function adjusts fields as necessary, filling in any missing values to maintain a complete preference structure.
	 *
	 * If the existing preferences date back before v1.7, or has the version number of 2.2.1, replaces the old pref with the default pref.
	 *
	 * Once executed, the normalised preferences are loaded in the instance and saved to browser storage.
	 */
	async normalise() {
		const storedPref = await browser.storage.local.get();
		// If there's no version number, if last version was before v1.7, or if it was v2.2.1, resets the preference
		if (
			(!storedPref.last_version && !storedPref.version) ||
			(storedPref.last_version && storedPref.last_version < [1, 7]) ||
			(storedPref.version && JSON.stringify(storedPref.version) == "[2,2,1]")
		) {
			this.reset();
			await this.save();
			return;
		}
		// Transfers the stored pref into the instance
		this.#prefContent = {};
		for (const key in this.#default_prefContent) {
			this.#prefContent[key] =
				storedPref[key] ?? storedPref[this.#legacyKey[key]] ?? this.#default_prefContent[key];
			if (typeof this.#prefContent[key] !== typeof this.#default_prefContent[key]) {
				this.reset(key);
			}
		}
		// Updating from before v1.7.5
		// Converts from legacy format to query selector format
		if (this.#prefContent.version < [1, 7, 5]) {
			// Clears possible empty policies
			delete this.#prefContent.siteList[undefined];
			for (const site in this.#prefContent.siteList) {
				const legacyPolicy = this.#prefContent.siteList[site];
				if (typeof legacyPolicy !== "string") {
					continue;
				} else if (legacyPolicy.startsWith("TAG_")) {
					this.#prefContent.siteList[site] = legacyPolicy.replace("TAG_", "QS_");
				} else if (legacyPolicy.startsWith("CLASS_")) {
					this.#prefContent.siteList[site] = legacyPolicy.replace("CLASS_", "QS_.");
				} else if (legacyPolicy.startsWith("ID_")) {
					this.#prefContent.siteList[site] = legacyPolicy.replace("ID_", "QS_#");
				} else if (legacyPolicy.startsWith("NAME_")) {
					this.#prefContent.siteList[site] = `${legacyPolicy.replace("NAME_", "QS_[name='")}']`;
				} else if (legacyPolicy === "") {
					delete this.#prefContent.siteList[site];
				}
			}
		}
		// Updating from before v2.2
		if (this.#prefContent.version < [2, 2]) {
			// Turns on allow dark / light tab bar, dynamic, and no theme colour settings for once
			this.#prefContent.allowDarkLight = true;
			this.#prefContent.dynamic = true;
			this.#prefContent.noThemeColour = true;
			// Re-formatting site list
			const newSiteList = {};
			let id = 1;
			for (const site in this.#prefContent.siteList) {
				const legacyPolicy = this.#prefContent.siteList[site];
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
			this.#prefContent.siteList = newSiteList;
		}
		// Makes sure colour offset values are stored in integer
		this.#prefContent.tabbar = x100IfSmallerThan1(this.#prefContent.tabbar);
		this.#prefContent.tabbarBorder = x100IfSmallerThan1(this.#prefContent.tabbarBorder);
		this.#prefContent.tabSelected = x100IfSmallerThan1(this.#prefContent.tabSelected);
		this.#prefContent.tabSelectedBorder = x100IfSmallerThan1(this.#prefContent.tabSelectedBorder);
		this.#prefContent.toolbar = x100IfSmallerThan1(this.#prefContent.toolbar);
		this.#prefContent.toolbarBorder = x100IfSmallerThan1(this.#prefContent.toolbarBorder);
		this.#prefContent.toolbarField = x100IfSmallerThan1(this.#prefContent.toolbarField);
		this.#prefContent.toolbarFieldBorder = x100IfSmallerThan1(this.#prefContent.toolbarFieldBorder);
		this.#prefContent.toolbarFieldOnFocus = x100IfSmallerThan1(this.#prefContent.toolbarFieldOnFocus);
		this.#prefContent.sidebar = x100IfSmallerThan1(this.#prefContent.sidebar);
		this.#prefContent.sidebarBorder = x100IfSmallerThan1(this.#prefContent.sidebarBorder);
		this.#prefContent.popup = x100IfSmallerThan1(this.#prefContent.popup);
		this.#prefContent.popupBorder = x100IfSmallerThan1(this.#prefContent.popupBorder);
		// Updates the pref version
		this.#prefContent.version = addonVersion;
		await this.save();
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
		return this.#prefContent.siteList[this.getPolicyId(site, headerType)];
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
		for (const id in this.#prefContent.siteList) {
			const policy = this.#prefContent.siteList[id];
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
		while (id in this.#prefContent.siteList) id++;
		this.#prefContent.siteList[id] = policy;
		return id;
	}

	/**
	 * Removes a policy from the site list by setting the policy to `null`.
	 *
	 * @param {number | string} id The ID of a policy.
	 */
	removePolicy(id) {
		this.#prefContent.siteList[id] = null;
	}

	/**
	 * Resets a single preference if a valid key is specified.
	 *
	 * Resets all preferences if the key is not specified or invalid.
	 *
	 * @param {string | null} key
	 */
	reset(key = null) {
		if (key in this.#default_prefContent) {
			this.#prefContent[key] = this.#default_prefContent[key];
		} else {
			this.#prefContent = {};
			for (const key in this.#default_prefContent) {
				this.#prefContent[key] = this.#default_prefContent[key];
			}
		}
	}

	/**
	 * Loads the preferences from the browser storage to the instance.
	 */
	async load() {
		this.#prefContent = await browser.storage.local.get();
	}

	/**
	 * Stores the preferences from the instance to the browser storage.
	 */
	async save() {
		await browser.storage.local.clear();
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

	get siteList() {
		return this.#prefContent.siteList;
	}
	set siteList(value) {
		this.#prefContent.siteList = value;
	}

	get version() {
		return this.#prefContent.version;
	}
	set version(value) {
		this.#prefContent.version = value;
	}
}

/**
 * @param {number} num
 */
function x100IfSmallerThan1(num) {
	if (-1 < num && num < 1) return Math.round(num * 100);
	else return +num;
}
