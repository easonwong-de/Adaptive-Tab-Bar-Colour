import { addonVersion, defaultPref } from "./constants.js";
import { supportsThemeAPI } from "./utility.js";
import colour from "./colour.js";

export default class preference {
	/** The content of the preference */
	#content = { ...defaultPref };

	/** Initialises the preferences by loading from storage and normalising. */
	async initialise() {
		const { storedPref, removedKeys } = this.#normalise(
			await browser.storage.local.get(),
		);
		for (const key in storedPref) {
			await this.#set(key, storedPref[key]);
		}
		removedKeys.forEach(
			async (key) => await browser.storage.local.remove(key),
		);
		if (!supportsThemeAPI()) this.#set("compatibilityMode", true);
	}

	/**
	 * Resets a specific preference or all preferences to default values.
	 *
	 * @param {string} [key] - The specific preference key to reset.
	 */
	async reset(key = undefined) {
		if (key in defaultPref) {
			await this.#set(key, defaultPref[key]);
		} else {
			this.#content = { ...defaultPref };
			await browser.storage.local.set(this.#content);
		}
	}

	/**
	 * Sets a preference value and saves it to storage.
	 *
	 * @param {string} key - The preference key.
	 * @param {any} value - The value to set.
	 */
	async #set(key, value) {
		if (typeof value !== typeof defaultPref[key]) value = defaultPref[key];
		switch (key) {
			case "tabbar":
			case "tabbarBorder":
			case "tabSelected":
			case "tabSelectedBorder":
			case "toolbar":
			case "toolbarBorder":
			case "toolbarField":
			case "toolbarFieldBorder":
			case "toolbarFieldOnFocus":
			case "sidebar":
			case "sidebarBorder":
			case "popup":
			case "popupBorder":
				value = this.#normaliseNumericPref(value, {
					min: -50,
					max: 50,
					step: 1,
				});
				break;
			case "minContrast_light":
			case "minContrast_dark":
				value = this.#normaliseNumericPref(value, {
					min: 0,
					max: 210,
					step: 5,
				});
				break;
			case "siteList":
				for (const id in value)
					if (!this.#validatePolicy(value[id])) value[id] = null;
				break;
			default:
				break;
		}
		this.#content[key] = value;
		await browser.storage.local.set(key, value);
	}

	/**
	 * Validates a policy object structure.
	 *
	 * @param {object} policy - The policy to validate.
	 * @returns {boolean} `true` if the policy is valid.
	 */
	#validatePolicy(policy) {
		return (
			typeof policy === "object" &&
			typeof policy.header === "string" &&
			((policy.headerType === "URL" &&
				((policy.type === "THEME_COLOUR" &&
					typeof policy.value === "boolean") ||
					(policy.type === "QUERY_SELECTOR" &&
						typeof policy.value === "string"))) ||
				((policy.headerType === "URL" ||
					policy.headerType === "ADDON_ID") &&
					policy.type === "COLOUR" &&
					typeof policy.value === "string"))
		);
	}

	/**
	 * Normalises a numeric preference within constraints.
	 *
	 * Applies min/max bounds, and rounds to the nearest step.
	 *
	 * @private
	 * @param {number} num - The number to validate.
	 * @param {number} min - The minimum allowed value.
	 * @param {number} max - The maximum allowed value.
	 * @param {number} step - The step size for rounding.
	 * @returns {number} The validated and adjusted number.
	 */
	#normaliseNumericPref(num, { min, max, step }) {
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
	 * Normalises and migrates preferences from older versions.
	 *
	 * @param {object} content - The stored preference content.
	 * @returns {{ result: object; removedKeys: string[] }} The normalised
	 *   preferences and removed keys.
	 */
	#normalise(content) {
		if (
			typeof content !== "object" ||
			content?.version < [2, 0] ||
			JSON.stringify(content.version) === "[2,2,1]"
		) {
			return { result: { ...defaultPref }, removedKeys: [] };
		} else {
			const result = { ...defaultPref, ...content };
			const removedKeys = [];
			for (const key in result) {
				if (!(key in defaultPref)) {
					delete result[key];
					removedKeys.push(key);
				}
			}
			if (result.version < [2, 2]) {
				result.allowDarkLight = true;
				result.dynamic = true;
				result.noThemeColour = true;
				const siteList = {};
				let id = 1;
				for (const site in result.siteList) {
					const policy = result.siteList[site];
					if (typeof policy !== "string") {
						continue;
					} else if (policy === "IGNORE_THEME") {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "THEME_COLOUR",
							value: false,
						};
					} else if (policy === "UN_IGNORE_THEME") {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "THEME_COLOUR",
							value: true,
						};
					} else if (policy.startsWith("QS_")) {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "QUERY_SELECTOR",
							value: policy.replace("QS_", ""),
						};
					} else if (site.startsWith("Add-on ID: ")) {
						siteList[id++] = {
							headerType: "ADDON_ID",
							header: site.replace("Add-on ID: ", ""),
							type: "COLOUR",
							value: new colour(policy, false).toHex(),
						};
					} else {
						siteList[id++] = {
							headerType: "URL",
							header: site,
							type: "COLOUR",
							value: new colour(policy, false).toHex(),
						};
					}
				}
				result.siteList = siteList;
			}
			if (result.version < [2, 4]) {
				browser.theme.reset();
				if (result.minContrast_light === 165)
					result.minContrast_light = 90;
			}
			result.version = addonVersion;
			return { result, removedKeys };
		}
	}

	/**
	 * Exports preferences as a JSON string.
	 *
	 * @returns {string} The preferences as JSON.
	 */
	exportJSON() {
		return JSON.stringify(this.#content);
	}

	/**
	 * Imports preferences from a JSON string.
	 *
	 * @param {string} jsonString - The JSON string to import.
	 * @returns {Promise<boolean>} `true` if import succeeded, `false`
	 *   otherwise.
	 */
	async importPref(jsonString) {
		try {
			const parsedPref = this.#normalise(JSON.parse(jsonString)).result;
			for (const key in parsedPref) await this.#set(key, parsedPref[key]);
			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Adds a new policy to the site list.
	 *
	 * @param {object} policy - The policy to add.
	 */
	async addPolicy(policy) {
		let id = 1;
		while (id in this.#content.siteList) id++;
		await this.setPolicy(id, policy);
	}

	/**
	 * Sets a policy at a specific ID.
	 *
	 * @param {number} id - The policy ID.
	 * @param {object} policy - The policy to set.
	 */
	async setPolicy(id, policy) {
		if (!this.#validatePolicy(policy)) return;
		this.#content.siteList[id] = policy;
		await browser.storage.local.set("siteList", this.#content.siteList);
	}

	/**
	 * Removes a policy by setting it to null.
	 *
	 * @param {number} id - The policy ID to remove.
	 */
	async removePolicy(id) {
		this.#content.siteList[id] = null;
		await browser.storage.local.set("siteList", this.#content.siteList);
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
	 * @param {string} query - The site URL or add-on ID to match.
	 * @returns {{ id: number; policy: object | undefined }} Object containing
	 *   the matched policy ID (0 if not found) and the policy object.
	 */
	getPolicy(query) {
		let matchedId = 0;
		let matchedPolicy;
		for (const id in this.#content.siteList) {
			const policy = this.#content.siteList[id];
			if (
				policy.headerType === "ADDON_ID"
					? policy.header === query
					: policy.headerType === "URL" &&
						(policy.header === query ||
							policy.header === `${query}/` ||
							this.#testRegex(query, policy.header) ||
							this.#testWildcard(query, policy.header) ||
							this.#testHostname(query, policy.header))
			) {
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
