"use strict";

import {
	addonVersion,
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_compatibilityMode,
} from "./default_values.js";
import colour from "./colour.js";
import { supportsThemeAPI } from "./utility.js";

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
		compatibilityMode: default_compatibilityMode,
		homeBackground_light: default_homeBackground_light,
		homeBackground_dark: default_homeBackground_dark,
		fallbackColour_light: default_fallbackColour_light,
		fallbackColour_dark: default_fallbackColour_dark,
		siteList: {},
		version: addonVersion,
	};

	/** Default content of the preference */
	#defaultContent = {
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
		compatibilityMode: default_compatibilityMode,
		homeBackground_light: default_homeBackground_light,
		homeBackground_dark: default_homeBackground_dark,
		fallbackColour_light: default_fallbackColour_light,
		fallbackColour_dark: default_fallbackColour_dark,
		siteList: {},
		version: addonVersion,
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
		await browser.storage.local.set(this.#content);
	}

	/**
	 * Validates that each property in the `#prefContent` object has the expected data type.
	 *
	 * @returns {boolean} Returns `true` if all properties have the correct data types, otherwise `false`.
	 */
	valid() {
		if (Object.keys(this.#content).length !== Object.keys(this.#defaultContent).length) return false;
		for (const key in this.#defaultContent) {
			if (typeof this.#content[key] !== typeof this.#defaultContent[key]) return false;
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
		if (key in this.#defaultContent) {
			this.#content[key] = this.#defaultContent[key];
		} else {
			this.#content = {};
			for (const key in this.#defaultContent) {
				this.#content[key] = this.#defaultContent[key];
			}
		}
	}

	/**
	 * Normalises the preferences content to a consistent format.
	 *
	 * If the existing preferences don't have a version number, date back before v2.0, or has the version number of 2.2.1, the default pref will overwrite the old pref.
	 */
	async normalise() {
		if (
			(!this.#content.last_version && !this.#content.version) ||
			(this.#content.last_version && this.#content.last_version < [2, 0]) ||
			(this.#content.version && JSON.stringify(this.#content.version) === "[2,2,1]")
		) {
			this.reset();
			await this.save();
			return;
		}
		// Transfers the stored pref into the instance
		const oldContent = Object.assign({}, this.#content);
		this.#content = {};
		for (const key in this.#defaultContent) {
			this.#content[key] = oldContent[key] ?? this.#defaultContent[key];
			if (typeof this.#content[key] !== typeof this.#defaultContent[key]) this.reset(key);
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
						value: new colour().parse(legacyPolicy).toHex(),
					};
				} else {
					newSiteList[id++] = {
						headerType: "URL",
						header: site,
						type: "COLOUR",
						value: new colour().parse(legacyPolicy).toHex(),
					};
				}
			}
			this.#content.siteList = newSiteList;
		}
		// Updating from before v2.4
		if (this.#content.version < [2, 4]) {
			browser.theme.reset();
			if (this.#content.minContrast_light === 165) this.#content.minContrast_light = 90;
		}
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
			this.#content[key] = this.#validateNumericPref(this.#content[key], { min: -50, max: 50, step: 5 });
		});
		["minContrast_light", "minContrast_dark"].forEach((key) => {
			this.#content[key] = this.#validateNumericPref(this.#content[key], { min: 0, max: 210, step: 15 });
		});
		// Auto-enable compatibility mode if theme API is not supported
		if (!supportsThemeAPI()) {
			this.#content.compatibilityMode = true;
		}
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
	 * Returns the policy for a policy ID from the site list.
	 *
	 * Newly added policies have higher priority.
	 *
	 * Returns `undefined` if nothing matches.
	 *
	 * @param {number} id - Policy ID.
	 */
	getPolicy(id) {
		return this.#content.siteList[id];
	}

	/**
	 * Adds a policy to the site list.
	 *
	 * @param {object} policy - The policy to add.
	 * @returns The ID of the policy.
	 */
	addPolicy(policy) {
		let id = 1;
		while (id in this.#content.siteList) id++;
		this.#content.siteList[id] = policy;
		return id;
	}

	/**
	 * Sets a certain policy to a given ID.
	 *
	 * @param {number} id - The ID of the policy.
	 * @param {object} policy - The new policy.
	 */
	setPolicy(id, policy) {
		this.#content.siteList[id] = policy;
	}

	/**
	 * Removes a policy from the site list by setting the policy to `null`.
	 *
	 * @param {number} id - The ID of a policy.
	 */
	removePolicy(id) {
		this.#content.siteList[id] = null;
	}

	/**
	 * Finds the ID of the most recently created policy from the site list that matches the given URL.
	 *
	 * Policy header supports:
	 *
	 * - Full URL with or w/o trailing slash
	 * - Regex
	 * - Wildcard
	 *   - `**` matches strings of any length
	 *   - `*` matches any characters except `/`, `.`, and `:`
	 *   - `?` matches any single character
	 *   - Scheme (e.g. `https://`) is optional
	 * - hostname
	 *
	 * @param {string} url - The site URL to match against the policy headers.
	 * @returns {number} The ID of the most specific matching policy, or 0 if no match is found.
	 */
	getURLPolicyId(url) {
		let result = 0;
		for (const id in this.#content.siteList) {
			const policy = this.#content.siteList[id];
			if (!policy || policy.header === "" || policy.headerType !== "URL") continue;
			if (id > result && (policy.header === url || policy.header === `${url}/`)) {
				result = +id;
				continue;
			}
			try {
				if (id > result && new RegExp(`^${policy.header}$`, "i").test(url)) {
					result = +id;
					continue;
				}
			} catch (error) {}
			if (policy.header.includes("*") || policy.header.includes("?")) {
				try {
					const wildcardPattern = policy.header
						.replace(/[.+^${}()|[\]\\]/g, "\\$&")
						.replace(/\*\*/g, "::WILDCARD_MATCH_ALL::")
						.replace(/\*/g, "[^/.:]*")
						.replace(/\?/g, ".")
						.replace(/::WILDCARD_MATCH_ALL::/g, ".*")
						.replace(/^([a-z]+:\/\/)/i, "$1")
						.replace(/^((?![a-z]+:\/\/).)/i, "(?:[a-z]+:\\/\\/)?$1");
					if (id > result && new RegExp(`^${wildcardPattern}/?$`, "i").test(url)) {
						result = +id;
						continue;
					}
				} catch (error) {}
			}
			try {
				if (id > result && policy.header === new URL(url).hostname) {
					result = +id;
					continue;
				}
			} catch (error) {}
		}
		return result;
	}

	/**
	 * Retrieves the policy ID that matches the given add-on ID.
	 *
	 * If multiple policies for the same add-on ID are present, return the ID of the most recently created one.
	 *
	 * @param {string} addonId - The add-on ID to match against the policy list.
	 * @returns {number} The ID of the matching policy, or 0 if no match is found.
	 */
	getAddonPolicyId(addonId) {
		let result = 0;
		for (const id in this.#content.siteList) {
			const policy = this.#content.siteList[id];
			if (!policy || policy?.headerType !== "ADDON_ID") continue;
			if (id > result && policy.header === addonId) {
				result = +id;
				continue;
			}
		}
		return result;
	}

	/**
	 * Validates and adjusts a numeric preference based on given constraints.
	 *
	 * @param {number} num The number to validate.
	 * @param {object} options The constraints for validation.
	 * @param {number} options.min The minimum allowed value.
	 * @param {number} options.max The maximum allowed value.
	 * @param {number} options.step The step size for rounding.
	 * @returns {number} The validated and adjusted number.
	 */
	#validateNumericPref(num, { min, max, step }) {
		if (-1 < num && num < 1) num = Math.round(num * 100);
		num = Math.max(min, Math.min(max, num));
		const remainder = (num - min) % step;
		if (remainder !== 0) num = remainder >= step / 2 ? num + (step - remainder) : num - remainder;
		return Math.round(num);
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

	get compatibilityMode() {
		return this.#content.compatibilityMode;
	}

	set compatibilityMode(value) {
		this.#content.compatibilityMode = value;
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
