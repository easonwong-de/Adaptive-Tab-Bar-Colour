"use strict";

import {
	addonVersion,
	default_homeBackground_light,
	default_homeBackground_dark,
	default_fallbackColour_light,
	default_fallbackColour_dark,
	default_compatibilityMode,
} from "./constants.js";
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

	/** Loads preferences from browser storage into this instance. */
	async load() {
		this.#content = await browser.storage.local.get();
	}

	/** Saves preferences from this instance to browser storage. */
	async save() {
		await browser.storage.local.set(this.#content);
	}

	/**
	 * Validates that preferences content has the correct structure and types.
	 *
	 * Checks that all properties exist and have the expected data types
	 * compared to the default content.
	 *
	 * @returns {boolean} `true` if all properties have correct types, `false`
	 *   otherwise.
	 */
	valid() {
		if (
			Object.keys(this.#content).length !==
			Object.keys(this.#defaultContent).length
		)
			return false;
		for (const key in this.#defaultContent) {
			if (typeof this.#content[key] !== typeof this.#defaultContent[key])
				return false;
		}
		return true;
	}

	/**
	 * Resets preferences to default values.
	 *
	 * If a valid key is provided, resets only that preference. Otherwise,
	 * resets all preferences to their default values.
	 *
	 * @param {string | undefined} [key=undefined] - The preference key to
	 *   reset, or `undefined` to reset all preferences. Default is `undefined`
	 */
	reset(key = undefined) {
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
	 * Normalises preferences content to ensure compatibility and consistency.
	 *
	 * Handles version migrations, validates numeric preferences, and ensures
	 * compatibility mode is enabled when theme API is not supported.
	 */
	async normalise() {
		if (
			!this.#content.version ||
			this.#content.version < [2, 0] ||
			JSON.stringify(this.#content.version) === "[2,2,1]"
		) {
			this.reset();
			await this.save();
			return;
		}
		const oldContent = Object.assign({}, this.#content);
		this.#content = {};
		for (const key in this.#defaultContent) {
			this.#content[key] =
				typeof oldContent[key] === typeof this.#defaultContent[key]
					? oldContent[key]
					: this.#defaultContent[key];
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
						value: new colour(legacyPolicy).toHex(),
					};
				} else {
					newSiteList[id++] = {
						headerType: "URL",
						header: site,
						type: "COLOUR",
						value: new colour(legacyPolicy).toHex(),
					};
				}
			}
			this.#content.siteList = newSiteList;
		}
		// Updating from before v2.4
		if (this.#content.version < [2, 4]) {
			browser.theme.reset();
			if (this.#content.minContrast_light === 165)
				this.#content.minContrast_light = 90;
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
			this.#content[key] = this.#validateNumericPref(this.#content[key], {
				min: -50,
				max: 50,
				step: 5,
			});
		});
		["minContrast_light", "minContrast_dark"].forEach((key) => {
			this.#content[key] = this.#validateNumericPref(this.#content[key], {
				min: 0,
				max: 210,
				step: 15,
			});
		});
		// Auto-enable compatibility mode if theme API is not supported
		if (!supportsThemeAPI()) {
			this.#content.compatibilityMode = true;
		}
		// Updates the pref version
		this.#content.version = addonVersion;
	}

	/**
	 * Converts preferences to a JSON string.
	 *
	 * @returns {string} The JSON string representation of the preferences.
	 */
	prefToJSON() {
		return JSON.stringify(this.#content);
	}

	/**
	 * Loads preferences from a JSON string and normalises them.
	 *
	 * @param {string} JSONString - The JSON string to parse and load.
	 * @returns {Promise<boolean>} `true` if successfully parsed and loaded,
	 *   `false` if the JSON string is invalid.
	 */
	async JSONToPref(JSONString) {
		try {
			const parsedJSON = JSON.parse(JSONString);
			if (typeof parsedJSON !== "object" || parsedJSON === null)
				return false;
			this.#content = parsedJSON;
			await this.normalise();
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Adds a policy to the site list.
	 *
	 * @param {object} policy - The policy object to add.
	 * @returns {number} The assigned ID of the added policy.
	 */
	addPolicy(policy) {
		let id = 1;
		while (id in this.#content.siteList) id++;
		this.#content.siteList[id] = policy;
		return id;
	}

	/**
	 * Sets a policy at the specified ID.
	 *
	 * @param {number} id - The ID where to set the policy.
	 * @param {object} policy - The policy object to set.
	 */
	setPolicy(id, policy) {
		this.#content.siteList[id] = policy;
	}

	/**
	 * Removes a policy from the site list by setting it to `null`.
	 *
	 * @param {number} id - The ID of the policy to remove.
	 */
	removePolicy(id) {
		this.#content.siteList[id] = null;
	}

	/**
	 * Finds the most recently created policy that matches the given input.
	 *
	 * For URL header types, supports:
	 *
	 * - Full URL with or without trailing slash
	 * - Regular expressions
	 * - Wildcard patterns:
	 *
	 *   - `**` matches any string of any length
	 *   - `*` matches any characters except `/`, `.`, and `:`
	 *   - `?` matches any single character
	 *   - Scheme (e.g., `https://`) is optional
	 * - Hostname matching
	 *
	 * For add-on ID header types, performs exact string matching.
	 *
	 * @param {string} input - The site URL or add-on ID to match.
	 * @returns {{ id: number; policy: object | undefined }} Object containing
	 *   the matched policy ID (0 if not found) and the policy object.
	 */
	getPolicy(input) {
		let matchedId = 0;
		let matchedPolicy;
		for (const id in this.#content.siteList) {
			const policy = this.#content.siteList[id];
			if (!policy || policy?.header === "") continue;
			const isMatch =
				policy.headerType === "ADDON_ID"
					? policy.header === input
					: policy.headerType === "URL" &&
						(policy.header === input ||
							policy.header === `${input}/` ||
							this.#testRegex(input, policy.header) ||
							this.#testWildcard(input, policy.header) ||
							this.#testHostname(input, policy.header));
			if (isMatch) {
				matchedId = +id;
				matchedPolicy = policy;
			}
		}
		return { id: matchedId, policy: matchedPolicy };
	}

	/**
	 * Tests if a URL matches a regular expression pattern.
	 *
	 * @private
	 * @param {string} url - The URL to test.
	 * @param {string} regex - The regular expression pattern.
	 * @returns {boolean} `true` if the URL matches the pattern, `false`
	 *   otherwise.
	 */
	#testRegex(url, regex) {
		try {
			return new RegExp(`^${regex}$`, "i").test(url);
		} catch (error) {
			return false;
		}
	}

	/**
	 * Tests if a URL matches a wildcard pattern.
	 *
	 * Converts wildcard patterns to regular expressions and tests the URL.
	 * Supports `**` (match all), `*` (match except `/.:`) and `?` (single
	 * char).
	 *
	 * @private
	 * @param {string} url - The URL to test.
	 * @param {string} wildcard - The wildcard pattern.
	 * @returns {boolean} `true` if the URL matches the pattern, `false`
	 *   otherwise.
	 */
	#testWildcard(url, wildcard) {
		if (wildcard.includes("*") || wildcard.includes("?")) {
			try {
				const wildcardPattern = wildcard
					.replace(/[.+^${}()|[\]\\]/g, "\\$&")
					.replace(/\*\*/g, "::WILDCARD_MATCH_ALL::")
					.replace(/\*/g, "[^/.:]*")
					.replace(/\?/g, ".")
					.replace(/::WILDCARD_MATCH_ALL::/g, ".*")
					.replace(/^([a-z]+:\/\/)/i, "$1")
					.replace(/^((?![a-z]+:\/\/).)/i, "(?:[a-z]+:\\/\\/)?$1");
				return new RegExp(`^${wildcardPattern}/?$`, "i").test(url);
			} catch (error) {
				return false;
			}
		} else {
			return false;
		}
	}

	/**
	 * Tests if a URL matches a specific hostname.
	 *
	 * @private
	 * @param {string} url - The URL to test.
	 * @param {string} hostname - The hostname to match.
	 * @returns {boolean} `true` if the URL's hostname matches, `false`
	 *   otherwise.
	 */
	#testHostname(url, hostname) {
		try {
			return hostname === new URL(url).hostname;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Validates and adjusts a numeric preference within constraints.
	 *
	 * Handles percentage conversion, applies min/max bounds, and rounds to the
	 * nearest step value.
	 *
	 * @private
	 * @param {number} num - The number to validate.
	 * @param {object} constraints - The validation constraints.
	 * @param {number} constraints.min - The minimum allowed value.
	 * @param {number} constraints.max - The maximum allowed value.
	 * @param {number} constraints.step - The step size for rounding.
	 * @returns {number} The validated and adjusted number.
	 */
	#validateNumericPref(num, { min, max, step }) {
		if (-1 < num && num < 1) num = Math.round(num * 100);
		num = Math.max(min, Math.min(max, num));
		const remainder = (num - min) % step;
		if (remainder !== 0)
			num =
				remainder >= step / 2
					? num + (step - remainder)
					: num - remainder;
		return Math.round(num);
	}

	/**
	 * Gets whether dark/light scheme switching is allowed.
	 *
	 * @returns {boolean} `true` if scheme switching is allowed.
	 */
	get allowDarkLight() {
		return this.#content.allowDarkLight;
	}

	/**
	 * Sets whether dark/light scheme switching is allowed.
	 *
	 * @param {boolean} value - Whether to allow scheme switching.
	 */
	set allowDarkLight(value) {
		this.#content.allowDarkLight = value;
	}

	/**
	 * Gets whether dynamic colour extraction is enabled.
	 *
	 * @returns {boolean} `true` if dynamic colour extraction is enabled.
	 */
	get dynamic() {
		return this.#content.dynamic;
	}

	/**
	 * Sets whether dynamic colour extraction is enabled.
	 *
	 * @param {boolean} value - Whether to enable dynamic colour extraction.
	 */
	set dynamic(value) {
		this.#content.dynamic = value;
	}

	/**
	 * Gets whether theme colour should be ignored by default.
	 *
	 * @returns {boolean} `true` if theme colours are ignored by default.
	 */
	get noThemeColour() {
		return this.#content.noThemeColour;
	}

	/**
	 * Sets whether theme colour should be ignored by default.
	 *
	 * @param {boolean} value - Whether to ignore theme colours by default.
	 */
	set noThemeColour(value) {
		this.#content.noThemeColour = value;
	}

	/**
	 * Gets whether compatibility mode is enabled.
	 *
	 * @returns {boolean} `true` if compatibility mode is enabled.
	 */
	get compatibilityMode() {
		return this.#content.compatibilityMode;
	}

	/**
	 * Sets whether compatibility mode is enabled.
	 *
	 * @param {boolean} value - Whether to enable compatibility mode.
	 */
	set compatibilityMode(value) {
		this.#content.compatibilityMode = value;
	}

	/**
	 * Gets the tab bar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabbar() {
		return this.#content.tabbar;
	}

	/**
	 * Sets the tab bar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabbar(value) {
		this.#content.tabbar = value;
	}

	/**
	 * Gets the tab bar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabbarBorder() {
		return this.#content.tabbarBorder;
	}

	/**
	 * Sets the tab bar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabbarBorder(value) {
		this.#content.tabbarBorder = value;
	}

	/**
	 * Gets the selected tab brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabSelected() {
		return this.#content.tabSelected;
	}

	/**
	 * Sets the selected tab brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabSelected(value) {
		this.#content.tabSelected = value;
	}

	/**
	 * Gets the selected tab border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get tabSelectedBorder() {
		return this.#content.tabSelectedBorder;
	}

	/**
	 * Sets the selected tab border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set tabSelectedBorder(value) {
		this.#content.tabSelectedBorder = value;
	}

	/**
	 * Gets the toolbar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbar() {
		return this.#content.toolbar;
	}

	/**
	 * Sets the toolbar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbar(value) {
		this.#content.toolbar = value;
	}

	/**
	 * Gets the toolbar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarBorder() {
		return this.#content.toolbarBorder;
	}

	/**
	 * Sets the toolbar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarBorder(value) {
		this.#content.toolbarBorder = value;
	}

	/**
	 * Gets the toolbar field brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarField() {
		return this.#content.toolbarField;
	}

	/**
	 * Sets the toolbar field brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarField(value) {
		this.#content.toolbarField = value;
	}

	/**
	 * Gets the toolbar field border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarFieldBorder() {
		return this.#content.toolbarFieldBorder;
	}

	/**
	 * Sets the toolbar field border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarFieldBorder(value) {
		this.#content.toolbarFieldBorder = value;
	}

	/**
	 * Gets the toolbar field on focus brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get toolbarFieldOnFocus() {
		return this.#content.toolbarFieldOnFocus;
	}

	/**
	 * Sets the toolbar field on focus brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set toolbarFieldOnFocus(value) {
		this.#content.toolbarFieldOnFocus = value;
	}

	/**
	 * Gets the sidebar brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get sidebar() {
		return this.#content.sidebar;
	}

	/**
	 * Sets the sidebar brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set sidebar(value) {
		this.#content.sidebar = value;
	}

	/**
	 * Gets the sidebar border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get sidebarBorder() {
		return this.#content.sidebarBorder;
	}

	/**
	 * Sets the sidebar border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set sidebarBorder(value) {
		this.#content.sidebarBorder = value;
	}

	/**
	 * Gets the popup brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get popup() {
		return this.#content.popup;
	}

	/**
	 * Sets the popup brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set popup(value) {
		this.#content.popup = value;
	}

	/**
	 * Gets the popup border brightness adjustment value.
	 *
	 * @returns {number} The brightness adjustment.
	 */
	get popupBorder() {
		return this.#content.popupBorder;
	}

	/**
	 * Sets the popup border brightness adjustment value.
	 *
	 * @param {number} value - The brightness adjustment.
	 */
	set popupBorder(value) {
		this.#content.popupBorder = value;
	}

	/**
	 * Gets the minimum contrast ratio for light theme (times 10).
	 *
	 * @returns {number} The minimum contrast ratio (0-210).
	 */
	get minContrast_light() {
		return this.#content.minContrast_light;
	}

	/**
	 * Sets the minimum contrast ratio for light theme (times 10).
	 *
	 * @param {number} value - The minimum contrast ratio (0-210).
	 */
	set minContrast_light(value) {
		this.#content.minContrast_light = value;
	}

	/**
	 * Gets the minimum contrast ratio for dark theme (times 10).
	 *
	 * @returns {number} The minimum contrast ratio (0-210).
	 */
	get minContrast_dark() {
		return this.#content.minContrast_dark;
	}

	/**
	 * Sets the minimum contrast ratio for dark theme (times 10).
	 *
	 * @param {number} value - The minimum contrast ratio (0-210).
	 */
	set minContrast_dark(value) {
		this.#content.minContrast_dark = value;
	}

	/**
	 * Gets the home background colour for light theme.
	 *
	 * @returns {string} The background colour as a hex string.
	 */
	get homeBackground_light() {
		return this.#content.homeBackground_light;
	}

	/**
	 * Sets the home background colour for light theme.
	 *
	 * @param {string} value - The background colour as a hex string.
	 */
	set homeBackground_light(value) {
		this.#content.homeBackground_light = value;
	}

	/**
	 * Gets the home background colour for dark theme.
	 *
	 * @returns {string} The background colour as a hex string.
	 */
	get homeBackground_dark() {
		return this.#content.homeBackground_dark;
	}

	/**
	 * Sets the home background colour for dark theme.
	 *
	 * @param {string} value - The background colour as a hex string.
	 */
	set homeBackground_dark(value) {
		this.#content.homeBackground_dark = value;
	}

	/**
	 * Gets the fallback colour for light theme.
	 *
	 * @returns {string} The fallback colour as a hex string.
	 */
	get fallbackColour_light() {
		return this.#content.fallbackColour_light;
	}

	/**
	 * Sets the fallback colour for light theme.
	 *
	 * @param {string} value - The fallback colour as a hex string.
	 */
	set fallbackColour_light(value) {
		this.#content.fallbackColour_light = value;
	}

	/**
	 * Gets the fallback colour for dark theme.
	 *
	 * @returns {string} The fallback colour as a hex string.
	 */
	get fallbackColour_dark() {
		return this.#content.fallbackColour_dark;
	}

	/**
	 * Sets the fallback colour for dark theme.
	 *
	 * @param {string} value - The fallback colour as a hex string.
	 */
	set fallbackColour_dark(value) {
		this.#content.fallbackColour_dark = value;
	}

	/**
	 * Gets the site-specific policies list.
	 *
	 * @returns {object} The site list containing ID-keyed policy objects.
	 */
	get siteList() {
		return this.#content.siteList;
	}

	/**
	 * Sets the site-specific policies list.
	 *
	 * @param {object} value - The site list containing ID-keyed policy objects.
	 */
	set siteList(value) {
		this.#content.siteList = value;
	}

	/**
	 * Gets the preferences version number.
	 *
	 * @returns {number[]} The version as an array of numbers.
	 */
	get version() {
		return this.#content.version;
	}

	/**
	 * Sets the preferences version number.
	 *
	 * @param {number[]} value - The version as an array of numbers.
	 */
	set version(value) {
		this.#content.version = value;
	}
}
